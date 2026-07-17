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
import * as alarms from "./alarms";
import path from "node:path";
import { DeploymentConfigProperties } from "../config";
import { OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

interface BudgetNeutralityProcessorProps extends DeploymentConfigProperties {
  removalPolicy?: RemovalPolicy;
  kmsKey: kms.IKey;
  deadLetterQueue?: sqs.IQueue;
  readBuckets?: s3.IBucket[];
  vpc?: ec2.IVpc;
  securityGroup?: ec2.ISecurityGroup | ec2.ISecurityGroup[];
}

export class BudgetNeutralityProcessor extends Construct {
  public readonly queue: sqs.Queue;
  public readonly deadLetterQueue: sqs.IQueue;

  constructor(scope: Construct, id: string, props: BudgetNeutralityProcessorProps) {
    super(scope, id);

    const alarmResources = new alarms.CloudWatchAlarmRegistry();
    const removalPolicy = props.removalPolicy ?? RemovalPolicy.DESTROY;

    this.deadLetterQueue =
      props.deadLetterQueue ??
      new sqs.Queue(this, "BudgetNeutralityDLQ", {
        removalPolicy,
        enforceSSL: true,
        encryption: sqs.QueueEncryption.KMS,
        encryptionMasterKey: props.kmsKey,
      });

    this.queue = new sqs.Queue(this, "BudgetNeutralityQueue", {
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
    alarmResources.registerQueue("budgetNeutrality", this.queue);

    const dbSecret = aws_secretsmanager.Secret.fromSecretNameV2(
      this,
      "rdsBudgetNeutralityDatabaseSecret",
      `demos-${props.hostEnvironment}-rds-demos_upload`
    );

    const budgetNeutralityDir = path.resolve(
      process.cwd(),
      "..",
      "lambdas",
      "budgetNeutrality"
    );
    const budgetNeutralityLockFile = path.join(
      budgetNeutralityDir,
      "package-lock.json"
    );

    const cleanReadBucket = props.readBuckets?.[0];

    const budgetNeutralityLambda = new demosLambda.Lambda(
      this,
      "budgetNeutrality",
      {
        ...props,
        scope: this,
        entry: path.join(budgetNeutralityDir, "index.ts"),
        depsLockFilePath: budgetNeutralityLockFile,
        handler: "index.handler",
        timeout: Duration.seconds(60),
        asCode: false,
        externalModules: ["@aws-sdk", "@aws-sdk/client-secrets-manager"],
        nodeModules: ["pg"], 
        vpc: props.vpc,
        securityGroup: props.securityGroup,
        format: OutputFormat.ESM,
        memorySize: 2048,
        environment: {
          DB_SSL_MODE: "verify-full",
          DATABASE_SECRET_ARN: dbSecret.secretName, // pragma: allowlist secret
          LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
          NODE_EXTRA_CA_CERTS: "/var/runtime/ca-cert.pem",
          CLEAN_BUCKET: cleanReadBucket?.bucketName ?? "",
        },
      }
    );
    alarmResources.registerLambda("budgetNeutrality", budgetNeutralityLambda.lambda);

    budgetNeutralityLambda.lambda.addEventSource(
      new SqsEventSource(this.queue, { batchSize: 1 })
    );

    this.setupCloudWatchAlarms(props, alarmResources);

    this.queue.grantConsumeMessages(budgetNeutralityLambda.lambda);
    dbSecret.grantRead(budgetNeutralityLambda.lambda);
    for (const bucket of props.readBuckets ?? []) {
      bucket.grantRead(budgetNeutralityLambda.lambda);
    }
    props.kmsKey.grantEncryptDecrypt(budgetNeutralityLambda.lambda);
  }

  private setupCloudWatchAlarms(
    props: DeploymentConfigProperties,
    resources: alarms.CloudWatchAlarmRegistry
  ) {
    if (props.isEphemeral && !props.enableAlarms) {
      return;
    }

    const alarmPeriod = Duration.minutes(5);

    alarms.createSqsOldestMessageAgeAlarm({
      ...props,
      scope: this,
      id: "BudgetNeutralityQueueOldestMessageAgeAlarm",
      name: "budget-neutrality-queue-oldest-message-age-high",
      description: "Budget neutrality queue has messages older than 15 minutes.",
      queue: resources.queue("budgetNeutrality"),
      period: alarmPeriod,
      threshold: Duration.minutes(15),
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    alarms.createLambdaErrorsAlarm({
      ...props,
      scope: this,
      id: "BudgetNeutralityLambdaErrorsAlarm",
      name: "budget-neutrality-lambda-errors",
      description: "Budget neutrality Lambda has one or more errors in a 5-minute period.",
      lambdaFunction: resources.lambda("budgetNeutrality"),
      period: alarmPeriod,
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    alarms.createLambdaDurationAlarm({
      ...props,
      scope: this,
      id: "BudgetNeutralityLambdaDurationAlarm",
      name: "budget-neutrality-lambda-duration-near-timeout",
      description: "Budget neutrality Lambda duration is above 80% of its configured timeout.",
      lambdaFunction: resources.lambda("budgetNeutrality"),
      period: alarmPeriod,
      threshold: Duration.seconds(48),
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    alarms.createLambdaThrottlesAlarm({
      ...props,
      scope: this,
      id: "BudgetNeutralityLambdaThrottlesAlarm",
      name: "budget-neutrality-lambda-throttles",
      description: "Budget neutrality Lambda has one or more throttled invocations in a 5-minute period.",
      lambdaFunction: resources.lambda("budgetNeutrality"),
      period: alarmPeriod,
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });
  }
}
