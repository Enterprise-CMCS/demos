import { App, RemovalPolicy, Stack } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { UiPathProcessor } from "./uipathProcessor";
import { DeploymentConfigProperties } from "../config";
import { BUNDLING_STACKS } from "aws-cdk-lib/cx-api";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Key } from "aws-cdk-lib/aws-kms";

const mockProps: DeploymentConfigProperties = {
  project: "demos",
  isDev: true,
  isLocalstack: false,
  isEphemeral: false,
  stage: "unittest",
  zScalerIps: ["0.0.0.0"],
  hostEnvironment: "dev",
  cloudfrontHost: "unittest.demos.com",
  srrConfigured: false,
  dataConnectRoleArn: "arn:aws:iam::1234567890:role/dataconnectrole",
};

describe("UiPathProcessor construct", () => {
  it("synthesizes queue, DLQ, and lambda", () => {
    const app = new App({
      context: {
        // 👇 Disable bundling for ALL stacks in this test run
        [BUNDLING_STACKS]: [],
      },
    });

    const stack = new Stack(app, "uiPathProcessorTest", {
      env: { account: "0123456789", region: "us-east-1" },
    });

    new UiPathProcessor(stack, "UiPathProcessor", {
      ...mockProps,
      removalPolicy: RemovalPolicy.DESTROY,
      documentsBucket: new Bucket(stack, "UiPathDocumentsBucket"),
      kmsKey: new Key(stack, "UiPathKmsKey"),
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SQS::Queue", 2);
    template.resourceCountIs("AWS::Lambda::Function", 1);
    template.resourceCountIs("AWS::CloudWatch::Alarm", 3);
    template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike({}));
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-uipath-lambda-errors",
      ComparisonOperator: "GreaterThanThreshold",
      MetricName: "Errors",
      Namespace: "AWS/Lambda",
      Period: 300,
      Statistic: "Sum",
      Threshold: 0,
      TreatMissingData: "notBreaching",
      Dimensions: Match.arrayWith([
        Match.objectLike({
          Name: "FunctionName",
          Value: Match.objectLike({
            Ref: Match.stringLikeRegexp("uipath"),
          }),
        }),
      ]),
    });
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-uipath-queue-oldest-message-age-high",
      ComparisonOperator: "GreaterThanThreshold",
      EvaluationPeriods: 2,
      DatapointsToAlarm: 2,
      MetricName: "ApproximateAgeOfOldestMessage",
      Namespace: "AWS/SQS",
      Period: 300,
      Statistic: "Maximum",
      Threshold: 3600,
      TreatMissingData: "notBreaching",
      Dimensions: Match.arrayWith([
        Match.objectLike({
          Name: "QueueName",
          Value: Match.anyValue(),
        }),
      ]),
    });
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-uipath-lambda-throttles",
      ComparisonOperator: "GreaterThanThreshold",
      MetricName: "Throttles",
      Namespace: "AWS/Lambda",
      Period: 300,
      Statistic: "Sum",
      Threshold: 0,
      TreatMissingData: "notBreaching",
      Dimensions: Match.arrayWith([
        Match.objectLike({
          Name: "FunctionName",
          Value: Match.objectLike({
            Ref: Match.stringLikeRegexp("uipath"),
          }),
        }),
      ]),
    });
    template.resourcePropertiesCountIs(
      "AWS::CloudWatch::Alarm",
      {
        AlarmName: "demos-unittest-uipath-lambda-duration-near-timeout",
      },
      0
    );
  });
});
