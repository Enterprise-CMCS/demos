interface OidcConfig {
  authority: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  response_type: string;
  post_logout_redirect_uri?: string;
};

export interface CognitoConfig extends OidcConfig {
  domain: string;
}

export const LOCAL_COGNITO_CONFIG: CognitoConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_A7CaR2Wo3",
  domain: "https://us-east-1a7car2wo3.auth.us-east-1.amazoncognito.com",
  client_id: "5km9thunj8g6qd32s5et2i8pga",
  post_logout_redirect_uri: "http://localhost:3000",
  redirect_uri: "http://localhost:3000/login-redirect",
  response_type: "code",
  scope: "openid email phone",
};

export const cognitoLogoutUrl = (): string => {
  const { domain, client_id, post_logout_redirect_uri } = LOCAL_COGNITO_CONFIG;

  if (!post_logout_redirect_uri) {
    throw new Error("post_logout_redirect_uri is not defined in config");
  }
  // Logs you out of cognito logout URL.
  return `${domain}/logout?client_id=${client_id}&logout_uri=` +
    `${encodeURIComponent(post_logout_redirect_uri)}`;
};


export const getCognitoConfig = (): CognitoConfig => {
  return LOCAL_COGNITO_CONFIG;
};

// Abstract away the window.location.href for safety
export const logoutToCognito = () => {
  // Perform the redirect
  window.location.href = cognitoLogoutUrl();
};
