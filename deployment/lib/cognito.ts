import {
  aws_cognito,
  RemovalPolicy,
  Duration,
  Aws,
  Stack,
} from "aws-cdk-lib";
import { CommonProps } from "../types/props";
import { readFileSync } from "fs";
import { ProviderAttribute, UserPoolClientIdentityProvider, UserPoolIdentityProviderSaml, UserPoolIdentityProviderSamlMetadata } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

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

const formLogo = readFileSync("images/formLogo.png");
const pageFooterLogo = readFileSync("images/pageFooterLogo.png");
const pageHeaderLogoDark = readFileSync("images/pageHeaderLogoDark.png");
const pageHeaderLogoLight = readFileSync("images/pageHeaderLogoLight.png");

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
    customAttributes: {
      roles:
      new aws_cognito.StringAttribute({
        minLen: 0,
        maxLen: 2048,
        mutable: true
      })
    },
  });

  const cfnUserPool = userPool.node.defaultChild as aws_cognito.CfnUserPool;
  cfnUserPool.adminCreateUserConfig = {
    allowAdminCreateUserOnly: true,
  };

  const domain = new aws_cognito.UserPoolDomain(props.scope, "UserPoolDomain", {
    userPool,
    cognitoDomain: {
      domainPrefix:
        props.userPoolDomainPrefix ||
        getCognitoDomainPrefix(props.project, props.stage),
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

  const IDM = createIdmIdp(props.scope, props.stage, userPool, props.idmMetadataEndpoint!)

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
      supportedIdentityProviders: [
        UserPoolClientIdentityProvider.custom(IDM.providerName),
        UserPoolClientIdentityProvider.COGNITO
      ],
      generateSecret: false,
    }
  );


  const formLogo = readFileSync("images/formLogo.png");
  const pageFooterLogo = readFileSync("images/pageFooterLogo.png");
  const pageHeaderLogoDark = readFileSync("images/pageHeaderLogoDark.png");
  const pageHeaderLogoLight = readFileSync("images/pageHeaderLogoLight.png");

  new aws_cognito.CfnManagedLoginBranding(props.scope, "CognitoBranding", {
    userPoolId: userPool.userPoolId,
    assets: [
      {
        category: "PAGE_FOOTER_LOGO",
        colorMode: "DARK",
        extension: "PNG",
        bytes: pageFooterLogo.toString("base64"),
      },
      {
        category: "PAGE_HEADER_LOGO",
        colorMode: "DARK",
        extension: "PNG",
        bytes: pageHeaderLogoDark.toString("base64"),
      },
      {
        category: "FORM_LOGO",
        colorMode: "LIGHT",
        extension: "PNG",
        bytes: formLogo.toString("base64"),
      },
      {
        category: "PAGE_FOOTER_LOGO",
        colorMode: "LIGHT",
        extension: "PNG",
        bytes: pageFooterLogo.toString("base64"),
      },
      {
        category: "PAGE_HEADER_LOGO",
        colorMode: "LIGHT",
        extension: "PNG",
        bytes: pageHeaderLogoLight.toString("base64"),
      },
    ],
    clientId: userPoolClient.userPoolClientId,
    settings: {
      components: {
        secondaryButton: {
          lightMode: {
            hover: {
              backgroundColor: "f2f8fdff",
              borderColor: "033160ff",
              textColor: "033160ff",
            },
            defaults: {
              backgroundColor: "ffffffff",
              borderColor: "0972d3ff",
              textColor: "0972d3ff",
            },
            active: {
              backgroundColor: "d3e7f9ff",
              borderColor: "033160ff",
              textColor: "033160ff",
            },
          },
          darkMode: {
            hover: {
              backgroundColor: "192534ff",
              borderColor: "89bdeeff",
              textColor: "89bdeeff",
            },
            defaults: {
              backgroundColor: "0f1b2aff",
              borderColor: "539fe5ff",
              textColor: "539fe5ff",
            },
            active: {
              backgroundColor: "354150ff",
              borderColor: "89bdeeff",
              textColor: "89bdeeff",
            },
          },
        },
        form: {
          lightMode: {
            backgroundColor: "ffffffff",
            borderColor: "c6c6cdff",
          },
          borderRadius: 2.0,
          backgroundImage: {
            enabled: false,
          },
          logo: {
            location: "CENTER",
            position: "TOP",
            enabled: true,
            formInclusion: "IN",
          },
          darkMode: {
            backgroundColor: "0f1b2aff",
            borderColor: "424650ff",
          },
        },
        alert: {
          lightMode: {
            error: {
              backgroundColor: "fff7f7ff",
              borderColor: "d91515ff",
            },
          },
          borderRadius: 12.0,
          darkMode: {
            error: {
              backgroundColor: "1a0000ff",
              borderColor: "eb6f6fff",
            },
          },
        },
        favicon: {
          enabledTypes: ["ICO", "SVG"],
        },
        pageBackground: {
          image: {
            enabled: false,
          },
          lightMode: {
            color: "ffffffff",
          },
          darkMode: {
            color: "0f1b2aff",
          },
        },
        pageText: {
          lightMode: {
            bodyColor: "414d5cff",
            headingColor: "000716ff",
            descriptionColor: "414d5cff",
          },
          darkMode: {
            bodyColor: "b6bec9ff",
            headingColor: "d1d5dbff",
            descriptionColor: "b6bec9ff",
          },
        },
        phoneNumberSelector: {
          displayType: "TEXT",
        },
        primaryButton: {
          lightMode: {
            hover: {
              backgroundColor: "033160ff",
              textColor: "ffffffff",
            },
            defaults: {
              backgroundColor: "0972d3ff",
              textColor: "ffffffff",
            },
            active: {
              backgroundColor: "033160ff",
              textColor: "ffffffff",
            },
            disabled: {
              backgroundColor: "ffffffff",
              borderColor: "ffffffff",
            },
          },
          darkMode: {
            hover: {
              backgroundColor: "89bdeeff",
              textColor: "000716ff",
            },
            defaults: {
              backgroundColor: "539fe5ff",
              textColor: "000716ff",
            },
            active: {
              backgroundColor: "539fe5ff",
              textColor: "000716ff",
            },
            disabled: {
              backgroundColor: "ffffffff",
              borderColor: "ffffffff",
            },
          },
        },
        pageFooter: {
          lightMode: {
            borderColor: "d5dbdbff",
            background: {
              color: "ffffffff",
            },
          },
          backgroundImage: {
            enabled: false,
          },
          logo: {
            location: "CENTER",
            enabled: true,
          },
          darkMode: {
            borderColor: "424650ff",
            background: {
              color: "4c5867ff",
            },
          },
        },
        pageHeader: {
          lightMode: {
            borderColor: "d5dbdbff",
            background: {
              color: "ffffffff",
            },
          },
          backgroundImage: {
            enabled: false,
          },
          logo: {
            location: "START",
            enabled: true,
          },
          darkMode: {
            borderColor: "424650ff",
            background: {
              color: "4c5867ff",
            },
          },
        },
        idpButton: {
          standard: {
            lightMode: {
              hover: {
                backgroundColor: "f2f8fdff",
                borderColor: "033160ff",
                textColor: "033160ff",
              },
              defaults: {
                backgroundColor: "ffffffff",
                borderColor: "424650ff",
                textColor: "424650ff",
              },
              active: {
                backgroundColor: "d3e7f9ff",
                borderColor: "033160ff",
                textColor: "033160ff",
              },
            },
            darkMode: {
              hover: {
                backgroundColor: "192534ff",
                borderColor: "89bdeeff",
                textColor: "89bdeeff",
              },
              defaults: {
                backgroundColor: "0f1b2aff",
                borderColor: "c6c6cdff",
                textColor: "c6c6cdff",
              },
              active: {
                backgroundColor: "354150ff",
                borderColor: "89bdeeff",
                textColor: "89bdeeff",
              },
            },
          },
          custom: {},
        },
      },
      componentClasses: {
        dropDown: {
          lightMode: {
            hover: {
              itemBackgroundColor: "f4f4f4ff",
              itemBorderColor: "7d8998ff",
              itemTextColor: "000716ff",
            },
            defaults: {
              itemBackgroundColor: "ffffffff",
            },
            match: {
              itemBackgroundColor: "414d5cff",
              itemTextColor: "0972d3ff",
            },
          },
          borderRadius: 8.0,
          darkMode: {
            hover: {
              itemBackgroundColor: "081120ff",
              itemBorderColor: "5f6b7aff",
              itemTextColor: "e9ebedff",
            },
            defaults: {
              itemBackgroundColor: "192534ff",
            },
            match: {
              itemBackgroundColor: "d1d5dbff",
              itemTextColor: "89bdeeff",
            },
          },
        },
        input: {
          lightMode: {
            defaults: {
              backgroundColor: "ffffffff",
              borderColor: "7d8998ff",
            },
            placeholderColor: "5f6b7aff",
          },
          borderRadius: 2.0,
          darkMode: {
            defaults: {
              backgroundColor: "0f1b2aff",
              borderColor: "5f6b7aff",
            },
            placeholderColor: "8d99a8ff",
          },
        },
        inputDescription: {
          lightMode: {
            textColor: "5f6b7aff",
          },
          darkMode: {
            textColor: "8d99a8ff",
          },
        },
        buttons: {
          borderRadius: 2.0,
        },
        optionControls: {
          lightMode: {
            defaults: {
              backgroundColor: "ffffffff",
              borderColor: "7d8998ff",
            },
            selected: {
              backgroundColor: "0972d3ff",
              foregroundColor: "ffffffff",
            },
          },
          darkMode: {
            defaults: {
              backgroundColor: "0f1b2aff",
              borderColor: "7d8998ff",
            },
            selected: {
              backgroundColor: "539fe5ff",
              foregroundColor: "000716ff",
            },
          },
        },
        statusIndicator: {
          lightMode: {
            success: {
              backgroundColor: "f2fcf3ff",
              borderColor: "037f0cff",
              indicatorColor: "037f0cff",
            },
            pending: {
              indicatorColor: "AAAAAAAA",
            },
            warning: {
              backgroundColor: "fffce9ff",
              borderColor: "8d6605ff",
              indicatorColor: "8d6605ff",
            },
            error: {
              backgroundColor: "fff7f7ff",
              borderColor: "d91515ff",
              indicatorColor: "d91515ff",
            },
          },
          darkMode: {
            success: {
              backgroundColor: "001a02ff",
              borderColor: "29ad32ff",
              indicatorColor: "29ad32ff",
            },
            pending: {
              indicatorColor: "AAAAAAAA",
            },
            warning: {
              backgroundColor: "1d1906ff",
              borderColor: "e0ca57ff",
              indicatorColor: "e0ca57ff",
            },
            error: {
              backgroundColor: "1a0000ff",
              borderColor: "eb6f6fff",
              indicatorColor: "eb6f6fff",
            },
          },
        },
        divider: {
          lightMode: {
            borderColor: "ebebf0ff",
          },
          darkMode: {
            borderColor: "232b37ff",
          },
        },
        idpButtons: {
          icons: {
            enabled: true,
          },
        },
        focusState: {
          lightMode: {
            borderColor: "0972d3ff",
          },
          darkMode: {
            borderColor: "539fe5ff",
          },
        },
        inputLabel: {
          lightMode: {
            textColor: "000716ff",
          },
          darkMode: {
            textColor: "d1d5dbff",
          },
        },
        link: {
          lightMode: {
            hover: {
              textColor: "033160ff",
            },
            defaults: {
              textColor: "0972d3ff",
            },
          },
          darkMode: {
            hover: {
              textColor: "89bdeeff",
            },
            defaults: {
              textColor: "539fe5ff",
            },
          },
        },
      },
      categories: {
        form: {
          sessionTimerDisplay: "NONE",
          instructions: {
            enabled: false,
          },
          languageSelector: {
            enabled: false,
          },
          displayGraphics: true,
          location: {
            horizontal: "CENTER",
            vertical: "CENTER",
          },
        },
        auth: {
          federation: {
            interfaceStyle: "BUTTON_LIST",
            order: [],
          },
          authMethodOrder: [
            [
              {
                display: "BUTTON",
                type: "FEDERATED",
              },
              {
                display: "INPUT",
                type: "USERNAME_PASSWORD",
              },
            ],
          ],
        },
        global: {
          colorSchemeMode: "LIGHT",
          pageHeader: {
            enabled: true,
          },
          pageFooter: {
            enabled: true,
          },
          spacingDensity: "REGULAR",
        },
        signUp: {
          acceptanceElements: [
            {
              enforcement: "NONE",
              textKey: "en",
            },
          ],
        },
      },
    },
  });

  // new CfnUserPoolUICustomizationAttachment(props.scope, 'cognitoUiCustomization', {
  //   userPoolId: userPool.userPoolId,
  //   clientId: "ALL",
  //   css
  // })

  return {
    userPoolId: userPool.userPoolId,
    userPoolClientId: userPoolClient.userPoolClientId,
    userPool,
    // createAuthRole: createAuthRole(props, identityPool),
    authority: `https://cognito-idp.${
      Stack.of(props.scope).region
    }.amazonaws.com/${userPool.userPoolId}`,
    domain: domain.baseUrl()
  };
}

// const createAuthRole =
//   (props: CognitoProps, identityPool: aws_cognito.CfnIdentityPool) =>
//   (restApiId: string) => {
//     const cognitoAuthRole = new aws_iam.Role(props.scope, "CognitoAuthRole", {
//       permissionsBoundary: props.iamPermissionsBoundary,
//       path: props.iamPath,
//       assumedBy: new aws_iam.FederatedPrincipal(
//         "cognito-identity.amazonaws.com",
//         {
//           StringEquals: {
//             "cognito-identity.amazonaws.com:aud": identityPool.ref,
//           },
//           "ForAnyValue:StringLike": {
//             "cognito-identity.amazonaws.com:amr": "authenticated",
//           },
//         },
//         "sts:AssumeRoleWithWebIdentity"
//       ),
//       inlinePolicies: {
//         CognitoAuthorizedPolicy: new aws_iam.PolicyDocument({
//           statements: [
//             new aws_iam.PolicyStatement({
//               actions: [
//                 "mobileanalytics:PutEvents",
//                 "cognito-sync:*",
//                 "cognito-identity:*",
//               ],
//               resources: ["*"],
//               effect: aws_iam.Effect.ALLOW,
//             }),
//             new aws_iam.PolicyStatement({
//               actions: ["execute-api:Invoke"],
//               resources: [
//                 `arn:aws:execute-api:${Aws.REGION}:${Aws.ACCOUNT_ID}:${restApiId}/*`,
//               ],
//               effect: aws_iam.Effect.ALLOW,
//             }),
//           ],
//         }),
//       },
//     });

//     new aws_cognito.CfnIdentityPoolRoleAttachment(
//       props.scope,
//       "CognitoIdentityPoolRoles",
//       {
//         identityPoolId: identityPool.ref,
//         roles: { authenticated: cognitoAuthRole.roleArn },
//       }
//     );
//   };

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
        "custom:roles": ProviderAttribute.other("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/roles")
      }
    }
  })
}

export const createUserPoolClient = (props: CognitoProps, userPoolId: string, hostEnvironment: string): CognitoOutputs => {
  const userPool = aws_cognito.UserPool.fromUserPoolId(props.scope, "importedUserPool", userPoolId)

  const appUrl = "http://localhost:3000/";
  const cloudfrontUrl = "https://localhost:3000/"; //This will be a static, public url once available

  const IDM = createIdmIdp(props.scope, props.stage, userPool, props.idmMetadataEndpoint!)

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
      supportedIdentityProviders: [
        UserPoolClientIdentityProvider.custom(IDM.providerName),
        UserPoolClientIdentityProvider.COGNITO
      ],
      generateSecret: false,
      }
  );

  const domainPrefix = getCognitoDomainPrefix(props.project, hostEnvironment)

  new aws_cognito.CfnManagedLoginBranding(props.scope, "CognitoBranding", {
    userPoolId: userPool.userPoolId,
    clientId: userPoolClient.userPoolClientId,
    assets: [
      {
        category: "PAGE_FOOTER_LOGO",
        colorMode: "DARK",
        extension: "PNG",
        bytes: pageFooterLogo.toString("base64"),
      },
      {
        category: "PAGE_HEADER_LOGO",
        colorMode: "DARK",
        extension: "PNG",
        bytes: pageHeaderLogoDark.toString("base64"),
      },
      {
        category: "FORM_LOGO",
        colorMode: "LIGHT",
        extension: "PNG",
        bytes: formLogo.toString("base64"),
      },
      {
        category: "PAGE_FOOTER_LOGO",
        colorMode: "LIGHT",
        extension: "PNG",
        bytes: pageFooterLogo.toString("base64"),
      },
      {
        category: "PAGE_HEADER_LOGO",
        colorMode: "LIGHT",
        extension: "PNG",
        bytes: pageHeaderLogoLight.toString("base64"),
      },
    ],
    settings: {
      components: {
        secondaryButton: {
          lightMode: {
            hover: {
              backgroundColor: "f2f8fdff",
              borderColor: "033160ff",
              textColor: "033160ff",
            },
            defaults: {
              backgroundColor: "ffffffff",
              borderColor: "0972d3ff",
              textColor: "0972d3ff",
            },
            active: {
              backgroundColor: "d3e7f9ff",
              borderColor: "033160ff",
              textColor: "033160ff",
            },
          },
          darkMode: {
            hover: {
              backgroundColor: "192534ff",
              borderColor: "89bdeeff",
              textColor: "89bdeeff",
            },
            defaults: {
              backgroundColor: "0f1b2aff",
              borderColor: "539fe5ff",
              textColor: "539fe5ff",
            },
            active: {
              backgroundColor: "354150ff",
              borderColor: "89bdeeff",
              textColor: "89bdeeff",
            },
          },
        },
        form: {
          lightMode: {
            backgroundColor: "ffffffff",
            borderColor: "c6c6cdff",
          },
          borderRadius: 2.0,
          backgroundImage: {
            enabled: false,
          },
          logo: {
            location: "CENTER",
            position: "TOP",
            enabled: true,
            formInclusion: "IN",
          },
          darkMode: {
            backgroundColor: "0f1b2aff",
            borderColor: "424650ff",
          },
        },
        alert: {
          lightMode: {
            error: {
              backgroundColor: "fff7f7ff",
              borderColor: "d91515ff",
            },
          },
          borderRadius: 12.0,
          darkMode: {
            error: {
              backgroundColor: "1a0000ff",
              borderColor: "eb6f6fff",
            },
          },
        },
        favicon: {
          enabledTypes: ["ICO", "SVG"],
        },
        pageBackground: {
          image: {
            enabled: false,
          },
          lightMode: {
            color: "ffffffff",
          },
          darkMode: {
            color: "0f1b2aff",
          },
        },
        pageText: {
          lightMode: {
            bodyColor: "414d5cff",
            headingColor: "000716ff",
            descriptionColor: "414d5cff",
          },
          darkMode: {
            bodyColor: "b6bec9ff",
            headingColor: "d1d5dbff",
            descriptionColor: "b6bec9ff",
          },
        },
        phoneNumberSelector: {
          displayType: "TEXT",
        },
        primaryButton: {
          lightMode: {
            hover: {
              backgroundColor: "033160ff",
              textColor: "ffffffff",
            },
            defaults: {
              backgroundColor: "0972d3ff",
              textColor: "ffffffff",
            },
            active: {
              backgroundColor: "033160ff",
              textColor: "ffffffff",
            },
            disabled: {
              backgroundColor: "ffffffff",
              borderColor: "ffffffff",
            },
          },
          darkMode: {
            hover: {
              backgroundColor: "89bdeeff",
              textColor: "000716ff",
            },
            defaults: {
              backgroundColor: "539fe5ff",
              textColor: "000716ff",
            },
            active: {
              backgroundColor: "539fe5ff",
              textColor: "000716ff",
            },
            disabled: {
              backgroundColor: "ffffffff",
              borderColor: "ffffffff",
            },
          },
        },
        pageFooter: {
          lightMode: {
            borderColor: "d5dbdbff",
            background: {
              color: "ffffffff",
            },
          },
          backgroundImage: {
            enabled: false,
          },
          logo: {
            location: "CENTER",
            enabled: true,
          },
          darkMode: {
            borderColor: "424650ff",
            background: {
              color: "4c5867ff",
            },
          },
        },
        pageHeader: {
          lightMode: {
            borderColor: "d5dbdbff",
            background: {
              color: "ffffffff",
            },
          },
          backgroundImage: {
            enabled: false,
          },
          logo: {
            location: "START",
            enabled: true,
          },
          darkMode: {
            borderColor: "424650ff",
            background: {
              color: "4c5867ff",
            },
          },
        },
        idpButton: {
          standard: {
            lightMode: {
              hover: {
                backgroundColor: "f2f8fdff",
                borderColor: "033160ff",
                textColor: "033160ff",
              },
              defaults: {
                backgroundColor: "ffffffff",
                borderColor: "424650ff",
                textColor: "424650ff",
              },
              active: {
                backgroundColor: "d3e7f9ff",
                borderColor: "033160ff",
                textColor: "033160ff",
              },
            },
            darkMode: {
              hover: {
                backgroundColor: "192534ff",
                borderColor: "89bdeeff",
                textColor: "89bdeeff",
              },
              defaults: {
                backgroundColor: "0f1b2aff",
                borderColor: "c6c6cdff",
                textColor: "c6c6cdff",
              },
              active: {
                backgroundColor: "354150ff",
                borderColor: "89bdeeff",
                textColor: "89bdeeff",
              },
            },
          },
          custom: {},
        },
      },
      componentClasses: {
        dropDown: {
          lightMode: {
            hover: {
              itemBackgroundColor: "f4f4f4ff",
              itemBorderColor: "7d8998ff",
              itemTextColor: "000716ff",
            },
            defaults: {
              itemBackgroundColor: "ffffffff",
            },
            match: {
              itemBackgroundColor: "414d5cff",
              itemTextColor: "0972d3ff",
            },
          },
          borderRadius: 8.0,
          darkMode: {
            hover: {
              itemBackgroundColor: "081120ff",
              itemBorderColor: "5f6b7aff",
              itemTextColor: "e9ebedff",
            },
            defaults: {
              itemBackgroundColor: "192534ff",
            },
            match: {
              itemBackgroundColor: "d1d5dbff",
              itemTextColor: "89bdeeff",
            },
          },
        },
        input: {
          lightMode: {
            defaults: {
              backgroundColor: "ffffffff",
              borderColor: "7d8998ff",
            },
            placeholderColor: "5f6b7aff",
          },
          borderRadius: 2.0,
          darkMode: {
            defaults: {
              backgroundColor: "0f1b2aff",
              borderColor: "5f6b7aff",
            },
            placeholderColor: "8d99a8ff",
          },
        },
        inputDescription: {
          lightMode: {
            textColor: "5f6b7aff",
          },
          darkMode: {
            textColor: "8d99a8ff",
          },
        },
        buttons: {
          borderRadius: 2.0,
        },
        optionControls: {
          lightMode: {
            defaults: {
              backgroundColor: "ffffffff",
              borderColor: "7d8998ff",
            },
            selected: {
              backgroundColor: "0972d3ff",
              foregroundColor: "ffffffff",
            },
          },
          darkMode: {
            defaults: {
              backgroundColor: "0f1b2aff",
              borderColor: "7d8998ff",
            },
            selected: {
              backgroundColor: "539fe5ff",
              foregroundColor: "000716ff",
            },
          },
        },
        statusIndicator: {
          lightMode: {
            success: {
              backgroundColor: "f2fcf3ff",
              borderColor: "037f0cff",
              indicatorColor: "037f0cff",
            },
            pending: {
              indicatorColor: "AAAAAAAA",
            },
            warning: {
              backgroundColor: "fffce9ff",
              borderColor: "8d6605ff",
              indicatorColor: "8d6605ff",
            },
            error: {
              backgroundColor: "fff7f7ff",
              borderColor: "d91515ff",
              indicatorColor: "d91515ff",
            },
          },
          darkMode: {
            success: {
              backgroundColor: "001a02ff",
              borderColor: "29ad32ff",
              indicatorColor: "29ad32ff",
            },
            pending: {
              indicatorColor: "AAAAAAAA",
            },
            warning: {
              backgroundColor: "1d1906ff",
              borderColor: "e0ca57ff",
              indicatorColor: "e0ca57ff",
            },
            error: {
              backgroundColor: "1a0000ff",
              borderColor: "eb6f6fff",
              indicatorColor: "eb6f6fff",
            },
          },
        },
        divider: {
          lightMode: {
            borderColor: "ebebf0ff",
          },
          darkMode: {
            borderColor: "232b37ff",
          },
        },
        idpButtons: {
          icons: {
            enabled: true,
          },
        },
        focusState: {
          lightMode: {
            borderColor: "0972d3ff",
          },
          darkMode: {
            borderColor: "539fe5ff",
          },
        },
        inputLabel: {
          lightMode: {
            textColor: "000716ff",
          },
          darkMode: {
            textColor: "d1d5dbff",
          },
        },
        link: {
          lightMode: {
            hover: {
              textColor: "033160ff",
            },
            defaults: {
              textColor: "0972d3ff",
            },
          },
          darkMode: {
            hover: {
              textColor: "89bdeeff",
            },
            defaults: {
              textColor: "539fe5ff",
            },
          },
        },
      },
      categories: {
        form: {
          sessionTimerDisplay: "NONE",
          instructions: {
            enabled: false,
          },
          languageSelector: {
            enabled: false,
          },
          displayGraphics: true,
          location: {
            horizontal: "CENTER",
            vertical: "CENTER",
          },
        },
        auth: {
          federation: {
            interfaceStyle: "BUTTON_LIST",
            order: [],
          },
          authMethodOrder: [
            [
              {
                display: "BUTTON",
                type: "FEDERATED",
              },
              {
                display: "INPUT",
                type: "USERNAME_PASSWORD",
              },
            ],
          ],
        },
        global: {
          colorSchemeMode: "LIGHT",
          pageHeader: {
            enabled: true,
          },
          pageFooter: {
            enabled: true,
          },
          spacingDensity: "REGULAR",
        },
        signUp: {
          acceptanceElements: [
            {
              enforcement: "NONE",
              textKey: "en",
            },
          ],
        },
      },
    },
  });

  return {
    userPool,
    userPoolId: userPool.userPoolId,
    userPoolClientId: userPoolClient.userPoolClientId,
    authority: `https://cognito-idp.${
      Stack.of(props.scope).region
    }.amazonaws.com/${userPool.userPoolId}`,
    domain: `https://${domainPrefix}.auth.${Aws.REGION}.amazoncognito.com`
  }
}

const getCognitoDomainPrefix = (project: string, stage: string): string => `${project}-${stage}-login-user-pool-client`;
