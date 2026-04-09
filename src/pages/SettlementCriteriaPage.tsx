import { FormEvent, useEffect, useState } from 'react';

import { getErrorMessage, type HttpClient } from '../api/http';
import {
  getSettlementConfig,
  getSettlementConfigMetadata,
  updateSettlementConfig,
  type SettlementConfigPayload,
} from '../api/settlementRegistry';
import type { SettlementConfig, SettlementConfigMetadata } from '../types';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCanceled = false;

    async function hydrate() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [metadataResponse, configResponse] = await Promise.all([
          getSettlementConfigMetadata(client),
          getSettlementConfig(client),
        ]);

        if (isCanceled) {
          return;
        }

        setMetadata(metadataResponse);
        setConfig({
          ...EMPTY_CONFIG,
          ...configResponse,
        });
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

  function handleFieldChange(fieldKey: ConfigFieldKey, nextValue: string) {
    setConfig((current) => ({
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
    </div>
  );
}
