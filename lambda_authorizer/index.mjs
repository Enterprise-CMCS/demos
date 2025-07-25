import jwt from "jsonwebtoken";
import jwkClient from "jwks-rsa";

const client = jwkClient({
  jwksUri: process.env.JWKS_URI,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err || !key) return callback(err || new Error("Signing key not found"));
    var signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export const handler = async (event, context, callback) => {
  const token = event.authorizationToken.split(" ")[1];
  console.log("starting validation");

  if (!token) {
    console.log("no token");
    return callback("unauthorized");
  }

  console.log("token found");

  const decoded = await verifyToken(token);
  const roles = decoded["custom:roles"];

  if (!roles) {
    console.log(`user sub [${decoded.sub}] rejected with no roles`);
    return generatePolicy(decoded.sub, "Deny", event.methodArn, {});
  }

  const validRoles = ["demos-admin", "demos-cms-user", "demos-state-user"];

  if (!validRoles.some((role) => roles.includes(role))) {
    console.log(`user sub [${decoded.sub}] rejected with invalid roles [${roles}]`);
    return generatePolicy(decoded.sub, "Deny", event.methodArn, {});
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

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    console.log("verifying...");
    jwt.verify(token, getKey, {}, (err, decoded) => {
      if (err) {
        console.log("validation error:", err);
        return reject(new Error("User is not authenticated"));
      }
      resolve(decoded);
    });
  });
};

function generatePolicy(principalId, effect, resource, context) {
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
