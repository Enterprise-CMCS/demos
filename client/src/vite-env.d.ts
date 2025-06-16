/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_USE_MOCKS: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
