import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, EventType } from "aws-cdk-lib/aws-s3";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { SqsDestination } from "aws-cdk-lib/aws-s3-notifications";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as path from "path";

export class FileUploadStack extends Stack {
  public readonly uploadBucket: Bucket;
  public readonly cleanBucket: Bucket;
  public readonly uploadQueue: Queue;
  public readonly deadLetterQueue: Queue;
  public readonly fileProcessLambda: Function;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.deadLetterQueue = new Queue(this, "FileUploadDLQ", {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.uploadQueue = new Queue(this, "FileUploadQueue", {
      removalPolicy: RemovalPolicy.DESTROY,
      deadLetterQueue: {
        maxReceiveCount: 5,
        queue: this.deadLetterQueue,
      },
    });

    this.uploadBucket = new Bucket(this, "FileUploadBucket", {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
    });

    this.uploadBucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new SqsDestination(this.uploadQueue)
    );

    this.cleanBucket = new Bucket(this, "FileCleanBucket", {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
    });

    this.fileProcessLambda = new Function(this, "FileProcessLambda", {
      runtime: Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: Code.fromAsset(path.join(__dirname, "../../lambda/fileprocess")),
      environment: {
        UPLOAD_BUCKET: this.uploadBucket.bucketName,
        CLEAN_BUCKET: this.cleanBucket.bucketName,
      },
    });

    this.fileProcessLambda.addEventSource(
      new SqsEventSource(this.uploadQueue, {
        batchSize: 1,
      })
    );

    this.uploadBucket.grantRead(this.fileProcessLambda);
    this.cleanBucket.grantWrite(this.fileProcessLambda);
    this.uploadQueue.grantConsumeMessages(this.fileProcessLambda);
  }
}
