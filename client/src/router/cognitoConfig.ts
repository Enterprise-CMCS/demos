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
  post_logout_redirect_uri: "http://localhost:3000",
  domain: "https://demos-dev-login-user-pool-client.auth.us-east-1.amazoncognito.com",
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FCc2lmZDJ",
  client_id: "5p61qososiui75cmclcift45oi",
  redirect_uri: "http://localhost:3000/",
  scope: "email openid profile",
};

// TODO: Revisit this when we know more about the deployment setup
const PRODUCTION_COGNITO_CONFIG: CognitoConfig = {
  ...BASE_COGNITO_CONFIG,
  authority: import.meta.env.VITE_COGNITO_AUTHORITY!,
  domain: import.meta.env.VITE_COGNITO_DOMAIN!,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID!,
  post_logout_redirect_uri: import.meta.env.BASE_URL == "/" ? `${window.location.origin}/` : import.meta.env.BASE_URL,
  redirect_uri: import.meta.env.BASE_URL == "/" ? `${window.location.origin}/` : import.meta.env.BASE_URL,
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
  console.log(``)
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
