import { expect, test } from '@playwright/test';

test('login page fits within short desktop viewport without vertical scrolling', async ({ page }) => {
  await page.route('**/api/org/companies/public/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          company_id: '30000000-0000-0000-0000-000000000001',
          route_no: 31,
          name: 'Seed Company',
        },
      ]),
    });
  });

  await page.setViewportSize({ width: 1366, height: 720 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();

  const layout = await page.evaluate(() => {
    const root = document.documentElement;
    const mediaFrame = document.querySelector('.login-media-frame') as HTMLElement | null;
    const authPanel = document.querySelector('.login-auth-panel') as HTMLElement | null;
    const mediaImage = document.querySelector('.login-media-frame img') as HTMLElement | null;
    const placeholder = mediaFrame ? window.getComputedStyle(mediaFrame, '::before') : null;

    return {
      innerHeight: window.innerHeight,
      scrollHeight: root.scrollHeight,
      mediaHeight: mediaFrame?.getBoundingClientRect().height ?? 0,
      authHeight: authPanel?.getBoundingClientRect().height ?? 0,
      imageObjectPosition: mediaImage ? window.getComputedStyle(mediaImage).objectPosition : '',
      placeholderPosition: placeholder?.backgroundPosition ?? '',
    };
  });

  expect(layout.scrollHeight).toBeLessThanOrEqual(layout.innerHeight + 1);
  expect(layout.mediaHeight).toBeLessThan(layout.innerHeight);
  expect(layout.authHeight).toBeLessThanOrEqual(layout.innerHeight);
  expect(layout.imageObjectPosition).toBe('50% 100%');
  expect(layout.placeholderPosition).toBe('50% 100%');
});
