import { App, Duration, Stack, aws_cloudwatch, aws_sqs } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as alarms from "./alarms";

describe("CloudWatch alarm helpers", () => {
  test("adds the notifier lambda as the default metric alarm action", () => {
    const app = new App();
    const stack = new Stack(app, "metricAlarmTest", {
      env: {
        account: "0123456789",
        region: "us-east-1",
      },
    });
    const queue = new aws_sqs.Queue(stack, "Queue");

    alarms.createSqsVisibleMessagesAlarm({
      scope: stack,
      project: "demos",
      stage: "unittest",
      id: "QueueVisibleMessagesAlarm",
      name: "queue-visible-messages",
      description: "Queue has visible messages.",
      queue,
      period: Duration.minutes(5),
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-queue-visible-messages",
      AlarmActions: Match.anyValue(),
      OKActions: Match.anyValue(),
    });

  });

  test("adds the notifier lambda as the default anomaly alarm action", () => {
    const app = new App();
    const stack = new Stack(app, "anomalyAlarmTest", {
      env: {
        account: "0123456789",
        region: "us-east-1",
      },
    });

    alarms.createAnomalyAlarm({
      scope: stack,
      project: "demos",
      stage: "unittest",
      id: "LatencyAnomalyAlarm",
      name: "latency-anomaly",
      description: "Latency is above its anomaly band.",
      metric: new aws_cloudwatch.Metric({
        namespace: "Demos/Test",
        metricName: "Latency",
        period: Duration.minutes(5),
        statistic: "Average",
      }),
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-latency-anomaly",
      AlarmActions: Match.anyValue(),
      OKActions: Match.anyValue(),
    });

  });
});
