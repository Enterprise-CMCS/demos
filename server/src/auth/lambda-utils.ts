import type { APIGatewayProxyEvent, APIGatewayProxyEventHeaders } from "aws-lambda";

export type JwtClaims = {
  sub: string;
  email?: string;
  role?: string;
  familyName?: string;
  givenName?: string;
  identities?: unknown;
};

export function extractAuthorizerClaims(event: APIGatewayProxyEvent): JwtClaims | null {
  const auth = (event.requestContext?.authorizer ?? {}) as Record<string, unknown>;
  const sub = typeof auth.sub === "string" && auth.sub ? auth.sub : null;
  const email = typeof auth.email === "string" ? auth.email : undefined;
  const role = typeof auth.role === "string" ? auth.role : undefined;
  const familyName = typeof auth.family_name === "string" ? auth.family_name : undefined;
  const givenName = typeof auth.given_name === "string" ? auth.given_name : undefined;
  if (!sub) return null;
  const identities = auth.identities;
  const cognitoUsername =
    typeof auth["cognito:username"] === "string" ? auth["cognito:username"] : undefined;

  return {
    sub,
    email,
    role,
    givenName,
    familyName,
    identities,
    "cognito:username": cognitoUsername,
  } as JwtClaims & Record<string, unknown>;
}

export function withAuthorizerHeader(
  headers: APIGatewayProxyEventHeaders,
  claims: JwtClaims | null
): APIGatewayProxyEventHeaders {
  return claims ? { ...headers, "x-authorizer-claims": JSON.stringify(claims) } : headers;
}
