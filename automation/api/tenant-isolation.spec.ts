import { test, expect, request } from '@playwright/test';

const API = '/api/inventory';

test.describe('Tenant isolation - X-Farm-ID required', () => {
  test('rejects API without X-Farm-ID', async ({ request }) => {
    const res = await request.get(API);
    expect(res.status()).toBe(400);
  });

  test('returns only tenant data with X-Farm-ID', async ({ request }) => {
    const farmA = 'farm-a-test-id';
    const res = await request.get(API, {
      headers: { 'X-Farm-ID': farmA }
    });
    // We can't assert business data here; only that it succeeds and echoes header in response headers
    expect([200, 204]).toContain(res.status());
    expect(res.headers()['x-farm-id']).toBe(farmA);
  });
});



