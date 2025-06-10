export {};

declare global {
  interface Window {
    _env_?: {
      COGNITO_AUTHORITY?: string;
      REDIRECT_URI?: string;
      COGNITO_CLIENT_ID?: string;
      APPLICATION_HOSTNAME?: string;
    };
  }
}
