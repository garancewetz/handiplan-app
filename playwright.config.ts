import { defineConfig, devices } from '@playwright/test'

// Tests de bout en bout : les parcours de l'appli, dans Chrome Canary, à la taille d'un téléphone.
// Les données viennent du mode démo et de réponses simulées (e2e/support/network.ts) : les tests ne
// dépendent d'aucun serveur extérieur, et ne publient jamais rien.
const PORT = 5190

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Pixel 7'],
    // En local, Chrome Canary (les nouveautés du navigateur en avance) ; en CI, le Chromium de Playwright.
    channel: process.env.CI ? undefined : 'chrome-canary',
    baseURL: `http://localhost:${PORT}`,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    geolocation: { latitude: 48.8566, longitude: 2.3522 },
    permissions: ['geolocation'],
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // Une appli OSM factice : les écrans de contribution s'affichent, sans jamais rien envoyer.
    env: { VITE_OSM_CLIENT_ID: 'essai-e2e' },
  },
})
