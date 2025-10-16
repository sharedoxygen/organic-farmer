import { test, expect } from '@playwright/test';

test.describe('Compliance USDA - guards and CRUD basics', () => {
  const API = '/api/compliance/usda-organic';
  const farm = process.env.TEST_FARM_ID || 'test-farm-id';
  const userToken = process.env.TEST_USER_ID || 'test-user-id';

  test('GET requires X-Farm-ID header', async ({ request }) => {
    const res = await request.get(API);
    expect(res.status()).toBe(401);
  });

  test('GET succeeds with farm and auth', async ({ request }) => {
    const res = await request.get(API, {
      headers: {
        'X-Farm-ID': farm,
        Authorization: `Bearer ${userToken}`,
      },
    });
    expect([200, 204]).toContain(res.status());
  });
});



