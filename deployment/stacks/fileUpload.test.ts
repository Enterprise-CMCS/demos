import { App, aws_ec2, Stack } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { DeploymentConfigProperties } from "../config";
import { FileUploadStack } from "./fileupload";
import { BUNDLING_STACKS } from "aws-cdk-lib/cx-api";

const mockCommonProps: DeploymentConfigProperties = {
  project: "demos",
  isDev: true,
  isLocalstack: false,
  isEphemeral: false,
  stage: "unittest",
  zScalerIps: ["0.1.2.3"],
  hostEnvironment: "dev",
  cloudfrontHost: "unittest.demos.com",
  srrConfigured: true,
  dataConnectRoleArn: "arn:aws:iam::1234567890:role/dataconnectrole",
};
const commongAppArgs = {
  context: {
    [BUNDLING_STACKS]: [],
  },
};

function expectLambdaErrorsAlarm(
  template: Template,
  alarmName: string,
  functionRefPattern: string
) {
  template.hasResourceProperties("AWS::CloudWatch::Alarm", {
    AlarmName: alarmName,
    ComparisonOperator: "GreaterThanThreshold",
    EvaluationPeriods: 1,
    DatapointsToAlarm: 1,
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
          Ref: Match.stringLikeRegexp(functionRefPattern),
        }),
      }),
    ]),
  });
}

function expectLambdaDurationAlarm(
  template: Template,
  alarmName: string,
  functionRefPattern: string,
  thresholdMilliseconds: number
) {
  template.hasResourceProperties("AWS::CloudWatch::Alarm", {
    AlarmName: alarmName,
    ComparisonOperator: "GreaterThanThreshold",
    EvaluationPeriods: 1,
    DatapointsToAlarm: 1,
    MetricName: "Duration",
    Namespace: "AWS/Lambda",
    Period: 300,
    Statistic: "Maximum",
    Threshold: thresholdMilliseconds,
    TreatMissingData: "notBreaching",
    Dimensions: Match.arrayWith([
      Match.objectLike({
        Name: "FunctionName",
        Value: Match.objectLike({
          Ref: Match.stringLikeRegexp(functionRefPattern),
        }),
      }),
    ]),
  });
}

function expectLambdaThrottlesAlarm(
  template: Template,
  alarmName: string,
  functionRefPattern: string
) {
  template.hasResourceProperties("AWS::CloudWatch::Alarm", {
    AlarmName: alarmName,
    ComparisonOperator: "GreaterThanThreshold",
    EvaluationPeriods: 1,
    DatapointsToAlarm: 1,
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
          Ref: Match.stringLikeRegexp(functionRefPattern),
        }),
      }),
    ]),
  });
}

function expectSqsOldestMessageAgeAlarm(
  template: Template,
  alarmName: string,
  thresholdSeconds: number
) {
  template.hasResourceProperties("AWS::CloudWatch::Alarm", {
    AlarmName: alarmName,
    ComparisonOperator: "GreaterThanThreshold",
    EvaluationPeriods: 2,
    DatapointsToAlarm: 2,
    MetricName: "ApproximateAgeOfOldestMessage",
    Namespace: "AWS/SQS",
    Period: 300,
    Statistic: "Maximum",
    Threshold: thresholdSeconds,
    TreatMissingData: "notBreaching",
    Dimensions: Match.arrayWith([
      Match.objectLike({
        Name: "QueueName",
        Value: Match.anyValue(),
      }),
    ]),
  });
}

function expectSqsVisibleMessagesAlarm(template: Template, alarmName: string) {
  template.hasResourceProperties("AWS::CloudWatch::Alarm", {
    AlarmName: alarmName,
    ComparisonOperator: "GreaterThanThreshold",
    EvaluationPeriods: 1,
    DatapointsToAlarm: 1,
    MetricName: "ApproximateNumberOfMessagesVisible",
    Namespace: "AWS/SQS",
    Period: 300,
    Statistic: "Maximum",
    Threshold: 0,
    TreatMissingData: "notBreaching",
    Dimensions: Match.arrayWith([
      Match.objectLike({
        Name: "QueueName",
        Value: Match.anyValue(),
      }),
    ]),
  });
}

describe("File Upload Stack", () => {
  test("should create proper resources when non-ephemeral", () => {
    const app = new App(commongAppArgs);
    const mockCoreStack = new Stack(app, "mockCore");

    const mockPrivateSubnets = ["subnet-private1", "subnet-private2"];
    const mockVpc = aws_ec2.Vpc.fromVpcAttributes(mockCoreStack, "mockVpc", {
      vpcId: "vpc-123456789",
      availabilityZones: ["us-east-1a", "us-east-1b"],
      publicSubnetIds: ["subnet-public1", "subnet-public2"],
      privateSubnetIds: mockPrivateSubnets,
    });

    const fileUploadStack = new FileUploadStack(app, "mockFileUpload", {
      ...mockCommonProps,
      env: {
        region: "us-east-1",
        account: "0123456789",
      },
      vpc: mockVpc,
    });

    const template = Template.fromStack(fileUploadStack);
    template.hasResourceProperties("AWS::S3::Bucket", {
      Tags: Match.arrayWith([
        {
          Key: "AWS_Backup",
          Value: "d15_w90",
        },
      ]),
    });

    template.resourceCountIs("AWS::S3::Bucket", 7)
    template.resourceCountIs("AWS::CloudWatch::Alarm", 16);

    expectLambdaErrorsAlarm(
      template,
      "demos-unittest-file-process-lambda-errors",
      "fileProcess"
    );
    expectLambdaErrorsAlarm(
      template,
      "demos-unittest-delete-infected-file-lambda-errors",
      "deleteInfectedFile"
    );
    expectLambdaErrorsAlarm(
      template,
      "demos-unittest-uipath-lambda-errors",
      "uipath"
    );
    expectLambdaErrorsAlarm(
      template,
      "demos-unittest-budget-neutrality-lambda-errors",
      "budgetNeutrality"
    );
    expectLambdaDurationAlarm(
      template,
      "demos-unittest-file-process-lambda-duration-near-timeout",
      "fileProcess",
      24000
    );
    expectLambdaDurationAlarm(
      template,
      "demos-unittest-delete-infected-file-lambda-duration-near-timeout",
      "deleteInfectedFile",
      24000
    );
    expectLambdaDurationAlarm(
      template,
      "demos-unittest-budget-neutrality-lambda-duration-near-timeout",
      "budgetNeutrality",
      48000
    );
    expectLambdaThrottlesAlarm(
      template,
      "demos-unittest-file-process-lambda-throttles",
      "fileProcess"
    );
    expectLambdaThrottlesAlarm(
      template,
      "demos-unittest-delete-infected-file-lambda-throttles",
      "deleteInfectedFile"
    );
    expectLambdaThrottlesAlarm(
      template,
      "demos-unittest-uipath-lambda-throttles",
      "uipath"
    );
    expectLambdaThrottlesAlarm(
      template,
      "demos-unittest-budget-neutrality-lambda-throttles",
      "budgetNeutrality"
    );
    template.resourcePropertiesCountIs(
      "AWS::CloudWatch::Alarm",
      {
        AlarmName: "demos-unittest-uipath-lambda-duration-near-timeout",
      },
      0
    );
    expectSqsOldestMessageAgeAlarm(
      template,
      "demos-unittest-file-upload-queue-oldest-message-age-high",
      900
    );
    expectSqsOldestMessageAgeAlarm(
      template,
      "demos-unittest-delete-infected-file-queue-oldest-message-age-high",
      3600
    );
    expectSqsOldestMessageAgeAlarm(
      template,
      "demos-unittest-uipath-queue-oldest-message-age-high",
      3600
    );
    expectSqsOldestMessageAgeAlarm(
      template,
      "demos-unittest-budget-neutrality-queue-oldest-message-age-high",
      900
    );
    expectSqsVisibleMessagesAlarm(
      template,
      "demos-unittest-file-workflow-dlq-visible-messages"
    );

  });

  test("should create proper resources when ephemeral", () => {
    const app = new App(commongAppArgs);
    const mockCoreStack = new Stack(app, "mockCore");

    const mockPrivateSubnets = ["subnet-private1", "subnet-private2"];
    const mockVpc = aws_ec2.Vpc.fromVpcAttributes(mockCoreStack, "mockVpc", {
      vpcId: "vpc-123456789",
      availabilityZones: ["us-east-1a", "us-east-1b"],
      publicSubnetIds: ["subnet-public1", "subnet-public2"],
      privateSubnetIds: mockPrivateSubnets,
    });

    const fileUploadStack = new FileUploadStack(app, "mockFileUpload", {
      ...mockCommonProps,
      isEphemeral: true,
      env: {
        region: "us-east-1",
        account: "0123456789",
      },
      vpc: mockVpc,
    });

    const template = Template.fromStack(fileUploadStack);
    template.resourcePropertiesCountIs(
      "AWS::S3::Bucket",
      {
        Tags: Match.arrayWith([
          {
            Key: "AWS_Backup",
            Value: "d15_w90",
          },
        ]),
      },
      0,
    );
  });
});
