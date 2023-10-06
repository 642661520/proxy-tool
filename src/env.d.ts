/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NODE_ENV: string
  readonly VITE_APP_MODEL: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}