import { aws_cognito, RemovalPolicy, Duration, Aws, Stack } from "aws-cdk-lib";
import { CommonProps } from "../types/props";
import {
  ProviderAttribute,
  UserPoolClientIdentityProvider,
  UserPoolIdentityProviderSaml,
  UserPoolIdentityProviderSamlMetadata,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { cognitoHostedUiSettings, cognitoHostedUiAssets } from "./cognitoAssets";

interface CognitoProps extends CommonProps {
  userPoolDomainPrefix?: string;
}

export interface CognitoOutputs {
  userPoolId: string;
  userPoolClientId: string;
  userPool: aws_cognito.UserPool | aws_cognito.IUserPool;
  // createAuthRole: (restApiId: string) => void;
  authority: string;
  domain: string;
}

// Shared helpers to avoid duplication
const NON_PROD_STAGES = ["dev", "test"] as const;
type NonProdStage = typeof NON_PROD_STAGES[number];
const LOCALHOST_URL = "http://localhost:3000/" as const;
const IDM_LOGOUT_URL = "https://test.idp.idm.cms.gov/login/signout" as const;

const getHttpsCloudfront = (props: CognitoProps): string => `https://${props.cloudfrontHost}/`;
const getCallbackUrls = (props: CognitoProps): string[] => {
  const httpsCloudfront = getHttpsCloudfront(props);
  return props.isEphemeral || NON_PROD_STAGES.includes(props.stage as NonProdStage)
    ? [httpsCloudfront, LOCALHOST_URL]
    : [httpsCloudfront];
};
const getLogoutUrls = (props: CognitoProps, callbackUrls: string[]): string[] => [
  ...callbackUrls,
  ...(props.isEphemeral || NON_PROD_STAGES.includes(props.stage as NonProdStage) ? [IDM_LOGOUT_URL] : []),
];

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
    removalPolicy: RemovalPolicy.RETAIN,
    passwordPolicy: {
      minLength: 8,
      requireLowercase: true,
      requireUppercase: true,
      requireDigits: true,
      requireSymbols: true,
    },
    customAttributes: {
      roles: new aws_cognito.StringAttribute({
        // Cognito custom attributes can't be modified once added. Since our
        // integration is closely tied to IDM and the only way to fix this would
        // be to delete the user pool completely and recreate it, then work with
        // IDM to reconfigure everything, we are using this ternary as a
        // workaround to avoid extra work
        minLen: props.stage == "dev" ? undefined : 0,
        maxLen: props.stage == "dev" ? undefined : 2048,
        mutable: true,
      }),
    },
  });

  const cfnUserPool = userPool.node.defaultChild as aws_cognito.CfnUserPool;
  cfnUserPool.adminCreateUserConfig = {
    allowAdminCreateUserOnly: true,
  };

  const domain = new aws_cognito.UserPoolDomain(props.scope, "UserPoolDomain", {
    userPool,
    cognitoDomain: {
      domainPrefix: props.userPoolDomainPrefix ?? getCognitoDomainPrefix(props.project, props.stage),
    },
    managedLoginVersion: aws_cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN,
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

  // Set up SAML IdP for IDM and user pool client + branding
  const IDM = createIdmIdp(props.scope, props.stage, userPool, props.idmMetadataEndpoint!);
  const userPoolClient = createUserPoolClientResource(props, userPool, IDM.providerName);
  addCognitoBranding(props, userPool.userPoolId, userPoolClient.userPoolClientId);

  return {
    userPoolId: userPool.userPoolId,
    userPoolClientId: userPoolClient.userPoolClientId,
    userPool,
    // createAuthRole: createAuthRole(props, identityPool),
    authority: `https://cognito-idp.${Stack.of(props.scope).region}.amazonaws.com/${userPool.userPoolId}`,
    domain: domain.baseUrl(),
  };
}

function createIdmIdp(scope: Construct, stage: string, userPool: aws_cognito.IUserPool, metadataEndpoint: string) {
  return new UserPoolIdentityProviderSaml(scope, "idmSamlProvider", {
    userPool,
    name: `demos-${stage}-idm`,
    metadata: UserPoolIdentityProviderSamlMetadata.url(metadataEndpoint),
    attributeMapping: {
      email: ProviderAttribute.other("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"),
      familyName: ProviderAttribute.other("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"),
      givenName: ProviderAttribute.other("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"),
      custom: {
        "custom:roles": ProviderAttribute.other("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/roles"),
      },
    },
  });
}

export const createUserPoolClient = (
  props: CognitoProps,
  userPoolId: string,
  hostEnvironment: string
): CognitoOutputs => {
  const userPool = aws_cognito.UserPool.fromUserPoolId(props.scope, "importedUserPool", userPoolId);
  const IDM = createIdmIdp(props.scope, props.stage, userPool, props.idmMetadataEndpoint!);
  const userPoolClient = createUserPoolClientResource(props, userPool, IDM.providerName);

  const domainPrefix = getCognitoDomainPrefix(props.project, hostEnvironment);

  addCognitoBranding(props, userPool.userPoolId, userPoolClient.userPoolClientId);

  return {
    userPool,
    userPoolId: userPool.userPoolId,
    userPoolClientId: userPoolClient.userPoolClientId,
    authority: `https://cognito-idp.${Stack.of(props.scope).region}.amazonaws.com/${userPool.userPoolId}`,
    domain: `https://${domainPrefix}.auth.${Aws.REGION}.amazoncognito.com`,
  };
};

const getCognitoDomainPrefix = (project: string, stage: string): string => `${project}-${stage}-login-user-pool-client`;

// ---- Internal helpers for CDK resources ----
const allowNativeCognitoIdp = (props: CognitoProps): boolean => props.isDev || props.isEphemeral;

const createUserPoolClientResource = (
  props: CognitoProps,
  userPool: aws_cognito.IUserPool,
  idmProviderName: string
) => {
  const callbackUrls = getCallbackUrls(props);
  const logoutUrls = getLogoutUrls(props, callbackUrls);
  return new aws_cognito.UserPoolClient(props.scope, "UserPoolClient", {
    userPoolClientName: `${props.project}-${props.stage}-user-pool-client`,
    userPool,
    authFlows: { adminUserPassword: true },
    oAuth: {
      flows: { authorizationCodeGrant: true },
      scopes: [aws_cognito.OAuthScope.EMAIL, aws_cognito.OAuthScope.OPENID, aws_cognito.OAuthScope.PROFILE],
      callbackUrls,
      defaultRedirectUri: getHttpsCloudfront(props),
      logoutUrls,
    },
    accessTokenValidity: Duration.minutes(30),
    idTokenValidity: Duration.minutes(30),
    refreshTokenValidity: Duration.hours(24),
    supportedIdentityProviders: [
      UserPoolClientIdentityProvider.custom(idmProviderName),
      ...(allowNativeCognitoIdp(props) ? [UserPoolClientIdentityProvider.COGNITO] : []),
    ],
    generateSecret: false,
  });
};

const addCognitoBranding = (props: CognitoProps, userPoolId: string, clientId: string) => {
  new aws_cognito.CfnManagedLoginBranding(props.scope, "CognitoBranding", {
    userPoolId,
    assets: cognitoHostedUiAssets,
    clientId,
    settings: cognitoHostedUiSettings,
  });
};
