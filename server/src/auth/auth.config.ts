interface AuthConfig {
  jwksUri: string;
  issuer: string;
  audience: string;
};

export const LOCAL_AUTH_CONFIG: AuthConfig = {
  jwksUri: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_A7CaR2Wo3/.well-known/jwks.json',
  issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_A7CaR2Wo3',
  audience: '5km9thunj8g6qd32s5et2i8pga',
};

export const getAuthConfig = (): AuthConfig => {
  return LOCAL_AUTH_CONFIG;
};
