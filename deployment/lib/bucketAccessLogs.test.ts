import { App, Names, Stack, aws_s3 } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { BucketAccessLogs } from "./bucketAccessLogs";

const createStack = (stage = "unittest") => {
  const app = new App();
  const stack = new Stack(app, "TestStack", {
    env: {
      account: "111122223333",
      region: "us-east-1",
    },
  });
  const bucket = new aws_s3.Bucket(stack, "AccessLogsBucket");

  new BucketAccessLogs(stack, "BucketAccessLogs", { bucket, stage });

  return { bucket, template: Template.fromStack(stack) };
};

describe("BucketAccessLogs", () => {
  test("creates and wires an S3 access-log delivery to the stage log group", () => {
    const { bucket, template } = createStack();
    const suffix = Names.uniqueId(bucket).slice(-12);
    const bucketLogicalId = Object.keys(
      template.findResources("AWS::S3::Bucket"),
    )[0];

    template.resourceCountIs("AWS::Logs::DeliverySource", 1);
    template.resourceCountIs("AWS::Logs::DeliveryDestination", 1);
    template.resourceCountIs("AWS::Logs::Delivery", 1);
    // The construct references the application log group; it must not create or
    // take ownership of that independently managed resource.
    template.resourceCountIs("AWS::Logs::LogGroup", 0);

    template.hasResourceProperties("AWS::Logs::DeliverySource", {
      Name: `s3-access-source-${suffix}`,
      ResourceArn: {
        "Fn::GetAtt": [bucketLogicalId, "Arn"],
      },
      LogType: "S3_SERVER_ACCESS_LOGS",
    });

    template.hasResourceProperties("AWS::Logs::DeliveryDestination", {
      Name: `s3-access-destination-${suffix}`,
      DestinationResourceArn: {
        "Fn::Join": [
          "",
          [
            "arn:",
            { Ref: "AWS::Partition" },
            ":logs:us-east-1:111122223333:log-group:/demos/unittest/s3/access:*",
          ],
        ],
      },
      DeliveryDestinationType: "CWL",
      OutputFormat: "json",
    });

    const sources = template.findResources("AWS::Logs::DeliverySource");
    const destinations = template.findResources("AWS::Logs::DeliveryDestination");
    const deliveries = template.findResources("AWS::Logs::Delivery");
    const sourceLogicalId = Object.keys(sources)[0];
    const destinationLogicalId = Object.keys(destinations)[0];
    const delivery = Object.values(deliveries)[0];

    expect(delivery.Properties).toEqual({
      DeliverySourceName: `s3-access-source-${suffix}`,
      DeliveryDestinationArn: {
        "Fn::GetAtt": [destinationLogicalId, "Arn"],
      },
    });
    expect(delivery.DependsOn).toContain(sourceLogicalId);
  });

  test("adds the documented S3 logging suppressions to the bucket", () => {
    const { template } = createStack();

    template.hasResource("AWS::S3::Bucket", {
      Metadata: {
        checkov: {
          skip: [
            {
              id: "CKV_AWS_18",
              reason: "Server access logs are enabled to cloudwatch",
            },
          ],
        },
        cdk_nag: {
          rules_to_suppress: [
            {
              id: "AwsSolutions-S1",
              reason: "Server access logs are enabled to cloudwatch",
            },
          ],
        },
      },
    });
  });

  test("derives the access-log group name from the stage", () => {
    expect(BucketAccessLogs.getS3AccessLogLogGroupName("feature-123")).toBe(
      "/demos/feature-123/s3/access",
    );
  });
});
