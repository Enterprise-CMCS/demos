import { App, RemovalPolicy, Stack } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { BudgetNeutralityProcessor } from "./budgetNeutralityProcessor";
import { DeploymentConfigProperties } from "../config";
import { BUNDLING_STACKS } from "aws-cdk-lib/cx-api";
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

describe("BudgetNeutralityProcessor construct", () => {
  it("synthesizes queue, DLQ, and lambda", () => {
    const app = new App({
      context: {
        [BUNDLING_STACKS]: [],
      },
    });

    const stack = new Stack(app, "budgetNeutralityProcessorTest", {
      env: { account: "0123456789", region: "us-east-1" },
    });

    new BudgetNeutralityProcessor(stack, "BudgetNeutralityProcessor", {
      ...mockProps,
      removalPolicy: RemovalPolicy.DESTROY,
      kmsKey: new Key(stack, "BudgetNeutralityKmsKey"),
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SQS::Queue", 2);
    template.resourceCountIs("AWS::Lambda::Function", 1);
    template.resourceCountIs("AWS::CloudWatch::Alarm", 4);
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-budget-neutrality-lambda-errors",
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
            Ref: Match.stringLikeRegexp("budgetNeutrality"),
          }),
        }),
      ]),
    });
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-budget-neutrality-queue-oldest-message-age-high",
      ComparisonOperator: "GreaterThanThreshold",
      EvaluationPeriods: 2,
      DatapointsToAlarm: 2,
      MetricName: "ApproximateAgeOfOldestMessage",
      Namespace: "AWS/SQS",
      Period: 300,
      Statistic: "Maximum",
      Threshold: 900,
      TreatMissingData: "notBreaching",
      Dimensions: Match.arrayWith([
        Match.objectLike({
          Name: "QueueName",
          Value: Match.anyValue(),
        }),
      ]),
    });
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-budget-neutrality-lambda-duration-near-timeout",
      ComparisonOperator: "GreaterThanThreshold",
      MetricName: "Duration",
      Namespace: "AWS/Lambda",
      Period: 300,
      Statistic: "Maximum",
      Threshold: 48000,
      TreatMissingData: "notBreaching",
      Dimensions: Match.arrayWith([
        Match.objectLike({
          Name: "FunctionName",
          Value: Match.objectLike({
            Ref: Match.stringLikeRegexp("budgetNeutrality"),
          }),
        }),
      ]),
    });
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-budget-neutrality-lambda-throttles",
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
            Ref: Match.stringLikeRegexp("budgetNeutrality"),
          }),
        }),
      ]),
    });
  });
});
