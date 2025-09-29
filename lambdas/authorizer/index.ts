import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";

import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwkClient from "jwks-rsa";

const client = jwkClient({
  jwksUri: process.env.JWKS_URI!,
});

/* v8 ignore start - ignoring this function since its just a wrapper*/
function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err || !key) return callback(err || new Error("Signing key not found"));
    var signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}
/* v8 ignore stop */

export const handler = async (event: APIGatewayTokenAuthorizerEvent) => {
  const token = event.authorizationToken.split(" ")[1];
  console.log("starting validation");

  if (!token) {
    console.error("no token");
    throw new Error("Unauthorized");
  }

  console.log("token found");

  let decoded: jwt.JwtPayload;
  try {
    decoded = await verifyToken(token);
  } catch (err) {
    console.error(`user sub [unknown] rejected with invalid token: ${err}`);
    throw new Error("Unauthorized");
  }

  if (!decoded.sub) {
    console.error("user sub is missing");
    throw new Error("Unauthorized");
  }

  const roles = decoded["custom:roles"] as string | undefined;

  if (!roles) {
    console.error(`user sub [${decoded.sub}] rejected with no roles`);
    throw new Error("Unauthorized");
  }

  const validRoles = ["demos-admin", "demos-cms-user", "demos-state-user"];

  if (!validRoles.some((role) => roles.includes(role))) {
    console.error(`user sub [${decoded.sub}] rejected with invalid roles [${roles}]`);
    throw new Error("Unauthorized");
  }

  console.log(`user sub [${decoded.sub}] authorized with role [${roles}]`);
  return generatePolicy(decoded.sub, "Allow", event.methodArn, {
    sub: decoded.sub,
    email: decoded.email,
    given_name: decoded.given_name,
    family_name: decoded.family_name,
    role: roles,
  });
};

const verifyToken = (token: string): Promise<jwt.JwtPayload> => {
  return new Promise((resolve, reject) => {
    console.log("verifying...");
    jwt.verify(token, getKey, {}, (err, decoded) => {
      if (err) {
        console.error("validation error:", err);
        return reject(err);
      }

      if (!decoded || typeof decoded == "string") {
        console.error("invalid decoded value");
        return reject(decoded);
      }
      resolve(decoded);
    });
  });
};

export interface PassedContext {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
}

function generatePolicy(principalId: string, effect: "Allow" | "Deny", resource: string, context: PassedContext) {
  const policy = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context,
  };
  return policy;
}
