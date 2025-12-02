import { Construct } from "constructs";
import path from "node:path";
import { Duration, RemovalPolicy, aws_sqs as sqs } from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambda from "./lambda";
import { DeploymentConfigProperties } from "../config";

interface UiPathProcessorProps extends DeploymentConfigProperties {
  removalPolicy?: RemovalPolicy;
}

export class UiPathProcessor extends Construct {
  public readonly queue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: UiPathProcessorProps) {
    super(scope, id);

    const lambdaPath = path.join(__dirname, "..", "..", "lambdas", "UIPath");
    const removalPolicy = props.removalPolicy ?? RemovalPolicy.DESTROY;

    this.deadLetterQueue = new sqs.Queue(this, "UiPathDLQ", {
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      enforceSSL: true,
      removalPolicy,
    });

    this.queue = new sqs.Queue(this, "UiPathQueue", {
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      enforceSSL: true,
      removalPolicy,
      deadLetterQueue: { queue: this.deadLetterQueue, maxReceiveCount: 5 },
    });

    const uipathLambda = new lambda.Lambda(this, "Lambda", {
        ...props,
        scope: this,
        entry: path.join(lambdaPath, "index.ts"),
        handler: "handler",
        timeout: Duration.minutes(2),
        asCode: false,
        externalModules: ["aws-sdk"],
        nodeModules: ["axios", "form-data", "pino", "pino-pretty"],
        depsLockFilePath: path.join(lambdaPath, "package-lock.json"),
        environment: {
          CLIENT_ID: process.env.CLIENT_ID ?? "",
          CLIENT_SECRET: process.env.CLIENT_SECRET ?? "",
          UIPATH_PROJECT_ID: process.env.UIPATH_PROJECT_ID ?? "",
          EXTRACTOR_GUID: process.env.EXTRACTOR_GUID ?? "",
          LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
        },
      });

    uipathLambda.lambda.addEventSource(new SqsEventSource(this.queue, { batchSize: 1 }));
  }
}
