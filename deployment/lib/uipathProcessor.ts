import { Construct } from "constructs";
import {
  Duration,
  RemovalPolicy,
  aws_sqs as sqs,
  aws_secretsmanager,
  aws_kms as kms,
  aws_s3 as s3,
  aws_ec2 as ec2,
} from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as demosLambda from "./lambda";
import path from "node:path";
import { DeploymentConfigProperties } from "../config";

interface UiPathProcessorProps extends DeploymentConfigProperties {
  removalPolicy?: RemovalPolicy;
  kmsKey: kms.IKey;
  documentsBucket: s3.IBucket;
  deadLetterQueue?: sqs.IQueue;
  vpc?: ec2.IVpc;
  securityGroup?: ec2.ISecurityGroup | ec2.ISecurityGroup[];
}

export class UiPathProcessor extends Construct {
  public readonly queue: sqs.Queue;
  public readonly deadLetterQueue: sqs.IQueue;

  constructor(scope: Construct, id: string, props: UiPathProcessorProps) {
    super(scope, id);

    const removalPolicy = props.removalPolicy ?? RemovalPolicy.DESTROY;

    this.deadLetterQueue =
      props.deadLetterQueue ??
      new sqs.Queue(this, "UiPathDLQ", {
        removalPolicy,
        enforceSSL: true,
        encryption: sqs.QueueEncryption.KMS,
        encryptionMasterKey: props.kmsKey,
      });

    this.queue = new sqs.Queue(this, "UiPathQueue", {
      removalPolicy,
      enforceSSL: true,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: props.kmsKey,
      visibilityTimeout: Duration.minutes(20),
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: 5,
      },
    });

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

    // Stable pathing relative to this file (not process.cwd)
    const uiPathDir = path.resolve(process.cwd(), "..", "lambdas", "UIPath");
    const uiPathLockFile = path.join(uiPathDir, "package-lock.json");

    const uipathLambda = new demosLambda.Lambda(this, "uipath", {
      ...props,
      scope: this,
      entry: path.join(uiPathDir, "index.ts"),
      depsLockFilePath: uiPathLockFile,
      handler: "index.handler",
      timeout: Duration.minutes(15),
      asCode: false,
      externalModules: ["@aws-sdk", "@aws-sdk/client-secrets-manager", "@aws-sdk/client-s3"],
      nodeModules: ["axios", "axios-oauth-client", "dotenv", "form-data", "pino", "pino-pretty", "pg"],
      vpc: props.vpc,
      securityGroup: props.securityGroup,
      environment: {
        UIPATH_CLIENT_ID: process.env.UIPATH_CLIENT_ID ?? "",
        DATABASE_SECRET_ARN: dbSecret.secretName, // pragma: allowlist secret
        UIPATH_SECRET_ID: clientSecret.secretName,
        LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
        UIPATH_DOCUMENTS_BUCKET: props.documentsBucket.bucketName,
        NODE_EXTRA_CA_CERTS: "/var/runtime/ca-cert.pem",
      },
    });

    // ✅ Only once
    uipathLambda.lambda.addEventSource(new SqsEventSource(this.queue, { batchSize: 1 }));

    // Grants
    this.queue.grantConsumeMessages(uipathLambda.lambda);
    clientSecret.grantRead(uipathLambda.lambda);
    dbSecret.grantRead(uipathLambda.lambda);
    // ✅ allow access to the actual bucket CDK created
    props.documentsBucket.grantReadWrite(uipathLambda.lambda);

    // ✅ KMS permissions (use the helper)
    props.kmsKey.grantEncryptDecrypt(uipathLambda.lambda);
  }
}
