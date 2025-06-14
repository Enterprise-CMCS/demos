interface OidcConfig {
  authority: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  response_type: string;
  post_logout_redirect_uri: string;
}

export interface CognitoConfig extends OidcConfig {
  domain: string;
}

export const LOCAL_COGNITO_CONFIG: CognitoConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_A7CaR2Wo3",
  domain: "https://us-east-1a7car2wo3.auth.us-east-1.amazoncognito.com",
  client_id: "5km9thunj8g6qd32s5et2i8pga",
  post_logout_redirect_uri: "http://localhost:3000",
  redirect_uri: "http://localhost:3000",
  response_type: "code",
  scope: "openid email phone",
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
  switch (process.env.NODE_ENV) {
  case "development":
    return LOCAL_COGNITO_CONFIG;
  case "test":
    return LOCAL_COGNITO_CONFIG;
  case "production":
    return {
      authority: window._env_!.COGNITO_AUTHORITY!,
      domain: window._env_!.REDIRECT_URI!,
      client_id: window._env_!.COGNITO_CLIENT_ID!,
      post_logout_redirect_uri: `https://${window._env_!.APPLICATION_HOSTNAME}`,
      redirect_uri: `https://${window._env_!.APPLICATION_HOSTNAME}`,
      response_type: "code",
      scope: "openid email profile",
    };
  default:
    throw new Error(
      `Cognito configuration for ${process.env.NODE_ENV} is not defined.`
    );
  }
};
