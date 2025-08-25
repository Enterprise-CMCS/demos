interface AuthConfig {
  jwksUri: string;
  issuer: string;
  audience: string;
};

export const LOCAL_AUTH_CONFIG: AuthConfig = {
  jwksUri: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FCc2lmZDJ/.well-known/jwks.json',
  issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FCc2lmZDJ',
  audience: "5p61qososiui75cmclcift45oi",
};

export const getAuthConfig = (): AuthConfig => {
  return LOCAL_AUTH_CONFIG;
};
