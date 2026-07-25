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
const reuseExistingServer = !process.env.CI

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
  webServer: [
    {
      command: `${python} -m uvicorn main:app --host 127.0.0.1 --port 4100`,
      cwd: path.join(repositoryRoot, 'backend'),
      url: 'http://127.0.0.1:4100/ready',
      reuseExistingServer,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'corepack pnpm@9.15.9 dev --host 127.0.0.1 --port 5174',
      cwd: path.join(repositoryRoot, 'frontend'),
      url: 'http://127.0.0.1:5174',
      reuseExistingServer,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
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
