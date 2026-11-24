// frontend\playwright.config.ts
import { defineConfig } from '@playwright/test';

// F11.3: configuración de los smoke tests E2E de la integración con QuimioResponde.
//
// La suite usa únicamente el fixture `request` (APIRequestContext), así que no
// lanza navegadores y no requiere `pnpm exec playwright install`.
//
// Para apuntar a local u otro entorno:
//   set CHEMLAB_API_URL=http://localhost:5000 && pnpm test:smoke
const API_BASE = process.env.CHEMLAB_API_URL || 'https://chemlab-vozz.onrender.com';

export default defineConfig({
  testDir: './e2e',
  // Render free tier duerme tras 15 min sin tráfico y el primer request puede
  // tardar ~30 s: 45 s por test para tolerar el cold start.
  timeout: 45000,
  expect: { timeout: 10000 },
  // La API es remota: un solo worker evita cold starts en paralelo.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: API_BASE,
  },
});
