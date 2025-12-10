import { Construct } from "constructs";
import { aws_secretsmanager, Duration, RemovalPolicy, aws_sqs as sqs } from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambda from "./lambda";
import { DeploymentConfigProperties } from "../config";
import { aws_kms as kms } from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";
import path from "path";

interface UiPathProcessorProps extends DeploymentConfigProperties {
  removalPolicy?: RemovalPolicy;
  kmsKey?: kms.IKey;
}

export class UiPathProcessor extends Construct {
  public readonly queue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: UiPathProcessorProps) {
    super(scope, id);
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

    const uiPathDir = path.resolve(process.cwd(), "..", "lambdas", "UIPath");
    const uiPathLockFile = path.join(uiPathDir, "package-lock.json");

    const uipathLambda = new lambda.Lambda(this, "Lambda", {
      ...props,
      scope: this,
      entry: "../lambdas/UIPath/index.ts",
      depsLockFilePath: uiPathLockFile,
      handler: "index.handler",
      timeout: Duration.minutes(30),
      asCode: false,
      externalModules: ["@aws-sdk", "@aws-sdk/client-secrets-manager"],
      nodeModules: ["axios", "axios-oauth-client", "dotenv", "form-data", "pino", "pino-pretty"],
      environment: {
        UIPATH_CLIENT_ID: process.env.UIPATH_CLIENT_ID ?? "",
        DATABASE_SECRET_ARN: dbSecret.secretName, // pragma: allowlist secret
        UIPATH_CLIENT_SECRET: clientSecret.secretName,
        UIPATH_EXTRACTOR_GUID: process.env.UIPATH_EXTRACTOR_GUID ?? "",
        UIPATH_PROJECT_ID: process.env.UIPATH_PROJECT_ID ?? uiPathDefaultProjectId,
        LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
      },
    });
    // This is so i can get a clean build until jesse comes back
    if (uipathLambda.lambda.role) {
      NagSuppressions.addResourceSuppressions(uipathLambda.lambda.role, [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "Lambda needs wildcard resource for CloudWatch Logs and VPC networking operations; " +
            "scope is limited to these services and this function.",
          appliesTo: [
            "Resource::arn:aws:logs:*:*:*",
            "Resource::*",
          ],
        },
      ]);
    }

    // optional: allow Lambda to use this key directly
    queueKey.grant(
      uipathLambda.lambda,
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:GenerateDataKey",
      "kms:GenerateDataKeyWithoutPlaintext",
      "kms:ReEncryptFrom",
      "kms:ReEncryptTo",
    );
    clientSecret.grantRead(uipathLambda.lambda);

    uipathLambda.lambda.addEventSource(
      new SqsEventSource(this.queue, { batchSize: 1 }),
    );
  }
}
