/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Same-origin URL of the GitHub proxy (for example /api/github). Leave unset to call GitHub directly. */
  readonly VITE_API_PROXY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
