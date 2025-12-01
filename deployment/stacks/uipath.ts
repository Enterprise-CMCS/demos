import { Stack, StackProps, Duration, RemovalPolicy, aws_iam } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambda from "../lib/lambda";
import { DeploymentConfigProperties } from "../config";
import path from "node:path";

interface UiPathStackProps extends StackProps, DeploymentConfigProperties {}

export class UiPathStack extends Stack {
  public readonly queue: Queue;

  constructor(scope: Construct, id: string, props: UiPathStackProps) {
    super(scope, id, props);

    const lambdaPath = path.join(__dirname, "..", "..", "lambdas", "UIPath");

    const commonProps = {
      ...props,
      scope: this,
      iamPermissionsBoundary:
        props.iamPermissionsBoundaryArn != null
          ? aws_iam.ManagedPolicy.fromManagedPolicyArn(
              this,
              "uipathIamPermissionsBoundary",
              props.iamPermissionsBoundaryArn
            )
          : undefined,
    };

    const dlq = new Queue(this, "UiPathDLQ", {
      encryption: QueueEncryption.KMS_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
    });

    this.queue = new Queue(this, "UiPathQueue", {
      encryption: QueueEncryption.KMS_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
      deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
    });

    const uipathLambda = new lambda.Lambda(this, "uipath", {
      ...commonProps,
      entry: path.join(lambdaPath, "index.ts"),
      handler: "handler",
      asCode: false,
      timeout: Duration.minutes(2),
      environment: {
        CLIENT_ID: process.env.CLIENT_ID ?? "",
        CLIENT_SECRET: process.env.CLIENT_SECRET ?? "",
        ZERO_PROJECT_ID: process.env.ZERO_PROJECT_ID ?? "",
        EXTRACTOR_GUID: process.env.EXTRACTOR_GUID ?? "",
        LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
      },
      externalModules: ["aws-sdk"],
      nodeModules: ["axios", "form-data", "pino", "pino-pretty"],
      depsLockFilePath: path.join(lambdaPath, "package-lock.json"),
    });

    uipathLambda.lambda.addEventSource(
      new SqsEventSource(this.queue, { batchSize: 1 })
    );
  }
}
