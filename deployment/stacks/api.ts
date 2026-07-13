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
import * as alarms from "../lib/alarms";
import * as securityGroup from "../lib/security-group";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import importNumberValue from "../util/importNumberValue";
import path from "node:path";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

interface APIStackProps {
  vpc: IVpc;
}

export class ApiStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps & DeploymentConfigProperties & APIStackProps
  ) {
    super(scope, id, {
      ...props,
      terminationProtection: false,
    });

    const commonProps = {
      ...props,
      scope: this,
      iamPermissionsBoundary:
        props.iamPermissionsBoundaryArn == null
          ? undefined
          : aws_iam.ManagedPolicy.fromManagedPolicyArn(
              this,
              "iamPermissionsBoundary",
              props.iamPermissionsBoundaryArn
            ),
    };
    const alarmResources = new alarms.CloudWatchAlarmRegistry();

    const graphqlLambdaSecurityGroup = securityGroup.create({
      ...commonProps,
      name: "graphqlSecurityGroup",
      vpc: props.vpc,
    });

    const rdsSecurityGroupId = Fn.importValue(
      `${commonProps.project}-${commonProps.hostEnvironment}-rds-security-group-id`
    );

    const rdsPort = importNumberValue(
      `${commonProps.project}-${commonProps.hostEnvironment}-rds-port`
    );

    const rdsSg = aws_ec2.SecurityGroup.fromSecurityGroupId(
      commonProps.scope,
      "rdsSg",
      rdsSecurityGroupId
    );

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

    const s3PrefixList = aws_ec2.PrefixList.fromLookup(this, "s3PrefixList", {
      prefixListName: `com.amazonaws.${this.region}.s3`,
    });

    const sqsVpceSgId = Fn.importValue(`${commonProps.stage}SqsVpceSg`);

    graphqlLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.prefixList(s3PrefixList.prefixListId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to S3"
    );

    graphqlLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(sqsVpceSgId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to SQS"
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
        timeout: Duration.seconds(10),
      },
      "authorizer"
    );
    alarmResources.registerLambda("authorizer", authorizerLambda.lambda.lambda);

    const tokenAuthorizer = new aws_apigateway.TokenAuthorizer(
      commonProps.scope,
      "jwtTokenAuthorizer",
      {
        handler: authorizerLambda.lambda.lambda,
        authorizerName: "cognitoTokenAuth",
      }
    );

    const uploadBucketName = Fn.importValue(`${props.stage}UploadBucketName`);
    const uploadBucket = aws_s3.Bucket.fromBucketName(this, "uploadBucket", uploadBucketName);

    const cleanBucketName = Fn.importValue(`${props.stage}CleanBucketName`);
    const cleanBucket = aws_s3.Bucket.fromBucketName(this, "cleanBucket", cleanBucketName);

    const deletedBucketName = Fn.importValue(`${props.stage}DeletedBucketName`);
    const deletedBucket = aws_s3.Bucket.fromBucketName(this, "deletedBucket", deletedBucketName);

    const uipathQueueUrl = Fn.importValue(`${props.stage}UiPathQueueUrl`);
    const uipathQueueArn = Fn.importValue(`${props.stage}UiPathQueueArn`);
    const uipathQueue = Queue.fromQueueArn(this, "uipathQueue", uipathQueueArn);

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
          DELETED_BUCKET: deletedBucket.bucketName,
          // None of the other queue use ENV. maybe another way.
          UIPATH_QUEUE_URL: uipathQueueUrl,
        },
      },
      "graphql"
    );
    alarmResources.registerLambda("graphql", graphqlLambda.lambda.lambda);

    dbSecret.grantRead(graphqlLambda.lambda.role);
    uploadBucket.grantPut(graphqlLambda.lambda.role);
    cleanBucket.grantDelete(graphqlLambda.lambda.role);
    cleanBucket.grantPut(graphqlLambda.lambda.role);
    cleanBucket.grantRead(graphqlLambda.lambda.role);
    deletedBucket.grantPut(graphqlLambda.lambda.role);
    uipathQueue.grantSendMessages(graphqlLambda.lambda.role);

    const fileUploadKms = aws_kms.Key.fromLookup(this, "fileUploadKms", {
      aliasName: `alias/demos-${commonProps.stage}-file-upload-sqs`,
    });

    fileUploadKms.grantEncrypt(graphqlLambda.lambda.role);

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
    alarmResources.registerQueue("emailerDeadLetter", deadLetterQueue);

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
    alarmResources.registerQueue("emailer", emailQueue);
    graphqlLambda.lambda.lambda.addEnvironment("EMAILER_QUEUE_URL", emailQueue.queueUrl);
    emailQueue.grantSendMessages(graphqlLambda.lambda.role);

    const emailerLambdaSecurityGroup = securityGroup.create({
      ...commonProps,
      name: "emailerSecurityGroup",
      vpc: props.vpc,
    });

    const sharedServicesSG = aws_ec2.SecurityGroup.fromLookupByName(
      commonProps.scope,
      "cmsSharedServcices",
      "cmscloud-shared-services",
      commonProps.vpc
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
      externalModules: ["@aws-sdk"],
      nodeModules: [
        "@react-email/components",
        "@react-email/render",
        "nodemailer",
        "pino",
        "react",
        "react-dom",
      ],
      securityGroup: [emailerLambdaSecurityGroup.securityGroup, sharedServicesSG],
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
    alarmResources.registerLambda("emailer", emailerLambda.lambda);

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

    this.setupCloudWatchAlarms(props, alarmResources);

    // Outputs

    new CfnOutput(this, "ApiUrl", {
      value: apigateway_outputs.apiGatewayRestApiUrl,
      exportName: `${commonProps.stage}ApiGWUrl`,
    });
  }

  private setupCloudWatchAlarms(
    props: DeploymentConfigProperties,
    resources: alarms.CloudWatchAlarmRegistry
  ) {
    if (props.isEphemeral && !props.enableAlarms) {
      return;
    }

    const lambdaAlarmPeriod = Duration.minutes(5);
    const sqsOldestMessageAgeAlarmPeriod = Duration.minutes(5);
    const sqsVisibleMessagesAlarmPeriod = Duration.minutes(5);

    alarms.createLambdaErrorsAlarm({
      ...props,
      scope: this,
      id: "AuthorizerLambdaErrorsAlarm",
      name: "authorizer-lambda-errors",
      description: "Authorizer Lambda has one or more errors in a 5-minute period.",
      lambdaFunction: resources.lambda("authorizer"),
      period: lambdaAlarmPeriod,
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    alarms.createLambdaDurationAlarm({
      ...props,
      scope: this,
      id: "AuthorizerLambdaDurationAlarm",
      name: "authorizer-lambda-duration-near-timeout",
      description: "Authorizer Lambda duration is above 80% of its configured timeout.",
      lambdaFunction: resources.lambda("authorizer"),
      period: lambdaAlarmPeriod,
      threshold: Duration.seconds(8),
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    alarms.createLambdaThrottlesAlarm({
      ...props,
      scope: this,
      id: "AuthorizerLambdaThrottlesAlarm",
      name: "authorizer-lambda-throttles",
      description: "Authorizer Lambda has one or more throttled invocations in a 5-minute period.",
      lambdaFunction: resources.lambda("authorizer"),
      period: lambdaAlarmPeriod,
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    alarms.createLambdaErrorsAlarm({
      ...props,
      scope: this,
      id: "GraphqlLambdaErrorsAlarm",
      name: "graphql-lambda-errors",
      description: "GraphQL Lambda has one or more errors in a 5-minute period.",
      lambdaFunction: resources.lambda("graphql"),
      period: lambdaAlarmPeriod,
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    alarms.createLambdaThrottlesAlarm({
      ...props,
      scope: this,
      id: "GraphqlLambdaThrottlesAlarm",
      name: "graphql-lambda-throttles",
      description: "GraphQL Lambda has one or more throttled invocations in a 5-minute period.",
      lambdaFunction: resources.lambda("graphql"),
      period: lambdaAlarmPeriod,
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    alarms.createSqsVisibleMessagesAlarm({
      ...props,
      scope: this,
      id: "EmailerDlqVisibleMessagesAlarm",
      name: "emailer-dlq-visible-messages",
      description: "Emailer DLQ contains one or more messages.",
      queue: resources.queue("emailerDeadLetter"),
      period: sqsVisibleMessagesAlarmPeriod,
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    alarms.createSqsOldestMessageAgeAlarm({
      ...props,
      scope: this,
      id: "EmailerQueueOldestMessageAgeAlarm",
      name: "emailer-queue-oldest-message-age-high",
      description: "Emailer queue has messages older than 15 minutes.",
      queue: resources.queue("emailer"),
      period: sqsOldestMessageAgeAlarmPeriod,
      threshold: Duration.minutes(15),
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    alarms.createLambdaErrorsAlarm({
      ...props,
      scope: this,
      id: "EmailerLambdaErrorsAlarm",
      name: "emailer-lambda-errors",
      description: "Emailer Lambda has one or more errors in a 5-minute period.",
      lambdaFunction: resources.lambda("emailer"),
      period: lambdaAlarmPeriod,
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    alarms.createLambdaDurationAlarm({
      ...props,
      scope: this,
      id: "EmailerLambdaDurationAlarm",
      name: "emailer-lambda-duration-near-timeout",
      description: "Emailer Lambda duration is above 80% of its configured timeout.",
      lambdaFunction: resources.lambda("emailer"),
      period: lambdaAlarmPeriod,
      threshold: Duration.seconds(48),
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    alarms.createLambdaThrottlesAlarm({
      ...props,
      scope: this,
      id: "EmailerLambdaThrottlesAlarm",
      name: "emailer-lambda-throttles",
      description: "Emailer Lambda has one or more throttled invocations in a 5-minute period.",
      lambdaFunction: resources.lambda("emailer"),
      period: lambdaAlarmPeriod,
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });
  }
}
