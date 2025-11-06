import { getAppMode } from "config/env";
import type { AuthProviderProps } from "react-oidc-context";
import type { UserManagerSettings } from "oidc-client-ts";
import { WebStorageStateStore } from "oidc-client-ts";

// Strip OIDC callback junk after login
const onSigninCallback = () => {
  window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
};

/** The exact OIDC settings we use (snake_case keys, matching oidc-client-ts). */
type OidcSettingsSubset = Pick<
  UserManagerSettings,
  "authority" | "client_id" | "redirect_uri" | "scope" | "response_type" | "automaticSilentRenew"
> & {
  onSigninCallback: () => void;
  automaticSilentRenew: boolean;
  onSilentRenewError?: (error: Error) => void;
  userStore?: WebStorageStateStore;
};

/** Full app config = OIDC settings + Cognito Hosted UI bits we don't pass to <AuthProvider/>. */
export type CognitoConfig = OidcSettingsSubset & {
  domain: string; // Cognito Hosted UI base URL
  post_logout_redirect_uri: string;
};

const BASE_COGNITO_CONFIG: OidcSettingsSubset = {
  response_type: "code",
  onSigninCallback,
  automaticSilentRenew: true,
  onSilentRenewError: (error) => {
    console.error("Silent renew failed:", error);
    logoutRedirect(); // Maybe this needs to be authActions -> signout?
  },
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  authority: import.meta.env.VITE_COGNITO_AUTHORITY!,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID!,
  redirect_uri: `${window.location.origin}/`,
  scope: "openid email profile",
};

export const LOCAL_COGNITO_CONFIG: CognitoConfig = {
  ...BASE_COGNITO_CONFIG,
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FCc2lmZDJ",
  domain: "https://demos-dev-login-user-pool-client.auth.us-east-1.amazoncognito.com",
  client_id: "5p61qososiui75cmclcift45oi",
  redirect_uri: `${window.location.origin}/`,
  post_logout_redirect_uri: `${window.location.origin}/`,
};

const PRODUCTION_COGNITO_CONFIG: CognitoConfig = {
  ...BASE_COGNITO_CONFIG,
  authority: import.meta.env.VITE_COGNITO_AUTHORITY!,
  domain: import.meta.env.VITE_COGNITO_DOMAIN!,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID!,
  redirect_uri:
    import.meta.env.BASE_URL === "/" ? `${window.location.origin}/` : import.meta.env.BASE_URL,
  post_logout_redirect_uri: `${window.location.origin}/`,
};

/** Only pass the OIDC fields to <AuthProvider/>. */
export const getAuthProviderProps = (cfg: CognitoConfig): AuthProviderProps => ({
  authority: cfg.authority,
  client_id: cfg.client_id,
  redirect_uri: cfg.redirect_uri,
  scope: cfg.scope,
  response_type: cfg.response_type,
  automaticSilentRenew: cfg.automaticSilentRenew,
  userStore: cfg.userStore,
  onSigninCallback: cfg.onSigninCallback,
});

/** Cognito Hosted UI logout URL (Cognito expects `logout_uri`). */
export const getCognitoLogoutUrl = (cfg: CognitoConfig): string => {
  const url = new URL(`${cfg.domain.replace(/\/$/, "")}/logout`);
  url.searchParams.set("client_id", cfg.client_id);
  url.searchParams.set("logout_uri", cfg.post_logout_redirect_uri); // auto-encoded
  return url.toString();
};

export const logoutRedirect = (): void => {
  window.location.assign(getCognitoLogoutUrl(getCognitoConfig()));
};

export const getCognitoConfig = (): CognitoConfig => {
  const appMode = getAppMode();
  switch (appMode) {
    case "development":
      return LOCAL_COGNITO_CONFIG;
    case "test":
      return LOCAL_COGNITO_CONFIG;
    case "production":
      return PRODUCTION_COGNITO_CONFIG;
    default:
      throw new Error(`Cognito configuration for ${appMode} is not defined.`);
  }
};
