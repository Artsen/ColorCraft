import { rm, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const frontendRoot = path.resolve(import.meta.dirname, '..')
const outputDirectory = path.resolve(frontendRoot, '..', '.tmp', 'ui-review')
await rm(outputDirectory, { recursive: true, force: true })
await mkdir(outputDirectory, { recursive: true })

const isWindows = process.platform === 'win32'
const executable = isWindows
  ? 'corepack pnpm@9.15.9 exec playwright test --grep @screenshots'
  : 'corepack'
const arguments_ = isWindows
  ? []
  : ['pnpm@9.15.9', 'exec', 'playwright', 'test', '--grep', '@screenshots']
const child = spawn(executable, arguments_, {
  cwd: frontendRoot,
  stdio: 'inherit',
  env: { ...process.env, COLORCRAFT_SCREENSHOTS: '1' },
  shell: isWindows,
})
child.on('exit', (code) => process.exit(code ?? 1))
