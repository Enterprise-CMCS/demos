import { aws_events, aws_events_targets, aws_guardduty, aws_iam, aws_s3, aws_sqs } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Wait } from "./wait";

interface GuardDutyS3Props {
  bucket: aws_s3.IBucket;
  region: string;
  account: string;
  stage: string;
  uploadQueue: aws_sqs.IQueue;
}

export class GuardDutyS3 extends Construct {
  constructor(scope: Construct, id: string, props: GuardDutyS3Props) {
    super(scope, id);

    const rolePolicy = new aws_iam.Policy(this, "GuardDutyMalwareProtectionRolePolicy", {
      statements: [
        new aws_iam.PolicyStatement({
          sid: "AllowManagedRuleToSendS3EventsToGuardDuty",
          effect: aws_iam.Effect.ALLOW,
          actions: ["events:PutRule", "events:DeleteRule", "events:PutTargets", "events:RemoveTargets"],
          resources: [
            `arn:aws:events:${props.region}:${props.account}:rule/DO-NOT-DELETE-AmazonGuardDutyMalwareProtectionS3*`,
          ],
          conditions: {
            StringLike: {
              "events:ManagedBy": "malware-protection-plan.guardduty.amazonaws.com",
            },
          },
        }),
        new aws_iam.PolicyStatement({
          sid: "AllowGuardDutyToMonitorEventBridgeManagedRule",
          effect: aws_iam.Effect.ALLOW,
          actions: ["events:DescribeRule", "events:ListTargetsByRule"],
          resources: [
            `arn:aws:events:${props.region}:${props.account}:rule/DO-NOT-DELETE-AmazonGuardDutyMalwareProtectionS3*`,
          ],
        }),
        new aws_iam.PolicyStatement({
          sid: "AllowPostScanTag",
          effect: aws_iam.Effect.ALLOW,
          actions: [
            "s3:PutObjectTagging",
            "s3:GetObjectTagging",
            "s3:PutObjectVersionTagging",
            "s3:GetObjectVersionTagging",
          ],
          resources: [`${props.bucket.bucketArn}/*`],
        }),
        new aws_iam.PolicyStatement({
          sid: "AllowEnableS3EventBridgeEvents",
          effect: aws_iam.Effect.ALLOW,
          actions: ["s3:PutBucketNotification", "s3:GetBucketNotification"],
          resources: [`${props.bucket.bucketArn}`],
        }),
        new aws_iam.PolicyStatement({
          sid: "AllowPutValidationObject",
          effect: aws_iam.Effect.ALLOW,
          actions: ["s3:PutObject"],
          resources: [`${props.bucket.bucketArn}/malware-protection-resource-validation-object`],
        }),
        new aws_iam.PolicyStatement({
          sid: "AllowCheckBucketOwnership",
          effect: aws_iam.Effect.ALLOW,
          actions: ["s3:ListBucket", "s3:GetBucketLocation"],
          resources: [`${props.bucket.bucketArn}`],
        }),
        new aws_iam.PolicyStatement({
          sid: "AllowMalwareScan",
          effect: aws_iam.Effect.ALLOW,
          actions: ["s3:GetObject", "s3:GetObjectVersion"],
          resources: [`${props.bucket.bucketArn}/*`],
        }),
      ],
    });

    const guardDutyPassRole = new aws_iam.Role(this, "GuardDutyMalwareProtectionPassRole", {
      roleName: `GuardDutyMalwareProtectionPassRole-${props.stage}`,
      assumedBy: new aws_iam.ServicePrincipal("malware-protection-plan.guardduty.amazonaws.com"),
      description: "An iam pass role for guardduty malware protection service to assume",
    });

    rolePolicy.attachToRole(guardDutyPassRole);

    const roleWait = Wait.forSeconds(this, "guardDutyRoleWait", 30);
    roleWait.node.addDependency(guardDutyPassRole);

    const protectionPlan = new aws_guardduty.CfnMalwareProtectionPlan(this, "guardDutyS3Protection", {
      protectedResource: {
        s3Bucket: {
          bucketName: props.bucket.bucketName,
        },
      },
      role: guardDutyPassRole.roleArn,
      actions: {
        tagging: {
          status: "ENABLED",
        },
      },
    });

    protectionPlan.node.addDependency(roleWait);

    const GuardDutyCopyS3ObjectRule = new aws_events.Rule(this, "GuardDutyCopyS3ObjectRule", {
      ruleName: `demos-${props.stage}-guardduty-scan`,
      description: `Copy GuardDuty scanned S3 objects from: ${props.bucket.bucketName} to clean`,
      eventPattern: {
        source: ["aws.guardduty"],
        detailType: ["GuardDuty Malware Protection Object Scan Result"],
        detail: {
          scanStatus: ["COMPLETED", "DONE"],
          resourceType: ["S3_OBJECT"],
          s3ObjectDetails: {
            bucketName: [props.bucket.bucketName],
          },
        },
      },
    });

    GuardDutyCopyS3ObjectRule.addTarget(new aws_events_targets.SqsQueue(props.uploadQueue));
  }
}
