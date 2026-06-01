import { App, aws_ec2, Stack, RemovalPolicy } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { ApiStack } from "./api";
import { DeploymentConfigProperties } from "../config";
import { BUNDLING_STACKS } from "aws-cdk-lib/cx-api";
import { UiPathProcessor } from "../lib/uipathProcessor";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Key } from "aws-cdk-lib/aws-kms";

const commongAppArgs = {
  context: {
    [BUNDLING_STACKS]: [],
  },
};

const mockCommonProps: DeploymentConfigProperties = {
  project: "demos",
  isDev: true,
  isLocalstack: false,
  isEphemeral: false,
  stage: "unittest",
  zScalerIps: ["0.1.2.3"],
  hostEnvironment: "unitTestHost" as "dev",
  cloudfrontHost: "unittest.demos.com",
  srrConfigured: true,
  dataConnectRoleArn: "arn:aws:iam::1234567890:role/dataconnectrole",
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

describe("Api Stack", () => {
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

    // const mockSecurityGroupId = "sg-1234abcd";
    // const mockSecurityGroup = aws_ec2.SecurityGroup.fromSecurityGroupId(
    //   mockCoreStack,
    //   "mockSecurityGroup",
    //   mockSecurityGroupId
    // );

    const apiStack = new ApiStack(app, "mockApi", {
      ...mockCommonProps,
      env: {
        region: "us-east-1",
        account: "0123456789",
      },
      vpc: mockVpc,
    });

    const template = Template.fromStack(apiStack);
    // const fs = require("fs");
    // fs.writeFileSync("template.json", JSON.stringify(template.toJSON(), null, 2));
    template.resourceCountIs("AWS::EC2::SecurityGroup", 3);
    template.resourceCountIs("AWS::Lambda::Function", 3);
    template.resourceCountIs("AWS::ApiGateway::RestApi", 1);
    template.resourceCountIs("AWS::ApiGateway::Authorizer", 1);
    template.resourceCountIs("AWS::CloudWatch::Alarm", 10);

    template.hasOutput("ApiUrl", {
      Export: {
        Name: "unittestApiGWUrl",
      },
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "demos-unittest-graphql",
    });
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "demos-unittest-authorizer",
      Timeout: 10,
    });
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "demos-unittest-emailer",
    });

    expectLambdaErrorsAlarm(
      template,
      "demos-unittest-authorizer-lambda-errors",
      "authorizer"
    );
    expectLambdaErrorsAlarm(
      template,
      "demos-unittest-graphql-lambda-errors",
      "graphql"
    );
    expectLambdaErrorsAlarm(
      template,
      "demos-unittest-emailer-lambda-errors",
      "emailer"
    );
    expectLambdaDurationAlarm(
      template,
      "demos-unittest-authorizer-lambda-duration-near-timeout",
      "authorizer",
      8000
    );
    expectLambdaDurationAlarm(
      template,
      "demos-unittest-emailer-lambda-duration-near-timeout",
      "emailer",
      48000
    );
    expectLambdaThrottlesAlarm(
      template,
      "demos-unittest-authorizer-lambda-throttles",
      "authorizer"
    );
    expectLambdaThrottlesAlarm(
      template,
      "demos-unittest-graphql-lambda-throttles",
      "graphql"
    );
    expectLambdaThrottlesAlarm(
      template,
      "demos-unittest-emailer-lambda-throttles",
      "emailer"
    );
    template.resourcePropertiesCountIs(
      "AWS::CloudWatch::Alarm",
      {
        AlarmName: "demos-unittest-graphql-lambda-duration-near-timeout",
      },
      0
    );
    expectSqsOldestMessageAgeAlarm(
      template,
      "demos-unittest-emailer-queue-oldest-message-age-high",
      900
    );
    expectSqsVisibleMessagesAlarm(
      template,
      "demos-unittest-emailer-dlq-visible-messages"
    );

    template.hasResourceProperties("AWS::EC2::SecurityGroupEgress", {
      GroupId: Match.objectEquals({
        "Fn::GetAtt": Match.arrayWith([Match.stringLikeRegexp("graphqlSecurityGroup(.*)")]),
      }),
      ToPort: Match.objectEquals({
        "Fn::ImportValue": "demos-unitTestHost-rds-port",
      }),
    });

    template.hasResourceProperties("AWS::EC2::SecurityGroup", {
      SecurityGroupEgress: Match.arrayWith([
        Match.objectLike({
          DestinationSecurityGroupId: Match.objectEquals({
            "Fn::ImportValue": "unittestSecretsManagerVpceSg",
          }),
        }),
      ]),
    });
  });

  test("UiPathProcessor construct synthesizes queue, DLQ, and lambda", () => {
    const app = new App(commongAppArgs);
    const stack = new Stack(app, "uipathTest", {
      env: { account: "0123456789", region: "us-east-1" },
    });

    new UiPathProcessor(stack, "UiPathProcessor", {
      ...mockCommonProps,
      removalPolicy: RemovalPolicy.DESTROY,
      documentsBucket: new Bucket(stack, "UiPathDocumentsBucket"),
      kmsKey: new Key(stack, "UiPathKmsKey"),
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::SQS::Queue", 2); // queue + DLQ
    template.resourceCountIs("AWS::Lambda::Function", 1);
  });
});
