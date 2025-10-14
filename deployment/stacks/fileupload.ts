import {
  Stack,
  StackProps,
  RemovalPolicy,
  aws_s3,
  Duration,
  aws_kms,
  CfnOutput,
  aws_secretsmanager,
  Fn,
  aws_ec2,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambda from "../lib/lambda";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { DeploymentConfigProperties } from "../config";
import * as securityGroup from "../lib/security-group";
import { GuardDutyS3 } from "../lib/guardDutyS3";
import importNumberValue from "../util/importNumberValue";

interface FileUploadStackProps extends StackProps, DeploymentConfigProperties {
  vpc: IVpc;
}

export class FileUploadStack extends Stack {
  constructor(scope: Construct, id: string, props: FileUploadStackProps) {
    super(scope, id, props);

    const kmsKey = new aws_kms.Key(this, "queueKey", {
      enableKeyRotation: true,
      alias: `alias/demos-${props.stage}-file-upload-sqs`,
    });

    const deadLetterQueue = new Queue(this, "FileUploadDLQ", {
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
      encryption: QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
    });

    const uploadQueue = new Queue(this, "FileUploadQueue", {
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
      deadLetterQueue: {
        maxReceiveCount: 5,
        queue: deadLetterQueue,
      },
    });

    const accessLogs = new Bucket(this, "fileUploadAccessLogBucket", {
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      removalPolicy: props.isDev || props.isEphemeral ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: props.isDev || props.isEphemeral,
      enforceSSL: true,
    });

    const uploadBucket = new Bucket(this, "FileUploadBucket", {
      versioned: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      serverAccessLogsBucket: accessLogs,
      serverAccessLogsPrefix: "upload",
      enforceSSL: true,
      eventBridgeEnabled: true,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
    });

    new GuardDutyS3(this, "uploadBucketScan", {
      bucket: uploadBucket,
      region: this.region,
      account: this.account,
      stage: props.stage,
      uploadQueue,
    });

    const cleanBucket = new Bucket(this, "FileCleanBucket", {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      serverAccessLogsBucket: accessLogs,
      serverAccessLogsPrefix: "clean",
      enforceSSL: true,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
    });

    const fileProcessLambdaSecurityGroup = securityGroup.create({
      ...props,
      name: "fileProcessSecurityGroup",
      vpc: props.vpc,
      scope: this,
    });

    const rdsSecurityGroupId = Fn.importValue(`${props.project}-${props.hostEnvironment}-rds-security-group-id`);

    const rdsPort = importNumberValue(`${props.project}-${props.hostEnvironment}-rds-port`);

    const rdsSg = aws_ec2.SecurityGroup.fromSecurityGroupId(this, "rdsSg", rdsSecurityGroupId);

    rdsSg.addIngressRule(
      aws_ec2.Peer.securityGroupId(fileProcessLambdaSecurityGroup.securityGroup.securityGroupId),
      aws_ec2.Port.tcp(rdsPort)
    );

    fileProcessLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(rdsSecurityGroupId),
      aws_ec2.Port.tcp(rdsPort),
      "Allow egress to RDS",
      true
    );

    const secretsManagerVpceSgId = Fn.importValue(`${props.stage}SecretsManagerVpceSg`);

    fileProcessLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(secretsManagerVpceSgId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to secrets manager VPCE"
    );

    const s3PrefixList = aws_ec2.PrefixList.fromLookup(this, "s3PrefixList", {
      prefixListName: `com.amazonaws.${this.region}.s3`,
    });
    fileProcessLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.prefixList(s3PrefixList.prefixListId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to S3"
    );

    const dbSecret = aws_secretsmanager.Secret.fromSecretNameV2(
      this,
      "rdsDatabaseSecret",
      `demos-${props.hostEnvironment}-rds-demos_upload`
    );

    const fileProcessLambda = new lambda.Lambda(this, "fileProcess", {
      ...props,
      scope: this,
      entry: "../lambdas/fileprocess/index.ts",
      handler: "index.handler",
      vpc: props.vpc,
      securityGroup: fileProcessLambdaSecurityGroup.securityGroup,
      asCode: false,
      externalModules: ["@aws-sdk"],
      nodeModules: ["pg"],
      timeout: Duration.seconds(30),
      environment: {
        UPLOAD_BUCKET: uploadBucket.bucketName,
        CLEAN_BUCKET: cleanBucket.bucketName,
        DATABASE_SECRET_ARN: dbSecret.secretName, // pragma: allowlist secret
      },
    });

    fileProcessLambda.lambda.addEventSource(
      new SqsEventSource(uploadQueue, {
        batchSize: 1,
      })
    );

    uploadBucket.grantRead(fileProcessLambda.lambda);
    uploadBucket.grantDelete(fileProcessLambda.lambda);
    cleanBucket.grantWrite(fileProcessLambda.lambda);
    uploadQueue.grantConsumeMessages(fileProcessLambda.lambda);
    dbSecret.grantRead(fileProcessLambda.lambda);

    new CfnOutput(this, "cleanBucketName", {
      exportName: `${props.stage}CleanBucketName`,
      value: cleanBucket.bucketName,
    });

    new CfnOutput(this, "uploadBucketName", {
      exportName: `${props.stage}UploadBucketName`,
      value: uploadBucket.bucketName,
    });
  }
}
