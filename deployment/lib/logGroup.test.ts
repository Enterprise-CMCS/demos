import { App, aws_lambda, Stack } from "aws-cdk-lib";
import { DemosLogGroup } from "./logGroup";
import { Match, Template } from "aws-cdk-lib/assertions";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

describe("DemosLogGroup", () => { 
  test("should create log group with proper retention and splunk subscription", () => {
    const app = new App()
    const stack = new Stack(app, "TestStack")

    const id = "TestLogGroup"

    new DemosLogGroup(stack, id, {
      name: "test/group",
      isEphemeral: false,
      stage: "unittest"
    })

    const template = Template.fromStack(stack)

    template.resourceCountIs("AWS::Logs::LogGroup", 1)
    template.resourceCountIs("AWS::Logs::SubscriptionFilter", 1)

    template.hasResourceProperties("AWS::Logs::LogGroup", {
      LogGroupName: "/demos/unittest/test/group",
      RetentionInDays: RetentionDays.THREE_MONTHS
    })

    template.hasResourceProperties("AWS::Logs::SubscriptionFilter", {
      DestinationArn: Match.anyValue(),
      FilterName: "logs-to-cms-splunk",
      LogGroupName: Match.objectLike({
        Ref: Match.stringLikeRegexp(id)
      })
    })
  });

  test("should create a log group with the full name overridden", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack")

    const id = "TestLogGroup"
    const fullName = "test-log-group"

    new DemosLogGroup(stack, id, {
      overrideFullName: fullName,
      isEphemeral: false,
    })
    
    const template = Template.fromStack(stack)

    template.hasResourceProperties("AWS::Logs::LogGroup", {
      LogGroupName: fullName
    })
  })

  test("should set lower retention period when ephemeral", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack")

    const id = "TestLogGroup"

    new DemosLogGroup(stack, id, {
      name: "test",
      stage: "unittest",
      isEphemeral: true
    })
    
    const template = Template.fromStack(stack)

    template.hasResourceProperties("AWS::Logs::LogGroup", {
      RetentionInDays: RetentionDays.ONE_WEEK
    })
  })

  test("should throw an error when neither name property is specified", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack")

    const id = "TestLogGroup"

    
    expect(() => {
      new DemosLogGroup(stack, id, {
        isEphemeral: true
      })
    }).toThrow("you must specify `name` or `overrideFullName` for the log group")
  })

  test("should throw an error when name is specified but not stage", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack")

    const id = "TestLogGroup"

    
    expect(() => {
      new DemosLogGroup(stack, id, {
        name: "test",
        isEphemeral: true
      })
    }).toThrow("you must specify the `stage` property")
  })

  test("should reuse subscription lambda when multiple log groups are created within a stack", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack")

    const spy = jest.spyOn(aws_lambda.Function, "fromFunctionName")

    new DemosLogGroup(stack, "TestLogGroup", {
      name: "test",
      isEphemeral: true,
      stage: "unittest"
    })
    
    new DemosLogGroup(stack, "TestLogGroupTwo", {
      name: "test-two",
      isEphemeral: true,
      stage: "unittest"
    })

    expect(spy).toHaveBeenCalledTimes(1);

  })
})
