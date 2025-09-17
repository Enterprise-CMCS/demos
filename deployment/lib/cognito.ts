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

export function create(props: CognitoProps): CognitoOutputs {
  // Remove Cognito IDP for TEST/VAL/PROD and will be IDM. Only DEV & ephemeral will be Cognito IDP.
  const allowNativeCognitoIdp = props.isDev || props.isEphemeral;

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

  // Set up SAML IdP for IDM
  const IDM = createIdmIdp(props.scope, props.stage, userPool, props.idmMetadataEndpoint!);
  const httpsCloudfront = `https://${props.cloudfrontHost}/`;
  const idmLogout = `https://test.idp.idm.cms.gov/login/signout`;
  const callbackUrls =
    props.isEphemeral || ["dev", "test"].includes(props.stage)
      ? [httpsCloudfront, "http://localhost:3000/"]
      : [httpsCloudfront];
  const logoutUrls = [
    ...callbackUrls,
    ...(["dev", "test"].includes(props.stage) || props.isEphemeral ? [idmLogout] : []),
  ];

  const userPoolClient = new aws_cognito.UserPoolClient(props.scope, "UserPoolClient", {
    userPoolClientName: `${props.project}-${props.stage}-user-pool-client`,
    userPool,
    authFlows: {
      adminUserPassword: true,
    },
    oAuth: {
      flows: {
        authorizationCodeGrant: true,
      },
      scopes: [aws_cognito.OAuthScope.EMAIL, aws_cognito.OAuthScope.OPENID, aws_cognito.OAuthScope.PROFILE],
      callbackUrls,
      defaultRedirectUri: httpsCloudfront,
      logoutUrls,
    },
    accessTokenValidity: Duration.minutes(30),
    idTokenValidity: Duration.minutes(30),
    refreshTokenValidity: Duration.hours(24),
    supportedIdentityProviders: [
      UserPoolClientIdentityProvider.custom(IDM.providerName),
      ...(allowNativeCognitoIdp ? [UserPoolClientIdentityProvider.COGNITO] : []),
    ],
    generateSecret: false,
  });

  new aws_cognito.CfnManagedLoginBranding(props.scope, "CognitoBranding", {
    userPoolId: userPool.userPoolId,
    assets: cognitoHostedUiAssets,
    clientId: userPoolClient.userPoolClientId,
    settings: cognitoHostedUiSettings,
  });

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
  // Remove Cognito IDP for TEST/VAL/PROD and will be IDM. Only DEV & ephemeral will be Cognito IDP.
  const allowNativeCognitoIdp = props.isDev || props.isEphemeral;

  const userPool = aws_cognito.UserPool.fromUserPoolId(props.scope, "importedUserPool", userPoolId);

  const httpsCloudfront = `https://${props.cloudfrontHost}/`;

  const callbackUrls =
    props.isEphemeral || ["dev", "test"].includes(props.stage)
      ? [httpsCloudfront, "http://localhost:3000/"]
      : [httpsCloudfront]; //This will be a static, public url once available

  const IDM = createIdmIdp(props.scope, props.stage, userPool, props.idmMetadataEndpoint!);

  const userPoolClient = new aws_cognito.UserPoolClient(props.scope, "UserPoolClient", {
    userPoolClientName: `${props.project}-${props.stage}-user-pool-client`,
    userPool,
    authFlows: {
      adminUserPassword: true,
    },
    oAuth: {
      flows: {
        authorizationCodeGrant: true,
      },
      scopes: [aws_cognito.OAuthScope.EMAIL, aws_cognito.OAuthScope.OPENID, aws_cognito.OAuthScope.PROFILE],
      callbackUrls,
      defaultRedirectUri: httpsCloudfront,
      logoutUrls: callbackUrls.flatMap((url) => [url, `${url}sign-out`, `${url}signed-out`]),
    },
    accessTokenValidity: Duration.minutes(30),
    idTokenValidity: Duration.minutes(30),
    refreshTokenValidity: Duration.hours(24),
    supportedIdentityProviders: [
      UserPoolClientIdentityProvider.custom(IDM.providerName),
      ...(allowNativeCognitoIdp ? [UserPoolClientIdentityProvider.COGNITO] : []),
    ],
    generateSecret: false,
  });

  const domainPrefix = getCognitoDomainPrefix(props.project, hostEnvironment);

  new aws_cognito.CfnManagedLoginBranding(props.scope, "CognitoBranding", {
    userPoolId: userPool.userPoolId,
    clientId: userPoolClient.userPoolClientId,
    assets: cognitoHostedUiAssets,
    settings: cognitoHostedUiSettings,
  });

  return {
    userPool,
    userPoolId: userPool.userPoolId,
    userPoolClientId: userPoolClient.userPoolClientId,
    authority: `https://cognito-idp.${Stack.of(props.scope).region}.amazonaws.com/${userPool.userPoolId}`,
    domain: `https://${domainPrefix}.auth.${Aws.REGION}.amazoncognito.com`,
  };
};

const getCognitoDomainPrefix = (project: string, stage: string): string => `${project}-${stage}-login-user-pool-client`;
