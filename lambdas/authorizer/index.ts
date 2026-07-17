import { APIGatewayTokenAuthorizerEvent, Context } from "aws-lambda";

import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwkClient from "jwks-rsa";

import { log, reqIdChild, store, als } from "./log";

const client = jwkClient({
  jwksUri: process.env.JWKS_URI!,
});

/* v8 ignore start - ignoring this function since its just a wrapper*/
function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err || !key) return callback(err || new Error("Signing key not found"));
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}
/* v8 ignore stop */

function redactEmailAddress(address: string): string {
  const [local, domain] = address.split("@");
  if (!domain) return address;

  const visible = local.slice(0, 2);

  const redactedEmail = `${visible}****@${domain}`;

  return redactedEmail;
}

export const handler = async (event: APIGatewayTokenAuthorizerEvent, context: Context) =>
  als.run(store, async () => {
    reqIdChild(context.awsRequestId);

    const token = event.authorizationToken.split(" ")[1];
    log.debug("starting validation");

    if (!token) {
      log.info("unauthorized: token is not set");
      throw new Error("Unauthorized");
    }

    log.debug("token found");

    let decoded: jwt.JwtPayload;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      log.info(
        {
          error: (err as Error).message,
        },
        "unauthorized: unknown user rejected with invalid token"
      );
      throw new Error("Unauthorized");
    }

    if (!decoded.sub) {
      log.info("unauthorized: user sub is missing");
      throw new Error("Unauthorized");
    }

    const roles = decoded["custom:roles"] as string | undefined;

    const userId = decoded.identities?.[0]?.userId ?? decoded.email;
    if (decoded.identities?.[0]?.userId === undefined) {
      log.warn(
        { sub: decoded.sub, userId: redactEmailAddress(userId) },
        "user does not have a standard idm user id"
      );
    }

    if (!roles) {
      log.info(
        {
          sub: decoded.sub,
          userId,
        },
        "unauthorized: user has no roles"
      );
      throw new Error("Unauthorized");
    }

    const validRoles = ["demos-admin", "demos-cms-user", "demos-state-user"];

    if (!validRoles.some((role) => roles.includes(role))) {
      log.info(
        {
          sub: decoded.sub,
          roles: roles ?? "none",
          userId: redactEmailAddress(userId),
        },
        "unauthorized: user has invalid roles"
      );
      throw new Error("Unauthorized");
    }

    log.info(
      {
        sub: decoded.sub,
        roles: roles,
        userId: redactEmailAddress(userId),
      },
      "success: user authorized"
    );

    return generatePolicy(decoded.sub, "Allow", event.methodArn, {
      sub: decoded.sub,
      email: decoded.email,
      given_name: decoded.given_name,
      family_name: decoded.family_name,
      role: roles,
      userId: userId,
      auth_time: decoded.auth_time,
    });
  });

const verifyToken = (token: string): Promise<jwt.JwtPayload> => {
  return new Promise((resolve, reject) => {
    log.debug("verifying jwt");
    jwt.verify(token, getKey, {}, (err, decoded) => {
      if (err) {
        log.warn(
          {
            err,
          },
          "invalid jwt"
        );
        return reject(err);
      }

      if (!decoded || typeof decoded == "string") {
        log.warn("invalid decoded jwt value");
        return reject(new Error("invalid decoded value"));
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
  userId: string;
  auth_time: number;
}

function generatePolicy(
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
  context: PassedContext
) {
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
