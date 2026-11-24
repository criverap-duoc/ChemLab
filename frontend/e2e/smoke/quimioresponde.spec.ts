// frontend\e2e\smoke\quimioresponde.spec.ts
import { expect, test } from '@playwright/test';

/**
 * F11.3: smoke tests E2E de la integración ChemLab <-> QuimioResponde.
 *
 * Verifican el contrato real de la API pública:
 *   - GET /api/health                              -> 200 (liveness)
 *   - GET /api/public/inventory                    -> 401 sin X-Api-Key
 *   - GET /api/public/inventory                    -> 200 + data[] con la key
 *   - GET /api/public/inventory?expiringInDays=30  -> 200 + page === 1
 *   - GET /api/public/inventory?hazardLevel=3      -> 200 + hazardLevel === 3
 *
 * La key se lee de CHEMLAB_PUBLIC_API_KEY y nunca se versiona. Si no está
 * definida, los tests autenticados se omiten para poder correr la suite en
 * local sin secretos (en CI el workflow exige el secret antes de ejecutar).
 */

const API_KEY = process.env.CHEMLAB_PUBLIC_API_KEY;
const API_KEY_HEADER = 'X-Api-Key';
const MISSING_KEY_REASON =
  'CHEMLAB_PUBLIC_API_KEY no está definida: test autenticado omitido.';

interface PublicReagent {
  id: string;
  name: string;
  hazardLevel: number;
}

interface PublicInventoryResponse {
  data: PublicReagent[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

function apiKeyHeaders(): Record<string, string> {
  if (!API_KEY) {
    throw new Error(MISSING_KEY_REASON);
  }

  return { [API_KEY_HEADER]: API_KEY };
}

test.describe('QuimioResponde integration smoke', () => {
  test('health-check', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);

    const body = (await response.json()) as { status: string };
    expect(body.status).toBe('Healthy');
  });

  test('public-inventory-auth', async ({ request }) => {
    // Sin header: el ApiKeyFilter debe cortar antes de tocar la base de datos.
    const response = await request.get('/api/public/inventory');

    expect(response.status()).toBe(401);
  });

  test('public-inventory-ok', async ({ request }) => {
    test.skip(!API_KEY, MISSING_KEY_REASON);

    const response = await request.get('/api/public/inventory', {
      headers: apiKeyHeaders(),
    });

    expect(response.status()).toBe(200);

    const body = (await response.json()) as PublicInventoryResponse;
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.page).toBe(1);
  });

  test('public-inventory-filter', async ({ request }) => {
    test.skip(!API_KEY, MISSING_KEY_REASON);

    const response = await request.get('/api/public/inventory?expiringInDays=30', {
      headers: apiKeyHeaders(),
    });

    expect(response.status()).toBe(200);

    const body = (await response.json()) as PublicInventoryResponse;
    expect(body.page).toBe(1);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('public-inventory-hazard', async ({ request }) => {
    test.skip(!API_KEY, MISSING_KEY_REASON);

    const response = await request.get('/api/public/inventory?hazardLevel=3', {
      headers: apiKeyHeaders(),
    });

    expect(response.status()).toBe(200);

    const body = (await response.json()) as PublicInventoryResponse;
    expect(Array.isArray(body.data)).toBe(true);
    for (const reagent of body.data) {
      expect(reagent.hazardLevel).toBe(3);
    }
  });
});
