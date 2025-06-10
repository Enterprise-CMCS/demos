import { Stack, StackProps, aws_iam, aws_apigateway } from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";

export class BootstrapStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps & DeploymentConfigProperties
  ) {
    super(scope, id, {
      ...props,
      terminationProtection: false,
    });

    const commonProps = {
      ...props,
      scope: this,
      iamPermissionsBoundary:
        props.iamPermissionsBoundaryArn != null
          ? aws_iam.ManagedPolicy.fromManagedPolicyArn(
              this,
              "iamPermissionsBoundary",
              props.iamPermissionsBoundaryArn
            )
          : undefined,
    };

    const apiGwCloudWatchRole = new aws_iam.Role(
      commonProps.scope,
      "ApiGatewayCloudWatchRole",
      {
        assumedBy: new aws_iam.ServicePrincipal("apigateway.amazonaws.com"),
        managedPolicies: [
          aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AmazonAPIGatewayPushToCloudWatchLogs" // pragma: allowlist secret
          ),
        ],
        permissionsBoundary: commonProps.iamPermissionsBoundary,
        path: commonProps.iamPath,
      }
    );

    new aws_apigateway.CfnAccount(commonProps.scope, "cloudwatchRole", {
      cloudWatchRoleArn: apiGwCloudWatchRole.roleArn,
    });

    const githubRepo = "Enterprise-CMCS/demos";

    // GITHUB
    const oidcProvider = new aws_iam.OpenIdConnectProvider(
      commonProps.scope,
      "DemosGithubOIDCProvider",
      {
        url: "https://token.actions.githubusercontent.com",
        clientIds: ["sts.amazonaws.com"],
        thumbprints: [
          "6938fd4d98bab03faadb97b34396831e3780aea1", // pragma: allowlist secret
          "1c58a3a8518e8759bf075b76b750d4f2df264fcd", // pragma: allowlist secret
        ], // https://github.blog/changelog/2023-06-27-github-actions-update-on-oidc-integration-with-aws/
      }
    );

    const githubActionsRole = new aws_iam.Role(
      commonProps.scope,
      "GithubActionsOIDCRole",
      {
        roleName: `${commonProps.project}-github-actions-oidc-role`,
        permissionsBoundary: commonProps.iamPermissionsBoundary,
        path: commonProps.iamPath,
        assumedBy: new aws_iam.WebIdentityPrincipal(
          oidcProvider.openIdConnectProviderArn,
          {
            StringEquals: {
              "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
            },
            StringLike: {
              "token.actions.githubusercontent.com:sub": `repo:${githubRepo}:*`,
            },
          }
        ),
        managedPolicies: [
          aws_iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess"),
        ],
        description: "Role assumed by github actions",
      }
    );

    const policy = new aws_iam.Policy(commonProps.scope, "actionsPolicy", {
      statements: [
        new aws_iam.PolicyStatement({
          actions: ["secretsmanager:GetSecretValue"],
          resources: [
            `arn:aws:secretsmanager:us-east-1:${process.env.CDK_DEFAULT_ACCOUNT}:secret:demos-*/config*`,
          ],
        }),
        new aws_iam.PolicyStatement({
          actions: ["sts:AssumeRole"],
          resources: ["*"],
          conditions: {
            "ForAnyValue:StringEquals": {
              "iam:ResourceTag/aws-cdk:bootstrap-role": [
                "deploy",
                "lookup",
                "file-publishing",
                "image-publishing",
              ],
            },
          },
        }),
      ],
    });

    githubActionsRole.attachInlinePolicy(policy);
  }
}
