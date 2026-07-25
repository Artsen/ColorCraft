/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COLORCRAFT_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
