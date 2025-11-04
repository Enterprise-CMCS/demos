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
  Duration,
  aws_ssm,
  aws_kms,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";

import * as apigateway from "../lib/apigateway";
import * as lambda from "../lib/lambda";
import * as securityGroup from "../lib/security-group";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import importNumberValue from "../util/importNumberValue";
import path from "path";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

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
        nodeModules: ["jsonwebtoken", "jwks-rsa", "pino"],
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

    const emailerTimeout = Duration.minutes(1);

    const kmsKey = new aws_kms.Key(this, "emailerQueueKey", {
      enableKeyRotation: true,
      alias: `alias/demos-${props.stage}-emailer-sqs`,
    });

    const deadLetterQueue = new Queue(this, "EmailerDLQ", {
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
      encryption: QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
    });

    const emailQueue = new Queue(this, "EmailerQueue", {
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
      deadLetterQueue: {
        maxReceiveCount: 5,
        queue: deadLetterQueue,
      },
      encryption: QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
      visibilityTimeout: emailerTimeout,
    });

    const emailerLambdaSecurityGroup = securityGroup.create({
      ...commonProps,
      name: "emailerSecurityGroup",
      vpc: props.vpc,
    });

    emailerLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.ipv4("10.223.128.0/20"),
      aws_ec2.Port.tcp(587),
      "Allow traffic to cms smtp"
    );

    const ssmSg = aws_ec2.SecurityGroup.fromLookupByName(
      this,
      "ssmSecurityGroup",
      `${props.project}-${props.hostEnvironment}-${props.project}-${props.hostEnvironment}-ssm-vpce`,
      props.vpc
    );

    emailerLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(ssmSg.securityGroupId),
      aws_ec2.Port.HTTPS
    );

    const allowListParamName = "/demos/nonprod/email/allowlist";

    // Emailer
    const emailSuffix = commonProps.stage == "prod" ? "" : `-${commonProps.stage}`;
    const emailerPath = path.join("..", "lambdas", "emailer");
    const emailerLambda = new lambda.Lambda(commonProps.scope, "emailer", {
      ...commonProps,
      scope: commonProps.scope,
      entry: "../lambdas/emailer/index.ts",
      handler: "index.handler",
      vpc: props.vpc,
      nodeModules: ["nodemailer"],
      securityGroup: emailerLambdaSecurityGroup.securityGroup,
      asCode: false,
      depsLockFilePath: path.join(emailerPath, "package-lock.json"),
      timeout: emailerTimeout,
      environment: {
        EMAIL_HOST: "smtp.cloud.internal.cms.gov",
        EMAIL_PORT: "587",
        EMAIL_FROM: `"DEMOS${emailSuffix}" <DEMOS${emailSuffix}-no-reply@cms.hhs.gov>`,
        NODE_EXTRA_CA_CERTS: "/var/task/cert.pem",
        ALLOW_LIST_PARAM_NAME: commonProps.stage == "prod" ? "" : allowListParamName,
        DISABLE_EMAIL_ALLOWLIST: commonProps.stage == "prod" ? "true" : "false",
      },
      commandHooks: {
        afterBundling(inputDir: string, outputDir: string): string[] {
          return [`cp ${inputDir}/../../deployment/cert.pem ${outputDir}/cert.pem`];
        },
        beforeBundling() {
          return [];
        },
        beforeInstall() {
          return [];
        },
      },
    });

    if (commonProps.stage != "prod") {
      const allowListParam = aws_ssm.StringParameter.fromStringParameterName(
        commonProps.scope,
        "allowListParam",
        allowListParamName
      );

      allowListParam.grantRead(emailerLambda.role);
    }

    emailerLambda.lambda.addEventSource(
      new SqsEventSource(emailQueue, {
        // Setting a batch size of 1 means each SQS message will be
        // processed individually. This can be increased, but the emailer
        // function will need to be reworked to support handling of batch
        // events. By default, a failed processing would fail the entire
        // batch, which means that on a retry, emails that sent out fine the
        // first time would send again
        batchSize: 1,
      })
    );

    // Outputs

    new CfnOutput(this, "ApiUrl", {
      value: apigateway_outputs.apiGatewayRestApiUrl,
      exportName: `${commonProps.stage}ApiGWUrl`,
    });
  }
}
