import { getAppMode } from "config/env";
import { AuthProviderBaseProps } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";

// Replace the history state to remove the signin callback from the URL
const onSigninCallback = (): void => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

interface BaseCognitoConfig extends AuthProviderBaseProps {
  onSigninCallback: () => void;
  automaticSilentRenew: boolean;
  userStore?: WebStorageStateStore;
  response_type: string;
}

export interface CognitoConfig extends BaseCognitoConfig {
  authority: string;
  client_id: string;
  redirect_uri: string;
  post_logout_redirect_uri: string;
  scope: string;
  domain: string;
}

const BASE_COGNITO_CONFIG: BaseCognitoConfig = {
  response_type: "code",
  onSigninCallback: onSigninCallback,
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};

export const LOCAL_COGNITO_CONFIG: CognitoConfig = {
  ...BASE_COGNITO_CONFIG,
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_A7CaR2Wo3",
  domain: "https://us-east-1a7car2wo3.auth.us-east-1.amazoncognito.com",
  client_id: "5km9thunj8g6qd32s5et2i8pga",
  post_logout_redirect_uri: "http://localhost:3000",
  redirect_uri: "http://localhost:3000",
  scope: "openid email phone",
};

// TODO: Revisit this when we know more about the deployment setup
const PRODUCTION_COGNITO_CONFIG: CognitoConfig = {
  ...BASE_COGNITO_CONFIG,
  authority: import.meta.env.VITE_COGNITO_AUTHORITY!,
  domain: import.meta.env.VITE_REDIRECT_URI!,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID!,
  post_logout_redirect_uri: import.meta.env.BASE_URL,
  redirect_uri: import.meta.env.BASE_URL,
  scope: "openid email profile",
};

export const getCognitoLogoutUrl = (cognitoConfig: CognitoConfig): string => {
  const url = `${cognitoConfig.domain}/logout
  ?client_id=${cognitoConfig.client_id}
  &logout_uri=${encodeURIComponent(cognitoConfig.post_logout_redirect_uri)}`;
  return url.replace(/\s+/g, "");
};

export const logout = () => {
  window.location.href = getCognitoLogoutUrl(getCognitoConfig());
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
