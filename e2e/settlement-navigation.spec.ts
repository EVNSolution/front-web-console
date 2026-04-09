import { expect, test, type Page } from '@playwright/test';

const sessionPayload = {
  accessToken: 'playwright-token',
  sessionKind: 'manager',
  email: 'seed-settlement-manager@example.com',
  identity: {
    identityId: 'identity-1',
    name: 'Seed Settlement Manager',
    birthDate: '1990-01-01',
    status: 'active',
  },
  activeAccount: {
    accountType: 'manager',
    accountId: 'manager-1',
    companyId: '30000000-0000-0000-0000-000000000001',
    roleType: 'company_super_admin',
    roleDisplayName: '회사 총괄 관리자',
  },
  availableAccountTypes: ['manager'],
};

async function signIn(page: Page) {
  await page.addInitScript((session) => {
    window.localStorage.setItem('clever.admin.session', JSON.stringify(session));
  }, sessionPayload);

  await page.route('**/api/auth/identity-navigation-policy/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        allowed_nav_keys: ['dashboard', 'settlements'],
        source: 'playwright',
      }),
    });
  });

  await page.route('**/api/org/companies/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/org/fleets/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/drivers/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/settlement-ops/runs/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/settlement-ops/items/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible({ timeout: 15_000 });
}

test('settlement splits sidebar navigation into overview and process entries', async ({ page }) => {
  await signIn(page);
  const mainNavigation = page.getByLabel('주 메뉴');

  await expect(mainNavigation.getByRole('button', { name: '정산' })).toBeVisible();
  await mainNavigation.getByRole('button', { name: '정산' }).click();

  await expect(mainNavigation.getByRole('link', { name: '정산 조회', exact: true })).toBeVisible();
  await expect(mainNavigation.getByRole('link', { name: '정산 처리', exact: true })).toBeVisible();

  await mainNavigation.getByRole('link', { name: '정산 조회', exact: true }).click();
  await expect(page).toHaveURL(/\/settlements\/overview$/);
  await expect(page.getByRole('heading', { name: '정산 운영 요약' })).toBeVisible();
  await expect(page.getByRole('link', { name: '정산 기준', exact: true })).toHaveCount(0);

  await mainNavigation.getByRole('link', { name: '정산 처리', exact: true }).click();
  await expect(page).toHaveURL(/\/settlements\/criteria$/);
  await expect(page.getByRole('heading', { name: '정산 처리' })).toBeVisible();
  await expect(page.getByRole('link', { name: '정산 기준' })).toBeVisible();
  await expect(page.getByRole('link', { name: '정산 실행' })).toBeVisible();

  await page.getByRole('link', { name: '정산 실행' }).click();
  await expect(page).toHaveURL(/\/settlements\/runs$/);
  await expect(page.getByRole('heading', { name: '정산 실행 요약' })).toBeVisible();
});
