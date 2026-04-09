import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SettlementCriteriaPage } from './SettlementCriteriaPage';

const apiMocks = vi.hoisted(() => ({
  getSettlementConfigMetadata: vi.fn(),
  getSettlementConfig: vi.fn(),
  updateSettlementConfig: vi.fn(),
}));

vi.mock('../api/settlementRegistry', () => ({
  getSettlementConfigMetadata: apiMocks.getSettlementConfigMetadata,
  getSettlementConfig: apiMocks.getSettlementConfig,
  updateSettlementConfig: apiMocks.updateSettlementConfig,
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

describe('SettlementCriteriaPage', () => {
  it('renders global settlement fields from metadata and current config', async () => {
    apiMocks.getSettlementConfigMetadata.mockResolvedValue(metadataFixture);
    apiMocks.getSettlementConfig.mockResolvedValue(configFixture);

    render(<SettlementCriteriaPage client={{ request: vi.fn() }} />);

    expect(await screen.findByRole('heading', { name: '전역 정산 설정' })).toBeInTheDocument();
    expect(screen.getByText('현재 설정 항목: 3개 (2개 영역)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.0300')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20000')).toBeInTheDocument();
    expect(screen.getByText('과세 기준 소득세율')).toBeInTheDocument();
  });

  it('saves edited values using metadata-driven payload', async () => {
    apiMocks.getSettlementConfigMetadata.mockResolvedValue(metadataFixture);
    apiMocks.getSettlementConfig.mockResolvedValue(configFixture);
    apiMocks.updateSettlementConfig.mockResolvedValue({
      ...configFixture,
      meal_allowance: '21000',
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
  });
});
