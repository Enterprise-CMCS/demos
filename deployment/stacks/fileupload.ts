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
  Tags,
  aws_s3_notifications,
  aws_iam,
} from "aws-cdk-lib";

import { Construct } from "constructs";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambda from "../lib/lambda";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { DeploymentConfigProperties } from "../config";
import * as securityGroup from "../lib/security-group";
import { GuardDutyS3 } from "../lib/guardDutyS3";
import importNumberValue from "../util/importNumberValue";
import { backupTags } from "../util/backup";
import { UiPathProcessor } from "../lib/uipathProcessor";
import { BudgetNeutralityProcessor } from "../lib/budgetNeutralityProcessor";

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
      encryption: QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
    });

    const deleteInfectedFileQueue = new Queue(this, "DeleteInfectedFileQueue", {
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
      encryption: QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
      deadLetterQueue: {
        maxReceiveCount: 5,
        queue: deadLetterQueue,
      },
    });

    const accessLogs = new Bucket(this, "fileUploadAccessLogBucket", {
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      removalPolicy:
        props.isDev || props.isEphemeral ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: props.isDev || props.isEphemeral,
      enforceSSL: true,
    });

    const accessLogBucketCfn = accessLogs.node.defaultChild as aws_s3.CfnBucket;
    accessLogBucketCfn.cfnOptions.metadata = {
      checkov: {
        skip: [{
          id: "CKV_AWS_18",
          reason: "the access log bucket itself does not need access logs"
        },{
          id: "CKV_AWS_21",
          reason: "versioning on the access log bucket itself is intentionally disabled"
        }]
      }
    }

    const s3AccessLogBucketArn = Fn.importValue(`${props.stage}AccessLogBucketArn`)
    const s3AccessLogBucket = Bucket.fromBucketArn(this, "coreAccessLogBucket", s3AccessLogBucketArn)

    const uploadBucket = new Bucket(this, "FileUploadBucket", {
      versioned: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      serverAccessLogsBucket: s3AccessLogBucket,
      serverAccessLogsPrefix: "upload/",
      enforceSSL: true,
      eventBridgeEnabled: true,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [HttpMethods.PUT],
          allowedOrigins: [`https://${props.cloudfrontHost}`],
          allowedHeaders: ["*"],
        },
      ],
    });

    const dataConnectBucket = new Bucket(this, "DataConnectBucket", {
      bucketName: `demos-${props.stage}-dataconnect`,
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      serverAccessLogsBucket: s3AccessLogBucket,
      serverAccessLogsPrefix: "dataconnect/",
      enforceSSL: true,
      eventBridgeEnabled: true,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
    });

    dataConnectBucket.addToResourcePolicy(new aws_iam.PolicyStatement({
      effect: aws_iam.Effect.ALLOW,
      principals: [
        new aws_iam.ArnPrincipal(props.dataConnectRoleArn)
      ],
      actions: [
        "s3:GetBucketLocation",
        "s3:GetObject",
        "s3:GetObjectTagging",
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
        "s3:ListMultipartUploadParts"
      ],
      resources: [
        dataConnectBucket.bucketArn,
        dataConnectBucket.arnForObjects("*"),
      ]
    }))

     if (!props.isEphemeral) {
      Tags.of(dataConnectBucket).add("AWS_Backup", backupTags.d15_w90);
    }

    const uploadBucketCfn = uploadBucket.node.defaultChild as aws_s3.CfnBucket;
    uploadBucketCfn.cfnOptions.metadata = {
      checkov: {
        skip: [{
          id: "CKV_AWS_21",
          reason: "versioning on the upload bucket is intentionally disabled. Files are only here for a short time and moved to other buckets based on virus scan status where versioning is enabled"
        }]
      }
    }

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
      serverAccessLogsBucket: s3AccessLogBucket,
      serverAccessLogsPrefix: "clean/",
      enforceSSL: true,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
          allowedOrigins: [`https://${props.cloudfrontHost}`],
          allowedHeaders: ["*"],
        },
      ],
    });

    if (!props.isEphemeral) {
      Tags.of(cleanBucket).add("AWS_Backup", backupTags.d15_w90);
    }

    const deletedBucket = new Bucket(this, "FileDeletedBucket", {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      serverAccessLogsBucket: s3AccessLogBucket,
      serverAccessLogsPrefix: "deleted/",
      enforceSSL: true,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
    });

    const uiPathDocumentsBucket = new Bucket(this, "UiPathDocumentsBucket", {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      serverAccessLogsBucket: accessLogs,
      serverAccessLogsPrefix: "uipath-documents",
      enforceSSL: true,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
    });

    const infectedBucket = new Bucket(this, "FileInfectedBucket", {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      serverAccessLogsBucket: accessLogs,
      serverAccessLogsPrefix: "infected",
      enforceSSL: true,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: "DeleteInfectedFilesAfter30Days",
          enabled: true,
          expiration: Duration.days(29),
          noncurrentVersionExpiration: Duration.days(1),
        },
        {
          id: "CleanupExpiredDeleteMarkers",
          enabled: true,
          expiredObjectDeleteMarker: true,
        },
      ],
    });

    infectedBucket.addEventNotification(
      aws_s3.EventType.LIFECYCLE_EXPIRATION_DELETE_MARKER_CREATED,
      new aws_s3_notifications.SqsDestination(deleteInfectedFileQueue)
    );

    const fileProcessLambdaSecurityGroup = securityGroup.create({
      ...props,
      name: "fileProcessSecurityGroup",
      vpc: props.vpc,
      scope: this,
    });

    const rdsSecurityGroupId = Fn.importValue(
      `${props.project}-${props.hostEnvironment}-rds-security-group-id`
    );

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

    const sqsVpceSgId = Fn.importValue(`${props.stage}SqsVpceSg`);

    fileProcessLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(sqsVpceSgId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to SQS"
    );

    const s3PrefixList = aws_ec2.PrefixList.fromLookup(this, "s3PrefixList", {
      prefixListName: `com.amazonaws.${this.region}.s3`,
    });
    fileProcessLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.prefixList(s3PrefixList.prefixListId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to S3"
    );

    const uiPathLambdaSecurityGroup = securityGroup.create({
      ...props,
      name: "uiPathSecurityGroup",
      vpc: props.vpc,
      scope: this,
    });

    rdsSg.addIngressRule(
      aws_ec2.Peer.securityGroupId(uiPathLambdaSecurityGroup.securityGroup.securityGroupId),
      aws_ec2.Port.tcp(rdsPort),
      "Allow ingress from UiPath Security Group",
      true
    );

    uiPathLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(rdsSecurityGroupId),
      aws_ec2.Port.tcp(rdsPort),
      "Allow egress to RDS",
      true
    );

    uiPathLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(secretsManagerVpceSgId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to secrets manager VPCE"
    );

    uiPathLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.prefixList(s3PrefixList.prefixListId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to S3"
    );

    uiPathLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.anyIpv4(),
      aws_ec2.Port.HTTPS,
      "Allow outbound HTTPS to UiPath"
    );

    const budgetNeutralityLambdaSecurityGroup = securityGroup.create({
      ...props,
      name: "budgetNeutralitySecurityGroup",
      vpc: props.vpc,
      scope: this,
    });

    rdsSg.addIngressRule(
      aws_ec2.Peer.securityGroupId(
        budgetNeutralityLambdaSecurityGroup.securityGroup.securityGroupId
      ),
      aws_ec2.Port.tcp(rdsPort),
      "Allow ingress from Budget Neutrality Security Group",
      true
    );

    budgetNeutralityLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(rdsSecurityGroupId),
      aws_ec2.Port.tcp(rdsPort),
      "Allow egress to RDS",
      true
    );

    budgetNeutralityLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(secretsManagerVpceSgId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to secrets manager VPCE"
    );

    const dbSecretFileProcess = aws_secretsmanager.Secret.fromSecretNameV2(
      this,
      "rdsFileProcessDatabaseSecret",
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
      nodeModules: ["pg", "pino"],
      timeout: Duration.seconds(30),
      environment: {
        UPLOAD_BUCKET: uploadBucket.bucketName,
        CLEAN_BUCKET: cleanBucket.bucketName,
        INFECTED_BUCKET: infectedBucket.bucketName,
        DATABASE_SECRET_ARN: dbSecretFileProcess.secretName, // pragma: allowlist secret
        NODE_EXTRA_CA_CERTS: "/var/runtime/ca-cert.pem",
      },
      depsLockFilePath: "../lambdas/fileprocess/package-lock.json",
    });

    fileProcessLambda.lambda.addEventSource(
      new SqsEventSource(uploadQueue, {
        batchSize: 1,
      })
    );

    uploadBucket.grantRead(fileProcessLambda.lambda);
    uploadBucket.grantDelete(fileProcessLambda.lambda);
    cleanBucket.grantWrite(fileProcessLambda.lambda);
    infectedBucket.grantWrite(fileProcessLambda.lambda);
    uploadQueue.grantConsumeMessages(fileProcessLambda.lambda);
    dbSecretFileProcess.grantRead(fileProcessLambda.lambda);

    const dbSecretDeleteInfectedFile = aws_secretsmanager.Secret.fromSecretNameV2(
      this,
      "rdsDeleteInfectedFileDatabaseSecret",
      `demos-${props.hostEnvironment}-rds-demos_delete_infected_file`
    );
    const deleteInfectedFileLambda = new lambda.Lambda(this, "deleteInfectedFile", {
      ...props,
      scope: this,
      entry: "../lambdas/deleteinfectedfile/index.ts",
      handler: "index.handler",
      vpc: props.vpc,
      securityGroup: fileProcessLambdaSecurityGroup.securityGroup,
      asCode: false,
      externalModules: ["@aws-sdk"],
      nodeModules: ["pg", "pino"],
      timeout: Duration.seconds(30),
      environment: {
        INFECTED_BUCKET: infectedBucket.bucketName,
        DATABASE_SECRET_ARN: dbSecretDeleteInfectedFile.secretName, // pragma: allowlist secret
        NODE_EXTRA_CA_CERTS: "/var/runtime/ca-cert.pem",
      },
      depsLockFilePath: "../lambdas/deleteinfectedfile/package-lock.json",
    });

    deleteInfectedFileLambda.lambda.addEventSource(
      new SqsEventSource(deleteInfectedFileQueue, {
        batchSize: 1,
      })
    );

    dbSecretDeleteInfectedFile.grantRead(deleteInfectedFileLambda.lambda);
    deleteInfectedFileQueue.grantConsumeMessages(deleteInfectedFileLambda.lambda);

    // UiPath processor (queue + DLQ + lambda) within FileUpload stack
    const uiPathProcessor = new UiPathProcessor(this, "UiPathProcessor", {
      ...props,
      removalPolicy: props.isDev || props.isEphemeral ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      kmsKey,
      deadLetterQueue,
      documentsBucket: uiPathDocumentsBucket,
      readBuckets: [cleanBucket],
      vpc: props.vpc,
      securityGroup: uiPathLambdaSecurityGroup.securityGroup,
    });

    fileProcessLambda.lambda.addEnvironment(
      "UIPATH_QUEUE_URL",
      uiPathProcessor.queue.queueUrl
    );
    uiPathProcessor.queue.grantSendMessages(fileProcessLambda.lambda);

    const budgetNeutralityProcessor = new BudgetNeutralityProcessor(
      this,
      "BudgetNeutralityProcessor",
      {
        ...props,
        removalPolicy: props.isDev || props.isEphemeral ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
        kmsKey,
        deadLetterQueue,
        vpc: props.vpc,
        securityGroup: budgetNeutralityLambdaSecurityGroup.securityGroup,
      }
    );

    fileProcessLambda.lambda.addEnvironment(
      "BUDGET_NEUTRALITY_QUEUE_URL",
      budgetNeutralityProcessor.queue.queueUrl
    );
    budgetNeutralityProcessor.queue.grantSendMessages(fileProcessLambda.lambda);

    new CfnOutput(this, "cleanBucketName", {
      exportName: `${props.stage}CleanBucketName`,
      value: cleanBucket.bucketName,
    });

    new CfnOutput(this, "uploadBucketName", {
      exportName: `${props.stage}UploadBucketName`,
      value: uploadBucket.bucketName,
    });

    new CfnOutput(this, "deletedBucketName", {
      exportName: `${props.stage}DeletedBucketName`,
      value: deletedBucket.bucketName,
    });

    new CfnOutput(this, "infectedBucketName", {
      exportName: `${props.stage}InfectedBucketName`,
      value: infectedBucket.bucketName,
    });

    new CfnOutput(this, "uipathDocumentsBucketName", {
      exportName: `${props.stage}UiPathDocumentsBucketName`,
      value: uiPathDocumentsBucket.bucketName,
    });

    new CfnOutput(this, "uipathQueueUrl", {
      exportName: `${props.stage}UiPathQueueUrl`,
      value: uiPathProcessor.queue.queueUrl,
    });

    new CfnOutput(this, "uipathQueueArn", {
      exportName: `${props.stage}UiPathQueueArn`,
      value: uiPathProcessor.queue.queueArn,
    });

    new CfnOutput(this, "budgetNeutralityQueueUrl", {
      exportName: `${props.stage}BudgetNeutralityQueueUrl`,
      value: budgetNeutralityProcessor.queue.queueUrl,
    });

    new CfnOutput(this, "budgetNeutralityQueueArn", {
      exportName: `${props.stage}BudgetNeutralityQueueArn`,
      value: budgetNeutralityProcessor.queue.queueArn,
    });
  }
}
