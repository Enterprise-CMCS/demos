import { Construct } from "constructs";
import {
  Duration,
  RemovalPolicy,
  aws_sqs as sqs,
  aws_secretsmanager,
  aws_kms as kms,
  aws_ec2 as ec2,
} from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as demosLambda from "./lambda";
import path from "node:path";
import { DeploymentConfigProperties } from "../config";
import { OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

interface BudgetNeutralityProcessorProps extends DeploymentConfigProperties {
  removalPolicy?: RemovalPolicy;
  kmsKey: kms.IKey;
  deadLetterQueue?: sqs.IQueue;
  vpc?: ec2.IVpc;
  securityGroup?: ec2.ISecurityGroup | ec2.ISecurityGroup[];
}

export class BudgetNeutralityProcessor extends Construct {
  public readonly queue: sqs.Queue;
  public readonly deadLetterQueue: sqs.IQueue;

  constructor(scope: Construct, id: string, props: BudgetNeutralityProcessorProps) {
    super(scope, id);

    const removalPolicy = props.removalPolicy ?? RemovalPolicy.DESTROY;

    this.deadLetterQueue =
      props.deadLetterQueue ??
      new sqs.Queue(this, "BudgetNeutralityValidationDLQ", {
        removalPolicy,
        enforceSSL: true,
        encryption: sqs.QueueEncryption.KMS,
        encryptionMasterKey: props.kmsKey,
      });

    this.queue = new sqs.Queue(this, "BudgetNeutralityValidationQueue", {
      removalPolicy,
      enforceSSL: true,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: props.kmsKey,
      visibilityTimeout: Duration.minutes(5),
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: 5,
      },
    });

    const dbSecret = aws_secretsmanager.Secret.fromSecretNameV2(
      this,
      "rdsBudgetNeutralityDatabaseSecret",
      `demos-${props.hostEnvironment}-rds-demos_upload`
    );

    const budgetNeutralityDir = path.resolve(
      process.cwd(),
      "..",
      "lambdas",
      "budgetNeutralityValidation"
    );
    const budgetNeutralityLockFile = path.join(
      budgetNeutralityDir,
      "package-lock.json"
    );

    const budgetNeutralityValidationLambda = new demosLambda.Lambda(
      this,
      "budgetNeutralityValidation",
      {
        ...props,
        scope: this,
        entry: path.join(budgetNeutralityDir, "index.ts"),
        depsLockFilePath: budgetNeutralityLockFile,
        handler: "index.handler",
        timeout: Duration.seconds(60),
        asCode: false,
        externalModules: ["@aws-sdk", "@aws-sdk/client-secrets-manager"],
        nodeModules: ["pg", "pino"],
        vpc: props.vpc,
        securityGroup: props.securityGroup,
        format: OutputFormat.ESM,
        environment: {
          DB_SSL_MODE: "verify-full",
          DATABASE_SECRET_ARN: dbSecret.secretName, // pragma: allowlist secret
          LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
          NODE_EXTRA_CA_CERTS: "/var/runtime/ca-cert.pem",
        },
      }
    );

    budgetNeutralityValidationLambda.lambda.addEventSource(
      new SqsEventSource(this.queue, { batchSize: 1 })
    );

    this.queue.grantConsumeMessages(budgetNeutralityValidationLambda.lambda);
    dbSecret.grantRead(budgetNeutralityValidationLambda.lambda);
    props.kmsKey.grantEncryptDecrypt(budgetNeutralityValidationLambda.lambda);
  }
}
