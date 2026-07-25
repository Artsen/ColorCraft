import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const repositoryRoot = path.resolve(import.meta.dirname, '..')
const windowsPython = path.join(
  repositoryRoot,
  'backend',
  '.venv311',
  'Scripts',
  'python.exe',
)
const python =
  process.env.COLORCRAFT_PYTHON ??
  (process.platform === 'win32' ? `"${windowsPython}"` : 'python3')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `${python} dev.py`,
    cwd: repositoryRoot,
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
})
