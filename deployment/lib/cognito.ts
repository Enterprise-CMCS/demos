import {
  aws_cognito,
  RemovalPolicy,
  Duration,
  aws_iam,
  Aws,
  Stack,
} from "aws-cdk-lib";
import { CommonProps } from "../types/props";

interface CognitoProps extends CommonProps {
  userPoolDomainPrefix?: string;
}

export interface CognitoOutputs {
  userPoolId: string;
  userPoolClientId: string;
  userPool: aws_cognito.UserPool;
  createAuthRole: (restApiId: string) => void;
  authority: string;
}

export function create(props: CognitoProps): CognitoOutputs {
  const userPool = new aws_cognito.UserPool(props.scope, "UserPool", {
    userPoolName: `${props.project}-${props.stage}-user-pool`,
    signInAliases: {
      email: true,
    },
    autoVerify: {
      email: true,
    },
    selfSignUpEnabled: false,
    standardAttributes: {
      givenName: {
        required: true,
        mutable: true,
      },
      familyName: {
        required: true,
        mutable: true,
      },
    },
    removalPolicy: RemovalPolicy.DESTROY, //TODO: should retain in PROD
    passwordPolicy: {
      minLength: 8,
      requireLowercase: true,
      requireUppercase: true,
      requireDigits: true,
      requireSymbols: true,
    },
  });

  const cfnUserPool = userPool.node.defaultChild as aws_cognito.CfnUserPool;
  cfnUserPool.adminCreateUserConfig = {
    allowAdminCreateUserOnly: true,
  };

  new aws_cognito.UserPoolDomain(props.scope, "UserPoolDomain", {
    userPool,
    cognitoDomain: {
      domainPrefix:
        props.userPoolDomainPrefix ||
        `${props.project}-${props.stage}-login-user-pool-client`,
    },
  });

  new aws_cognito.UserPoolResourceServer(props.scope, "ResourceServer", {
    userPool,
    identifier: "demosApi",
    scopes: [
      new aws_cognito.ResourceServerScope({
        scopeName: "read",
        scopeDescription: "read access",
      }),
      new aws_cognito.ResourceServerScope({
        scopeName: "write",
        scopeDescription: "write access",
      }),
    ],
  });

  const appUrl = "http://localhost:3000/";
  const cloudfrontUrl = "https://localhost:3000/"; //This will be a static, public url once available
  const userPoolClient = new aws_cognito.UserPoolClient(
    props.scope,
    "UserPoolClient",
    {
      userPoolClientName: `${props.project}-${props.stage}-user-pool-client`,
      userPool,
      authFlows: {
        adminUserPassword: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          aws_cognito.OAuthScope.EMAIL,
          aws_cognito.OAuthScope.OPENID,
          aws_cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [appUrl, cloudfrontUrl],
        defaultRedirectUri: appUrl,
        logoutUrls: [cloudfrontUrl, appUrl, `${appUrl}postLogout`],
      },
      accessTokenValidity: Duration.minutes(30),
      idTokenValidity: Duration.minutes(30),
      refreshTokenValidity: Duration.hours(24),
      // supportedIdentityProviders,
      generateSecret: false,
    }
  );

  const identityPool = new aws_cognito.CfnIdentityPool(
    props.scope,
    "CognitoIdentityPool",
    {
      identityPoolName: `${props.stage}IdentityPool`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    }
  );

  return {
    userPoolId: userPool.userPoolId,
    userPoolClientId: userPoolClient.userPoolClientId,
    userPool,
    createAuthRole: createAuthRole(props, identityPool),
    authority: `https://cognito-idp.${
      Stack.of(props.scope).region
    }.amazonaws.com/${userPool.userPoolId}`,
  };
}

const createAuthRole =
  (props: CognitoProps, identityPool: aws_cognito.CfnIdentityPool) =>
  (restApiId: string) => {
    const cognitoAuthRole = new aws_iam.Role(props.scope, "CognitoAuthRole", {
      permissionsBoundary: props.iamPermissionsBoundary,
      path: props.iamPath,
      assumedBy: new aws_iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
      inlinePolicies: {
        CognitoAuthorizedPolicy: new aws_iam.PolicyDocument({
          statements: [
            new aws_iam.PolicyStatement({
              actions: [
                "mobileanalytics:PutEvents",
                "cognito-sync:*",
                "cognito-identity:*",
              ],
              resources: ["*"],
              effect: aws_iam.Effect.ALLOW,
            }),
            new aws_iam.PolicyStatement({
              actions: ["execute-api:Invoke"],
              resources: [
                `arn:aws:execute-api:${Aws.REGION}:${Aws.ACCOUNT_ID}:${restApiId}/*`,
              ],
              effect: aws_iam.Effect.ALLOW,
            }),
          ],
        }),
      },
    });

    new aws_cognito.CfnIdentityPoolRoleAttachment(
      props.scope,
      "CognitoIdentityPoolRoles",
      {
        identityPoolId: identityPool.ref,
        roles: { authenticated: cognitoAuthRole.roleArn },
      }
    );
  };
