import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettlementCriteriaPage } from './SettlementCriteriaPage';

const apiMocks = vi.hoisted(() => ({
  createSettlementPricingTable: vi.fn(),
  getSettlementConfigMetadata: vi.fn(),
  getSettlementConfig: vi.fn(),
  listSettlementPricingTables: vi.fn(),
  updateSettlementConfig: vi.fn(),
  updateSettlementPricingTable: vi.fn(),
  listCompanies: vi.fn(),
  listFleets: vi.fn(),
}));

vi.mock('../api/settlementRegistry', () => ({
  createSettlementPricingTable: apiMocks.createSettlementPricingTable,
  getSettlementConfigMetadata: apiMocks.getSettlementConfigMetadata,
  getSettlementConfig: apiMocks.getSettlementConfig,
  listSettlementPricingTables: apiMocks.listSettlementPricingTables,
  updateSettlementConfig: apiMocks.updateSettlementConfig,
  updateSettlementPricingTable: apiMocks.updateSettlementPricingTable,
}));

vi.mock('../api/organization', () => ({
  listCompanies: apiMocks.listCompanies,
  listFleets: apiMocks.listFleets,
}));

const metadataFixture = {
  sections: [
    {
      key: 'tax_rates',
      title: '세율',
      description: '정산 산출에 적용되는 세금율입니다.',
      fields: [
        {
          key: 'income_tax_rate',
          label: '소득세율',
          description: '과세 기준 소득세율',
          input_type: 'percent',
          unit: '%',
          min: '0.0000',
          max: '100.0000',
          decimal_precision: 4,
          required: true,
        },
        {
          key: 'vat_tax_rate',
          label: '부가가치세율',
          description: '부가세 적용율',
          input_type: 'percent',
          unit: '%',
          min: '0.0000',
          max: '100.0000',
          decimal_precision: 4,
          required: true,
        },
      ],
    },
    {
      key: 'reported_amount',
      title: '정산 반영 기준',
      description: '보고 금액 반영 및 산정 보정 계수입니다.',
      fields: [
        {
          key: 'reported_amount_rate',
          label: '보고 금액 반영률',
          description: '정산에서 반영되는 보고 금액의 비율',
          input_type: 'percent',
          unit: '%',
          min: '0.0000',
          max: '100.0000',
          decimal_precision: 4,
          required: true,
        },
      ],
    },
    {
      key: 'insurance_rates',
      title: '보험료율',
      description: '4대 보험 및 산재/고용 관련 보험율입니다.',
      fields: [
        {
          key: 'national_pension_rate',
          label: '국민연금 보험료율',
          description: '국민연금 부담률',
          input_type: 'percent',
          unit: '%',
          min: '0.0000',
          max: '100.0000',
          decimal_precision: 4,
          required: true,
        },
        {
          key: 'health_insurance_rate',
          label: '건강보험 보험료율',
          description: '건강보험 부담률',
          input_type: 'percent',
          unit: '%',
          min: '0.0000',
          max: '100.0000',
          decimal_precision: 4,
          required: true,
        },
        {
          key: 'medical_insurance_rate',
          label: '장기요양보험료율',
          description: '건강보험료 기반 장기요양보험율',
          input_type: 'percent',
          unit: '%',
          min: '0.0000',
          max: '100.0000',
          decimal_precision: 4,
          required: true,
        },
        {
          key: 'employment_insurance_rate',
          label: '고용보험 보험료율',
          description: '고용보험 부담률',
          input_type: 'percent',
          unit: '%',
          min: '0.0000',
          max: '100.0000',
          decimal_precision: 4,
          required: true,
        },
        {
          key: 'industrial_accident_insurance_rate',
          label: '산재보험 보험료율',
          description: '산업재해보상보험 부담률',
          input_type: 'percent',
          unit: '%',
          min: '0.0000',
          max: '100.0000',
          decimal_precision: 4,
          required: true,
        },
        {
          key: 'special_employment_insurance_rate',
          label: '특별고용보험 보험료율',
          description: '특별고용보험 부담률',
          input_type: 'percent',
          unit: '%',
          min: '0.0000',
          max: '100.0000',
          decimal_precision: 4,
          required: true,
        },
        {
          key: 'special_industrial_accident_insurance_rate',
          label: '특별산재보험 보험료율',
          description: '특별산재보험 부담률',
          input_type: 'percent',
          unit: '%',
          min: '0.0000',
          max: '100.0000',
          decimal_precision: 4,
          required: true,
        },
      ],
    },
    {
      key: 'thresholds',
      title: '기타 기준',
      description: '정산 하한선 및 수고비 기준입니다.',
      fields: [
        {
          key: 'two_insurance_min_settlement_amount',
          label: '2대 보험 최소 정산금액',
          description: '2대 보험 산정의 하한 정산 금액',
          input_type: 'currency',
          unit: '원',
          min: '0.00',
          max: '1000000.00',
          integer_only: true,
          required: true,
        },
        {
          key: 'meal_allowance',
          label: '식비',
          description: '운영 기본 식비 기준',
          input_type: 'currency',
          unit: '원',
          min: '0.00',
          max: '1000000.00',
          integer_only: true,
          required: true,
        },
      ],
    },
  ],
};

const configFixture = {
  singleton_key: 'global',
  income_tax_rate: '0.0300',
  vat_tax_rate: '0.1000',
  reported_amount_rate: '100.0000',
  national_pension_rate: '4.5000',
  health_insurance_rate: '3.4300',
  medical_insurance_rate: '0.0000',
  employment_insurance_rate: '0.0000',
  industrial_accident_insurance_rate: '0.0000',
  special_employment_insurance_rate: '0.0000',
  special_industrial_accident_insurance_rate: '0.0000',
  two_insurance_min_settlement_amount: '0.00',
  meal_allowance: '20000',
};

const pricingTableFixture = [
  {
    pricing_table_id: '91000000-0000-0000-0000-000000000001',
    company_id: '30000000-0000-0000-0000-000000000001',
    fleet_id: '40000000-0000-0000-0000-000000000001',
    box_sale_unit_price: '1000.00',
    box_purchase_unit_price: '800.00',
    overtime_fee: '20000.00',
  },
];

describe('SettlementCriteriaPage', () => {
  beforeEach(() => {
    Object.values(apiMocks).forEach((mock) => mock.mockReset());
  });

  function mockSuccessfulHydration() {
    apiMocks.getSettlementConfigMetadata.mockResolvedValue(metadataFixture);
    apiMocks.getSettlementConfig.mockResolvedValue(configFixture);
    apiMocks.listSettlementPricingTables.mockResolvedValue(pricingTableFixture);
    apiMocks.listCompanies.mockResolvedValue([
      { company_id: '30000000-0000-0000-0000-000000000001', route_no: 1, name: 'Seed Company' },
    ]);
    apiMocks.listFleets.mockResolvedValue([
      {
        fleet_id: '40000000-0000-0000-0000-000000000001',
        route_no: 1,
        company_id: '30000000-0000-0000-0000-000000000001',
        name: 'Seed Fleet',
      },
    ]);
  }

  function getPricingCard() {
    const pricingHeading = screen.getByRole('heading', { name: '회사·플릿 단가표' });
    const pricingCard = pricingHeading.closest('section');
    expect(pricingCard).not.toBeNull();
    return pricingCard as HTMLElement;
  }

  async function getMetadataCard(title: string) {
    const heading = await screen.findByRole('heading', { name: title });
    const card = heading.closest('fieldset') ?? heading.closest('section');
    expect(card).not.toBeNull();
    return card as HTMLElement;
  }

  it('renders the compact card workboard for settlement criteria', async () => {
    mockSuccessfulHydration();

    render(<SettlementCriteriaPage client={{ request: vi.fn() }} />);

    expect(screen.queryByText('정산 설정')).not.toBeInTheDocument();
    expect(screen.queryByText('전역 정산 설정')).not.toBeInTheDocument();
    expect(screen.queryByText('회사/플릿 구분 없이')).not.toBeInTheDocument();
    expect(screen.queryByText('현재 설정 항목:')).not.toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: '정산 기준' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '세율' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '정산 반영 기준' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '보험료율' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '기타 기준' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '회사·플릿 단가표' })).toBeInTheDocument();

    const reportedAmountCard = await getMetadataCard('정산 반영 기준');
    expect(within(reportedAmountCard).getByLabelText('보고 금액 반영률')).toBeInTheDocument();

    const taxRatesCard = await getMetadataCard('세율');
    expect(within(taxRatesCard).getByRole('button', { name: /저장$/ })).toBeInTheDocument();

    const insuranceCard = await getMetadataCard('보험료율');
    expect(within(insuranceCard).getByRole('button', { name: /저장$/ })).toBeInTheDocument();

    const thresholdsCard = await getMetadataCard('기타 기준');
    expect(within(thresholdsCard).getByRole('button', { name: /저장$/ })).toBeInTheDocument();

    const pricingCard = getPricingCard();
    expect(within(pricingCard).getByRole('button', { name: '단가표 저장' })).toBeInTheDocument();
    expect(within(pricingCard).getByLabelText('회사')).toBeInTheDocument();
    expect(within(pricingCard).getByLabelText('플릿')).toBeInTheDocument();
    expect(within(pricingCard).getByLabelText('박스당 수신단가')).toBeInTheDocument();
    expect(within(pricingCard).getByLabelText('박스당 지급단가')).toBeInTheDocument();
    expect(within(pricingCard).getByLabelText('특근비')).toBeInTheDocument();
  });

  it('saves only the edited section from a metadata card and keeps pricing persistence unchanged', async () => {
    mockSuccessfulHydration();
    apiMocks.updateSettlementConfig.mockResolvedValue({
      ...configFixture,
      income_tax_rate: '0.0310',
    });
    apiMocks.updateSettlementPricingTable.mockResolvedValue({
      ...pricingTableFixture[0],
      overtime_fee: '25000.00',
    });

    render(<SettlementCriteriaPage client={{ request: vi.fn() }} />);

    const taxRatesCard = await getMetadataCard('세율');
    fireEvent.change(within(taxRatesCard).getByDisplayValue('0.0300'), { target: { value: '0.0310' } });
    fireEvent.click(within(taxRatesCard).getByRole('button', { name: /저장$/ }));

    expect(apiMocks.updateSettlementConfig).toHaveBeenCalledWith(
      { request: expect.any(Function) },
      {
        income_tax_rate: '0.0310',
        vat_tax_rate: '0.1000',
      },
    );

    const pricingCard = getPricingCard();
    fireEvent.change(within(pricingCard).getByLabelText('박스당 수신단가'), {
      target: { value: '1005.00' },
    });
    fireEvent.change(within(pricingCard).getByLabelText('박스당 지급단가'), {
      target: { value: '805.00' },
    });
    fireEvent.change(within(pricingCard).getByLabelText('특근비'), { target: { value: '25000.00' } });
    fireEvent.click(within(pricingCard).getByRole('button', { name: '단가표 저장' }));

    expect(apiMocks.updateSettlementPricingTable).toHaveBeenCalledWith(
      { request: expect.any(Function) },
      '91000000-0000-0000-0000-000000000001',
      expect.objectContaining({
        overtime_fee: '25000.00',
      }),
    );
  });

  it('renders the current company-fleet pricing create path when no row exists for the selected scope', async () => {
    mockSuccessfulHydration();
    apiMocks.listSettlementPricingTables.mockResolvedValue([]);
    apiMocks.createSettlementPricingTable.mockResolvedValue({
      pricing_table_id: '91000000-0000-0000-0000-000000000099',
      company_id: '30000000-0000-0000-0000-000000000001',
      fleet_id: '40000000-0000-0000-0000-000000000001',
      box_sale_unit_price: '1100.00',
      box_purchase_unit_price: '900.00',
      overtime_fee: '30000.00',
    });

    render(<SettlementCriteriaPage client={{ request: vi.fn() }} />);

    fireEvent.change(await screen.findByLabelText('박스당 수신단가'), { target: { value: '1100.00' } });
    fireEvent.change(screen.getByLabelText('박스당 지급단가'), { target: { value: '900.00' } });
    fireEvent.change(screen.getByLabelText('특근비'), { target: { value: '30000.00' } });
    fireEvent.click(screen.getByRole('button', { name: '단가표 저장' }));

    expect(apiMocks.createSettlementPricingTable).toHaveBeenCalledWith(
      { request: expect.any(Function) },
      {
        company_id: '30000000-0000-0000-0000-000000000001',
        fleet_id: '40000000-0000-0000-0000-000000000001',
        box_sale_unit_price: '1100.00',
        box_purchase_unit_price: '900.00',
        overtime_fee: '30000.00',
      },
    );
    expect(apiMocks.updateSettlementPricingTable).not.toHaveBeenCalled();
  });
});
