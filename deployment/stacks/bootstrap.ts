import { Stack, StackProps, aws_iam, aws_apigateway, aws_ec2, aws_lambda, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";
import { PrivateHostedZone } from "aws-cdk-lib/aws-route53";

export class BootstrapStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & DeploymentConfigProperties) {
    super(scope, id, {
      ...props,
      terminationProtection: false,
    });

    const commonProps = {
      ...props,
      scope: this,
      iamPermissionsBoundary:
        props.iamPermissionsBoundaryArn != null
          ? aws_iam.ManagedPolicy.fromManagedPolicyArn(this, "iamPermissionsBoundary", props.iamPermissionsBoundaryArn)
          : undefined,
    };

    const apiGwCloudWatchRole = new aws_iam.Role(commonProps.scope, "ApiGatewayCloudWatchRole", {
      assumedBy: new aws_iam.ServicePrincipal("apigateway.amazonaws.com"),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonAPIGatewayPushToCloudWatchLogs" // pragma: allowlist secret
        ),
      ],
      permissionsBoundary: commonProps.iamPermissionsBoundary,
      path: commonProps.iamPath,
    });

    new aws_apigateway.CfnAccount(commonProps.scope, "cloudwatchRole", {
      cloudWatchRoleArn: apiGwCloudWatchRole.roleArn,
    });

    const githubRepo = "Enterprise-CMCS/demos";

    // GITHUB
    const oidcProvider = new aws_iam.OpenIdConnectProvider(commonProps.scope, "DemosGithubOIDCProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
      thumbprints: [
        "6938fd4d98bab03faadb97b34396831e3780aea1", // pragma: allowlist secret
        "1c58a3a8518e8759bf075b76b750d4f2df264fcd", // pragma: allowlist secret
      ], // https://github.blog/changelog/2023-06-27-github-actions-update-on-oidc-integration-with-aws/
    });

    const githubActionsRole = new aws_iam.Role(commonProps.scope, "GithubActionsOIDCRole", {
      roleName: `${commonProps.project}-github-actions-oidc-role`,
      permissionsBoundary: commonProps.iamPermissionsBoundary,
      path: commonProps.iamPath,
      assumedBy: new aws_iam.WebIdentityPrincipal(oidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        },
        StringLike: {
          "token.actions.githubusercontent.com:sub": `repo:${githubRepo}:*`,
        },
      }),
      managedPolicies: [aws_iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess")],
      description: "Role assumed by github actions",
    });

    const jenkinsRole = new aws_iam.Role(commonProps.scope, "jenkinsRole", {
      roleName: `${commonProps.project}-jenkins-role`,
      permissionsBoundary: commonProps.iamPermissionsBoundary,
      path: commonProps.iamPath,
      assumedBy: new aws_iam.ArnPrincipal("arn:aws:iam::478919403635:role/cbc-demos"),
      managedPolicies: [aws_iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess")],
      description: "Role assumed by github actions",
    });

    const cbcJenkinsRole = aws_iam.Role.fromRoleName(commonProps.scope, "cbcJenkinsRole", "jenkins-role");

    const policy = new aws_iam.Policy(commonProps.scope, "actionsPolicy", {
      statements: [
        new aws_iam.PolicyStatement({
          actions: ["secretsmanager:GetSecretValue"],
          resources: [
            // Trailing * in these arns are required because a random string is added at the end when created
            `arn:aws:secretsmanager:us-east-1:${process.env.CDK_DEFAULT_ACCOUNT}:secret:demos-*/config*`,
            `arn:aws:secretsmanager:us-east-1:${process.env.CDK_DEFAULT_ACCOUNT}:secret:demos-*-rds-admin*`,
          ],
        }),
        new aws_iam.PolicyStatement({
          actions: ["ec2:DescribeManagedPrefixLists", "ec2:GetManagedPrefixListEntries"],
          resources: ["*"],
        }),
        new aws_iam.PolicyStatement({
          actions: ["sts:AssumeRole"],
          resources: ["*"],
          conditions: {
            "ForAnyValue:StringEquals": {
              "iam:ResourceTag/aws-cdk:bootstrap-role": ["deploy", "lookup", "file-publishing", "image-publishing"],
            },
          },
        }),
        new aws_iam.PolicyStatement({
          actions: [
            "cognito-idp:ListUserPools",
            "cognito-idp:DescribeUserPoolClient",
            "cognito-idp:UpdateUserPoolClient",
          ],
          resources: ["*"],
        }),
        new aws_iam.PolicyStatement({
          actions: ["logs:DescribeLogGroups", "logs:PutRetentionPolicy"],
          resources: ["*"],
        }),
      ],
    });

    githubActionsRole.attachInlinePolicy(policy);
    jenkinsRole.attachInlinePolicy(policy);
    cbcJenkinsRole.attachInlinePolicy(policy);

    // Private Hosted Zones

    createPHZ(commonProps.scope, "dev");
    createPHZ(commonProps.scope, "test");
    createPHZ(commonProps.scope, "impl");

    // Wait function
    new aws_lambda.SingletonFunction(commonProps.scope, "SharedWaitLambda", {
      functionName: `cdk-wait-${commonProps.scope.account}`,
      uuid: "c0d7adea-b43d-4022-a438-551724eb7e0f",
      runtime: aws_lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      code: aws_lambda.Code.fromInline(`
        var response = require('cfn-response');
        exports.handler = async (event, context) => {
          console.log("event", event)
          const waitTime = event.ResourceProperties.WaitTimeSeconds || 30;
          console.log('Waiting for ' + waitTime + ' seconds...');
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          await response.send(event, context, response.SUCCESS, {wait: waitTime * 1000});
        }
      `),
    });
  }
}

function createPHZ(scope: Construct, env: string) {
  const dnsSuffix = "demos.internal.cms.gov";

  const devVpc = aws_ec2.Vpc.fromLookup(scope, `${env}Vpc`, {
    tags: {
      Name: `demos-east-${env}`,
    },
  });
  new PrivateHostedZone(scope, `${env}PrivateZone`, {
    zoneName: `${env}.${dnsSuffix}`,
    vpc: devVpc,
  });
}
