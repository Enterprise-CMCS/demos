import { aws_logs, Names } from "aws-cdk-lib";
import { aws_s3 } from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { addCheckovSkip } from "../util/addCheckovSkip";

interface BucketAccessLogsProps {
  bucket: aws_s3.Bucket
  stage: string
}

export class BucketAccessLogs extends Construct {

  constructor(scope: Construct, id: string, props: BucketAccessLogsProps) {
    super(scope, id);

    const {bucket,stage} = props

    const suffix = Names.uniqueId(bucket).slice(-12);
    const sourceName = `s3-access-source-${suffix}`;
    const destinationName = `s3-access-destination-${suffix}`;

    const logGroup = aws_logs.LogGroup.fromLogGroupName(this, "S3AccessLogsLogGroup", BucketAccessLogs.getS3AccessLogLogGroupName(stage))

    const deliverySource = new aws_logs.CfnDeliverySource(
      this,
      "S3AccessLogSource",
      {
        name: sourceName,
        resourceArn: bucket.bucketArn,
        logType: "S3_SERVER_ACCESS_LOGS"
      }
    )

    const deliveryDestination = new aws_logs.CfnDeliveryDestination(
      this,
      "S3AccessLogDestination",
      {
        name: destinationName,
        destinationResourceArn: logGroup.logGroupArn,
        deliveryDestinationType: "CWL",
        outputFormat: "json"
      }
    )

    const delivery = new aws_logs.CfnDelivery(this, "S3AccessLogDelivery", {
      deliverySourceName: sourceName,
      deliveryDestinationArn: deliveryDestination.attrArn
    })

    delivery.addResourceDependency(deliverySource)

    // Add nag suppression since bucket has access logs through cloudfront,
    // which covers the requirement that nag wants for S3 access logging
    NagSuppressions.addResourceSuppressions(bucket, [
      {
        id: "AwsSolutions-S1",
        reason: "Server access logs are enabled to cloudwatch"
      }
    ])

    addCheckovSkip(bucket, {
      id: "CKV_AWS_18",
      reason: "Server access logs are enabled to cloudwatch"
    })
    
  }

  public static getS3AccessLogLogGroupName(stage: string): string {
    return `/demos/${stage}/s3/access`
  }
}

