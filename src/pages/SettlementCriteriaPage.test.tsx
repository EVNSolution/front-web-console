import { fireEvent, render, screen } from '@testing-library/react';
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
      description: '정산 산출에 적용되는 세율',
      fields: [
        {
          key: 'income_tax_rate',
          label: '소득세율',
          description: '과세 기준 소득세율',
          input_type: 'percent',
          unit: '%',
          min: '0',
          max: '100',
          decimal_precision: 4,
          required: true,
        },
        {
          key: 'vat_tax_rate',
          label: '부가세율',
          description: '부가세 적용율',
          input_type: 'percent',
          unit: '%',
          min: '0',
          max: '100',
          decimal_precision: 4,
          required: true,
        },
      ],
    },
    {
      key: 'amounts',
      title: '기타 기준',
      description: '정산 기준',
      fields: [
        {
          key: 'meal_allowance',
          label: '식비',
          description: '운영 기본 식비 기준',
          input_type: 'currency',
          unit: '원',
          min: '0',
          max: '1000000',
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

  it('renders global settlement fields from metadata and current config', async () => {
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

    render(<SettlementCriteriaPage client={{ request: vi.fn() }} />);

    expect(await screen.findByRole('heading', { name: '전역 정산 설정' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '회사·플릿 단가표' })).toBeInTheDocument();
    expect(screen.getByText('현재 설정 항목: 3개 (2개 영역)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.0300')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000.00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('800.00')).toBeInTheDocument();
    expect(screen.getByText('과세 기준 소득세율')).toBeInTheDocument();
  });

  it('saves edited values using metadata-driven payload', async () => {
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
    apiMocks.updateSettlementConfig.mockResolvedValue({
      ...configFixture,
      meal_allowance: '21000',
    });
    apiMocks.updateSettlementPricingTable.mockResolvedValue({
      ...pricingTableFixture[0],
      overtime_fee: '25000.00',
    });

    render(<SettlementCriteriaPage client={{ request: vi.fn() }} />);

    const mealAllowanceInput = await screen.findByDisplayValue('20000');
    fireEvent.change(mealAllowanceInput, { target: { value: '21000' } });
    fireEvent.click(screen.getByRole('button', { name: '전역 설정 저장' }));

    expect(apiMocks.updateSettlementConfig).toHaveBeenCalledWith(
      { request: expect.any(Function) },
      expect.objectContaining({
        income_tax_rate: '0.0300',
        vat_tax_rate: '0.1000',
        meal_allowance: '21000',
      }),
    );

    fireEvent.change(screen.getByDisplayValue('20000.00'), { target: { value: '25000.00' } });
    fireEvent.click(screen.getByRole('button', { name: '단가표 저장' }));

    expect(apiMocks.updateSettlementPricingTable).toHaveBeenCalledWith(
      { request: expect.any(Function) },
      '91000000-0000-0000-0000-000000000001',
      expect.objectContaining({
        overtime_fee: '25000.00',
      }),
    );
  });

  it('creates a company-fleet pricing table when no row exists for the selected scope', async () => {
    apiMocks.getSettlementConfigMetadata.mockResolvedValue(metadataFixture);
    apiMocks.getSettlementConfig.mockResolvedValue(configFixture);
    apiMocks.listSettlementPricingTables.mockResolvedValue([]);
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
