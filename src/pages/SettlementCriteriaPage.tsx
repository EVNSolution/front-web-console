import { FormEvent, useEffect, useState } from 'react';

import { getErrorMessage, type HttpClient } from '../api/http';
import { listCompanies, listFleets } from '../api/organization';
import {
  createSettlementPricingTable,
  getSettlementConfig,
  getSettlementConfigMetadata,
  listSettlementPricingTables,
  updateSettlementConfig,
  updateSettlementPricingTable,
  type CompanyFleetPricingTablePayload,
  type SettlementConfigPayload,
} from '../api/settlementRegistry';
import type {
  Company,
  CompanyFleetPricingTable,
  Fleet,
  SettlementConfig,
  SettlementConfigMetadata,
} from '../types';

type SettlementCriteriaPageProps = {
  client: HttpClient;
};

const EMPTY_CONFIG: SettlementConfig = {
  singleton_key: 'global',
  income_tax_rate: '',
  vat_tax_rate: '',
  reported_amount_rate: '',
  national_pension_rate: '',
  health_insurance_rate: '',
  medical_insurance_rate: '',
  employment_insurance_rate: '',
  industrial_accident_insurance_rate: '',
  special_employment_insurance_rate: '',
  special_industrial_accident_insurance_rate: '',
  two_insurance_min_settlement_amount: '',
  meal_allowance: '',
};

type ConfigFieldKey = keyof Omit<SettlementConfig, 'singleton_key'>;
type PricingFieldKey = keyof Omit<CompanyFleetPricingTable, 'pricing_table_id' | 'company_id' | 'fleet_id'>;

const EMPTY_PRICING_FORM: Record<PricingFieldKey, string> = {
  box_sale_unit_price: '',
  box_purchase_unit_price: '',
  overtime_fee: '',
};

function getInputStep(decimalPrecision: number | undefined, integerOnly: boolean | undefined) {
  if (integerOnly) {
    return '1';
  }
  if (!decimalPrecision) {
    return undefined;
  }
  return decimalPrecision <= 0 ? undefined : `0.${'0'.repeat(Math.max(decimalPrecision - 1, 0))}1`;
}

function getDisplayFieldValue(config: SettlementConfig, fieldKey: string) {
  return config[fieldKey as ConfigFieldKey] ?? '';
}

export function SettlementCriteriaPage({ client }: SettlementCriteriaPageProps) {
  const [metadata, setMetadata] = useState<SettlementConfigMetadata | null>(null);
  const [config, setConfig] = useState<SettlementConfig>(EMPTY_CONFIG);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [pricingTables, setPricingTables] = useState<CompanyFleetPricingTable[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [pricingForm, setPricingForm] = useState<Record<PricingFieldKey, string>>(EMPTY_PRICING_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPricingSaving, setIsPricingSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCanceled = false;

    async function hydrate() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [
          metadataResponse,
          configResponse,
          companiesResponse,
          fleetsResponse,
          pricingTablesResponse,
        ] = await Promise.all([
          getSettlementConfigMetadata(client),
          getSettlementConfig(client),
          listCompanies(client),
          listFleets(client),
          listSettlementPricingTables(client),
        ]);

        if (isCanceled) {
          return;
        }

        setMetadata(metadataResponse);
        setConfig({
          ...EMPTY_CONFIG,
          ...configResponse,
        });
        setCompanies(Array.isArray(companiesResponse) ? companiesResponse : []);
        setFleets(Array.isArray(fleetsResponse) ? fleetsResponse : []);
        setPricingTables(Array.isArray(pricingTablesResponse) ? pricingTablesResponse : []);
      } catch (error) {
        if (!isCanceled) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (!isCanceled) {
          setIsLoading(false);
        }
      }

      if (!isCanceled) {
        setSuccessMessage(null);
      }
    }

    void hydrate();
    return () => {
      isCanceled = true;
    };
  }, [client]);

  const safeCompanies = Array.isArray(companies) ? companies : [];
  const safeFleets = Array.isArray(fleets) ? fleets : [];
  const safePricingTables = Array.isArray(pricingTables) ? pricingTables : [];

  useEffect(() => {
    if (!selectedCompanyId && safeCompanies.length > 0) {
      setSelectedCompanyId(safeCompanies[0].company_id);
    }
  }, [safeCompanies, selectedCompanyId]);

  const visibleFleets = safeFleets.filter((fleet) => fleet.company_id === selectedCompanyId);

  useEffect(() => {
    if (visibleFleets.length === 0) {
      if (selectedFleetId) {
        setSelectedFleetId('');
      }
      return;
    }

    const hasSelectedFleet = visibleFleets.some((fleet) => fleet.fleet_id === selectedFleetId);
    if (!hasSelectedFleet) {
      setSelectedFleetId(visibleFleets[0].fleet_id);
    }
  }, [selectedFleetId, visibleFleets]);

  const selectedPricingTable =
    safePricingTables.find(
      (pricingTable) =>
        pricingTable.company_id === selectedCompanyId && pricingTable.fleet_id === selectedFleetId,
    ) ?? null;

  useEffect(() => {
    if (selectedPricingTable) {
      setPricingForm({
        box_sale_unit_price: selectedPricingTable.box_sale_unit_price,
        box_purchase_unit_price: selectedPricingTable.box_purchase_unit_price,
        overtime_fee: selectedPricingTable.overtime_fee,
      });
      return;
    }

    setPricingForm({ ...EMPTY_PRICING_FORM });
  }, [selectedPricingTable]);

  function handleFieldChange(fieldKey: ConfigFieldKey, nextValue: string) {
    setConfig((current) => ({
      ...current,
      [fieldKey]: nextValue,
    }));
  }

  function handlePricingFieldChange(fieldKey: PricingFieldKey, nextValue: string) {
    setPricingForm((current) => ({
      ...current,
      [fieldKey]: nextValue,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!metadata) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    const payload = metadata.sections.reduce(
      (acc: Partial<SettlementConfigPayload>, section) => {
        section.fields.forEach((field) => {
          const value = getDisplayFieldValue(config, field.key);
          acc[field.key as keyof SettlementConfigPayload] = value;
        });
        return acc;
      },
      {},
    );

    try {
      const nextConfig = await updateSettlementConfig(client, payload);
      setConfig({
        ...config,
        ...nextConfig,
      });
      setSuccessMessage('전역 정산 설정을 저장했습니다.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePricingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCompanyId || !selectedFleetId) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPricingSaving(true);

    const payload: CompanyFleetPricingTablePayload = {
      company_id: selectedCompanyId,
      fleet_id: selectedFleetId,
      box_sale_unit_price: pricingForm.box_sale_unit_price,
      box_purchase_unit_price: pricingForm.box_purchase_unit_price,
      overtime_fee: pricingForm.overtime_fee,
    };

    try {
      const nextPricingTable = selectedPricingTable
        ? await updateSettlementPricingTable(client, selectedPricingTable.pricing_table_id, payload)
        : await createSettlementPricingTable(client, payload);

      setPricingTables((current) => {
        const nextTables = current.filter(
          (pricingTable) => pricingTable.pricing_table_id !== nextPricingTable.pricing_table_id,
        );
        nextTables.push(nextPricingTable);
        return nextTables;
      });
      setSuccessMessage('회사·플릿 단가표를 저장했습니다.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsPricingSaving(false);
    }
  }

  if (!metadata) {
    return (
      <div className="stack large-gap">
        {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
        <section className="panel">
          <p className="empty-state">
            {isLoading ? '정산 기준 설정을 불러오는 중입니다...' : '정산 기준 설정 정보를 가져오지 못했습니다.'}
          </p>
        </section>
      </div>
    );
  }

  const fieldCount = metadata.sections.reduce((total, section) => total + section.fields.length, 0);

  return (
    <div className="stack large-gap">
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
      {successMessage ? <div className="success-banner">{successMessage}</div> : null}

      <section className="panel">
        <div className="panel-header">
          <p className="panel-kicker">정산 설정</p>
          <h2>전역 정산 설정</h2>
          <p className="empty-state">
            회사/플릿 구분 없이 정산 산출의 기반 값은 전역 설정으로만 관리합니다.
          </p>
          <small className="table-meta">
            현재 설정 항목: {fieldCount}개 ({metadata.sections.length}개 영역)
          </small>
        </div>

        {isLoading ? (
          <p className="empty-state">정산 기준 설정을 불러오는 중입니다...</p>
        ) : (
          <form className="form-stack" onSubmit={handleSubmit}>
            {metadata.sections.map((section) => (
              <fieldset className="panel" key={section.key}>
                <legend>
                  <h3>{section.title}</h3>
                  <p className="empty-state">{section.description}</p>
                </legend>
                <div className="stack">
                  {section.fields.map((field) => {
                    const step = getInputStep(field.decimal_precision, field.integer_only);
                    const fieldValue = getDisplayFieldValue(config, field.key);

                    return (
                      <label className="field" key={field.key}>
                        <span>{field.label}</span>
                        <div className="stack compact">
                          <div>
                            <input
                              inputMode="decimal"
                              min={field.min}
                              max={field.max}
                              name={field.key}
                              onChange={(event) =>
                                handleFieldChange(field.key as ConfigFieldKey, event.target.value)
                              }
                              required={field.required}
                              step={step}
                              type="text"
                              value={fieldValue}
                            />
                            <span>{field.unit}</span>
                          </div>
                          <small>{field.description}</small>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
            <div className="form-actions">
              <button className="button primary" disabled={isSaving} type="submit">
                {isSaving ? '저장 중...' : '전역 설정 저장'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <p className="panel-kicker">정산 단가표</p>
          <h2>회사·플릿 단가표</h2>
          <p className="empty-state">
            박스당 수신/지급 단가와 특근비는 회사·플릿 단위로 관리합니다.
          </p>
        </div>

        {isLoading ? (
          <p className="empty-state">회사·플릿 단가표를 불러오는 중입니다...</p>
        ) : safeCompanies.length === 0 || visibleFleets.length === 0 ? (
          <p className="empty-state">단가표를 연결할 회사 또는 플릿이 없습니다.</p>
        ) : (
          <form className="form-stack" onSubmit={handlePricingSubmit}>
            <div className="stack">
              <label className="field">
                <span>회사</span>
                <select
                  name="company_id"
                  onChange={(event) => setSelectedCompanyId(event.target.value)}
                  value={selectedCompanyId}
                >
                  {safeCompanies.map((company) => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>플릿</span>
                <select
                  name="fleet_id"
                  onChange={(event) => setSelectedFleetId(event.target.value)}
                  value={selectedFleetId}
                >
                  {visibleFleets.map((fleet) => (
                    <option key={fleet.fleet_id} value={fleet.fleet_id}>
                      {fleet.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>박스당 수신단가</span>
                <input
                  inputMode="decimal"
                  name="box_sale_unit_price"
                  onChange={(event) =>
                    handlePricingFieldChange('box_sale_unit_price', event.target.value)
                  }
                  required
                  type="text"
                  value={pricingForm.box_sale_unit_price}
                />
              </label>

              <label className="field">
                <span>박스당 지급단가</span>
                <input
                  inputMode="decimal"
                  name="box_purchase_unit_price"
                  onChange={(event) =>
                    handlePricingFieldChange('box_purchase_unit_price', event.target.value)
                  }
                  required
                  type="text"
                  value={pricingForm.box_purchase_unit_price}
                />
              </label>

              <label className="field">
                <span>특근비</span>
                <input
                  inputMode="decimal"
                  name="overtime_fee"
                  onChange={(event) => handlePricingFieldChange('overtime_fee', event.target.value)}
                  required
                  type="text"
                  value={pricingForm.overtime_fee}
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="button primary" disabled={isPricingSaving} type="submit">
                {isPricingSaving ? '저장 중...' : '단가표 저장'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
