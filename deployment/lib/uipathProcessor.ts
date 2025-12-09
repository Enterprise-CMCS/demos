import { Construct } from "constructs";
import { aws_secretsmanager, Duration, RemovalPolicy, aws_sqs as sqs } from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambda from "./lambda";
import { DeploymentConfigProperties } from "../config";
import { aws_kms as kms } from "aws-cdk-lib";

interface UiPathProcessorProps extends DeploymentConfigProperties {
  removalPolicy?: RemovalPolicy;
  kmsKey?: kms.IKey;
}

export class UiPathProcessor extends Construct {
  public readonly queue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: UiPathProcessorProps) {
    super(scope, id);


    const lambdaPath = "../lambdas/UIPath/";
    const removalPolicy = props.removalPolicy ?? RemovalPolicy.DESTROY;

    const queueKey =
      props.kmsKey ??
      new kms.Key(this, "UiPathQueueKey", {
        enableKeyRotation: true,
        removalPolicy,
        alias: "alias/uipath-queue-key",
        description: "KMS key for UiPath SQS queues",
      });

    this.deadLetterQueue = new sqs.Queue(this, "UiPathDLQ", {
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: queueKey,
      enforceSSL: true,
      removalPolicy,
    });

    this.queue = new sqs.Queue(this, "UiPathQueue", {
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: queueKey,
      enforceSSL: true,
      removalPolicy,
      deadLetterQueue: { queue: this.deadLetterQueue, maxReceiveCount: 5 },
    });

    // Only dev exists right now, so let's just hard that for now.
    const clientSecret = aws_secretsmanager.Secret.fromSecretNameV2(
      this,
      "UiPathClientSecret",
      `demos-${props.hostEnvironment}/uipath`
    );
    const dbSecret = aws_secretsmanager.Secret.fromSecretNameV2(
      this,
      "rdsDatabaseSecret",
      `demos-${props.hostEnvironment}-rds-demos_upload`
    );

    const uiPathDefaultProjectId =
      process.env.UIPATH_DEFAULT_PROJECT_ID ?? "00000000-0000-0000-0000-000000000000";
    const uipathLambda = new lambda.Lambda(this, "Lambda", {
      ...props,
      scope: this,
      entry: lambdaPath + "index.ts",
      handler: "index.handler",
      timeout: Duration.minutes(15), // We do not have enough data to wittle this down yet,
      asCode: false,
      externalModules: ["@aws-sdk"],
      environment: {
        UIPATH_CLIENT_ID: process.env.UIPATH_CLIENT_ID ?? "",
        DATABASE_SECRET_ARN: dbSecret.secretName, // pragma: allowlist secret
        UIPATH_CLIENT_SECRET: clientSecret.secretName,
        UIPATH_EXTRACTOR_GUID: process.env.UIPATH_EXTRACTOR_GUID ?? "",
        UIPATH_PROJECT_ID: process.env.UIPATH_PROJECT_ID ?? uiPathDefaultProjectId,
        LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
      },
    });

    // optional: allow Lambda to use this key directly
    queueKey.grantEncryptDecrypt(uipathLambda.lambda);
    clientSecret.grantRead(uipathLambda.lambda);

    uipathLambda.lambda.addEventSource(
      new SqsEventSource(this.queue, { batchSize: 1 }),
    );
  }
}
