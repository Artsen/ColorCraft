import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import runtimeConfig from '../runtime-config.json'

function parseBoolean(value: string | undefined, name: string): boolean {
  if (value === undefined || value === '') return false
  if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) return true
  if (['0', 'false', 'no', 'off'].includes(value.toLowerCase())) return false
  throw new Error(`${name} must be true or false.`)
}

function parsePort(value: string | undefined, fallback: number, name: string): number {
  const port = value === undefined || value === '' ? fallback : Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535.`)
  }
  return port
}

function isLoopbackHost(host: string): boolean {
  const normalized = host.toLowerCase()
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized.startsWith('127.')
  )
}

function urlHost(host: string): string {
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowLanAccess = parseBoolean(
    env.COLORCRAFT_ALLOW_LAN_ACCESS,
    'COLORCRAFT_ALLOW_LAN_ACCESS',
  )
  const webHost = env.COLORCRAFT_WEB_HOST || runtimeConfig.defaults.webHost
  const apiHost = env.COLORCRAFT_API_HOST || runtimeConfig.defaults.apiHost
  const webPort = parsePort(
    env.COLORCRAFT_WEB_PORT,
    runtimeConfig.defaults.webPort,
    'COLORCRAFT_WEB_PORT',
  )
  const apiPort = parsePort(
    env.COLORCRAFT_API_PORT,
    runtimeConfig.defaults.apiPort,
    'COLORCRAFT_API_PORT',
  )

  if (!allowLanAccess && (!isLoopbackHost(webHost) || !isLoopbackHost(apiHost))) {
    throw new Error(
      'LAN hosts require COLORCRAFT_ALLOW_LAN_ACCESS=true.',
    )
  }

  const proxyTarget =
    env.VITE_COLORCRAFT_API_URL || `http://${urlHost(apiHost)}:${apiPort}`

  return {
    plugins: [react()],
    server: {
      host: webHost,
      port: webPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
