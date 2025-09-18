/// <reference types="vite/client" />

interface ViteTypeOptions {
  // Disallow usage of unknown keys
  strictImportMetaEnv: unknown;
}

// Environment variables are strings or not set
type EnvironmentVariable = string | undefined;

/**
Some built-in constants are available in all cases:

import.meta.env.MODE: {string} the mode the app is running in.
import.meta.env.BASE_URL: {string} the base url the app is being served from. This is determined by the base config option.
import.meta.env.PROD: {boolean} whether the app is running in production
import.meta.env.DEV: {boolean} whether the app is running in development (always the opposite of import.meta.env.PROD)
 */
interface ImportMetaEnv {
  readonly VITE_USE_MOCKS: EnvironmentVariable;
  // TODO: We may end up switching on mode to get these instead of individual vars
  readonly VITE_COGNITO_AUTHORITY: EnvironmentVariable;
  readonly VITE_COGNITO_DOMAIN: EnvironmentVariable;
  readonly VITE_COGNITO_CLIENT_ID: EnvironmentVariable;
  readonly VITE_APPLICATION_HOSTNAME: EnvironmentVariable;
  readonly VITE_API_URL_PREFIX: EnvironmentVariable;
  readonly VITE_IDLE_TIMEOUT: EnvironmentVariable;
  readonly VITE_IDM_LOGOUT_URI: EnvironmentVariable;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
