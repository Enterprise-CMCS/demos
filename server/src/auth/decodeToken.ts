import jwksClient from "jwks-rsa";
import jwt, { JwtHeader, JwtPayload, VerifyOptions } from "jsonwebtoken";
import { GraphQLError } from "graphql";

const JWKS_URI =
  "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FCc2lmZDJ/.well-known/jwks.json";
const JWKS_ISSUER = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FCc2lmZDJ";
const JWKS_AUDIENCE = "5p61qososiui75cmclcift45oi";
const JWKS_REQUESTS_PER_MINUTE = 10;
const CACHE_MAX_AGE = 60 * 60 * 1000; // 10 minutes
const CACHE_MAX_ENTRIES = 10;

const jwks = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  cacheMaxEntries: CACHE_MAX_ENTRIES,
  cacheMaxAge: CACHE_MAX_AGE,
  rateLimit: true,
  jwksRequestsPerMinute: JWKS_REQUESTS_PER_MINUTE,
});

export function decodeToken(token: string): Promise<JwtPayload> {
  const verifyOpts: VerifyOptions = {
    audience: JWKS_AUDIENCE,
    issuer: JWKS_ISSUER,
    algorithms: ["RS256"],
  };

  return new Promise((resolve, reject) => {
    function getKey(header: JwtHeader, cb: (err: Error | null, key?: string) => void) {
      jwks.getSigningKey(header.kid, (err, key) => {
        if (err || !key) return cb(err || new Error("Signing key not found"));
        cb(null, key.getPublicKey());
      });
    }

    jwt.verify(token, getKey, verifyOpts, (err, decoded) => {
      if (err) {
        return reject(
          new GraphQLError("User is not authenticated", {
            extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
          })
        );
      }
      if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
        return reject(
          new GraphQLError("User is not authenticated", {
            extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
          })
        );
      }

      resolve(decoded);
    });
  });
}
