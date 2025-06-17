/// <reference types="vite/client" />

interface ViteTypeOptions {
  // Disallow usage of unknown keys
  strictImportMetaEnv: unknown;
}

/**
Some built-in constants are available in all cases:

import.meta.env.MODE: {string} the mode the app is running in.
import.meta.env.BASE_URL: {string} the base url the app is being served from. This is determined by the base config option.
import.meta.env.PROD: {boolean} whether the app is running in production
import.meta.env.DEV: {boolean} whether the app is running in development (always the opposite of import.meta.env.PROD)
 */
interface ImportMetaEnv {
  readonly VITE_USE_MOCKS: boolean;
  // TODO: Ask about the best way to handle this for devops
  readonly COGNITO_AUTHORITY: string;
  readonly REDIRECT_URI: string;
  readonly COGNITO_CLIENT_ID: string;
  readonly APPLICATION_HOSTNAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
