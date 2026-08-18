import {
  Stack,
  StackProps,
  aws_iam,
  RemovalPolicy,
  aws_s3,
  Fn,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";



export class PMDATransfer extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & DeploymentConfigProperties) {
    super(scope, id, {
      ...props,
      terminationProtection: false,
    });

    const commonProps = {
      ...props,
      scope: this,
      iamPermissionsBoundary:
        props.iamPermissionsBoundaryArn == null
          ? undefined: aws_iam.ManagedPolicy.fromManagedPolicyArn(this, "iamPermissionsBoundary", props.iamPermissionsBoundaryArn),
    };
   
    const s3AccessLogBucketArn = Fn.importValue(`${props.stage}AccessLogBucketArn`)
    const s3AccessLogBucket = aws_s3.Bucket.fromBucketArn(this, "coreAccessLogBucket", s3AccessLogBucketArn)

    const transferBucket = new aws_s3.Bucket(commonProps.scope, "pmdaEfsTransfer", {
          encryption: aws_s3.BucketEncryption.S3_MANAGED,
          publicReadAccess: false,
          blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
          removalPolicy: commonProps.isDev || commonProps.isEphemeral ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
          autoDeleteObjects: commonProps.isDev || commonProps.isEphemeral,
          serverAccessLogsBucket: s3AccessLogBucket,
          enforceSSL: true,
          bucketName: `demos-${commonProps.stage}-pmda-efs-transfer`,
          versioned: true,
        });

        if (!commonProps.pmdaDataSyncArn) {
          throw new Error("The datasync role must be populated for this stack to run");
        }
    
        transferBucket.addToResourcePolicy(new aws_iam.PolicyStatement({
          effect: aws_iam.Effect.ALLOW,
          principals: [new aws_iam.ArnPrincipal(commonProps.pmdaDataSyncArn)],
          actions: [
            "s3:AbortMultipartUpload",
            "s3:DeleteObject",
            "s3:GetBucketLocation",
            "s3:GetObject",
            "s3:GetObjectTagging",
            "s3:GetObjectVersion",
            "s3:GetObjectVersionTagging",
            "s3:ListBucket",
            "s3:ListBucketMultipartUploads",
            "s3:ListMultipartUploadParts",
            "s3:PutObject",
            "s3:PutObjectTagging"
          ],
          resources: [
            transferBucket.bucketArn,
            transferBucket.arnForObjects("*"),
          ]
        }))

  }
}
