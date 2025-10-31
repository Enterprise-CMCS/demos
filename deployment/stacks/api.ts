import { DatadogLambda } from "datadog-cdk-constructs-v2";
import * as ssm from "aws-cdk-lib/aws-ssm";
import {
  CfnOutput,
  Stack,
  StackProps,
  aws_iam,
  aws_ec2,
  Fn,
  aws_secretsmanager,
  aws_apigateway,
  aws_s3,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";

import * as apigateway from "../lib/apigateway";
import * as lambda from "../lib/lambda";
import * as securityGroup from "../lib/security-group";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import importNumberValue from "../util/importNumberValue";
import path from "path";

interface APIStackProps {
  vpc: IVpc;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & DeploymentConfigProperties & APIStackProps) {
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

    const graphqlLambdaSecurityGroup = securityGroup.create({
      ...commonProps,
      name: "graphqlSecurityGroup",
      vpc: props.vpc,
    });

    const rdsSecurityGroupId = Fn.importValue(
      `${commonProps.project}-${commonProps.hostEnvironment}-rds-security-group-id`
    );

    const rdsPort = importNumberValue(`${commonProps.project}-${commonProps.hostEnvironment}-rds-port`);

    const rdsSg = aws_ec2.SecurityGroup.fromSecurityGroupId(commonProps.scope, "rdsSg", rdsSecurityGroupId);

    rdsSg.addIngressRule(
      aws_ec2.Peer.securityGroupId(graphqlLambdaSecurityGroup.securityGroup.securityGroupId),
      aws_ec2.Port.tcp(rdsPort),
      "Allow ingress from GraphQL Security Group",
      true
    );

    graphqlLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(rdsSecurityGroupId),
      aws_ec2.Port.tcp(rdsPort),
      "Allow egress to RDS",
      true
    );

    const secretsManagerVpceSgId = Fn.importValue(`${commonProps.stage}SecretsManagerVpceSg`);

    graphqlLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(secretsManagerVpceSgId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to secrets manager VPCE"
    );

    const cognitoAuthority = Fn.importValue(`${commonProps.hostEnvironment}CognitoAuthority`);
    const apigateway_outputs = apigateway.create({
      ...commonProps,
    });

    const dbSecret = aws_secretsmanager.Secret.fromSecretNameV2(
      commonProps.scope,
      "rdsDatabaseSecret",
      `demos-${commonProps.hostEnvironment}-rds-demos_server`
    );

    const authPath = path.join("..", "lambdas", "authorizer");
    const rel = path.resolve(authPath);

    const authorizerLambda = lambda.create(
      {
        ...commonProps,
        entry: path.join(rel, "index.ts"),
        handler: "index.handler",
        asCode: false,
        environment: {
          JWKS_URI: `${cognitoAuthority}/.well-known/jwks.json`,
        },
        externalModules: ["aws-sdk"],
        nodeModules: ["jsonwebtoken", "jwks-rsa"],
        depsLockFilePath: path.join(rel, "package-lock.json"),
      },
      "authorizer"
    );

    const tokenAuthorizer = new aws_apigateway.TokenAuthorizer(commonProps.scope, "jwtTokenAuthorizer", {
      handler: authorizerLambda.lambda.lambda,
      authorizerName: "cognitoTokenAuth",
    });

    const uploadBucketName = Fn.importValue(`${props.stage}UploadBucketName`);
    const uploadBucket = aws_s3.Bucket.fromBucketName(this, "uploadBucket", uploadBucketName);

    const cleanBucketName = Fn.importValue(`${props.stage}CleanBucketName`);
    const cleanBucket = aws_s3.Bucket.fromBucketName(this, "cleanBucket", cleanBucketName);

    const graphqlLambda = lambda.create(
      {
        ...commonProps,
        entry: "../server/build",
        handler: "server.graphqlHandler",
        apiParentResource: apigateway_outputs.apiParentResource,
        path: "graphql",
        method: "POST",
        vpc: props.vpc,
        securityGroup: props.isLocalstack ? undefined : graphqlLambdaSecurityGroup?.securityGroup,
        authorizer: props.isLocalstack ? undefined : tokenAuthorizer,
        authorizationType: props.isLocalstack ? undefined : aws_apigateway.AuthorizationType.CUSTOM,
        asCode: true,
        environment: {
          BYPASS_AUTH: "false",
          DATABASE_URL: "postgres://placeholder",
          DATABASE_SECRET_ARN: dbSecret.secretName, // This needs to be the name rather than the arn, otherwise the request from the lambda fails since no secret suffix is available
          UPLOAD_BUCKET: uploadBucket.bucketName,
          CLEAN_BUCKET: cleanBucket.bucketName,
        },
      },
      "graphql"
    );
    dbSecret.grantRead(graphqlLambda.lambda.role);
    uploadBucket.grantPut(graphqlLambda.lambda.role);

    // Outputs

    new CfnOutput(this, "ApiUrl", {
      value: apigateway_outputs.apiGatewayRestApiUrl,
      exportName: `${commonProps.stage}ApiGWUrl`,
    });
  }
}

// Datadog Integration
export function integrateDatadog(scope: any, props: any, service: string = "demos-api") {
  const stage = (props as any).stage ?? "dev";
  const ddParamName =
    stage === "prod"
      ? "/observability/datadog/DATADOG_PROD"
      : "/observability/datadog/DATADOG_NONPROD";

  const ddApiKeyParam = ssm.StringParameter.fromStringParameterName(scope, "DatadogApiKeyRef", ddParamName);

  const datadog = new DatadogLambda(scope, "Datadog", {
    site: "ddog-gov.com",
    apiKey: ddApiKeyParam.stringValue,
    enableDatadogTracing: false,
    enableDatadogLogs: false,
    flushMetricsToLogs: false,
    env: stage,
    service,
  });

  return datadog;
}
