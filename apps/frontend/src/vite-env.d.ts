/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Dev auto-login: email for bypassing the login page locally. */
  readonly VITE_DEV_EMAIL?: string;
  /** Dev auto-login: password for bypassing the login page locally. */
  readonly VITE_DEV_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
