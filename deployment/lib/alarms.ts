import {
  Duration,
  aws_cloudfront,
  aws_cloudwatch,
  aws_lambda,
  aws_rds,
  aws_sqs,
} from "aws-cdk-lib";
import type { IAlarmAction } from "aws-cdk-lib/aws-cloudwatch";
import { Construct } from "constructs";

export interface DemosAlarmBaseProps {
  scope: Construct;
  project: string;
  stage: string;
  id: string;
  name: string;
  description: string;
  evaluationPeriods: number;
  datapointsToAlarm?: number;
  treatMissingData?: aws_cloudwatch.TreatMissingData;
  alarmActions?: IAlarmAction[];
}

export interface DemosMetricAlarmProps extends DemosAlarmBaseProps {
  metric: aws_cloudwatch.IMetric;
  threshold: number;
  comparisonOperator: aws_cloudwatch.ComparisonOperator;
}

export interface DemosAnomalyAlarmProps extends DemosAlarmBaseProps {
  metric: aws_cloudwatch.IMetric;
  comparisonOperator?: aws_cloudwatch.ComparisonOperator;
  stdDevs?: number;
}

export interface DemosLambdaErrorsAlarmProps extends DemosAlarmBaseProps {
  lambdaFunction: aws_lambda.IFunction;
  period: Duration;
  threshold: number;
}

export interface DemosLambdaDurationAlarmProps extends DemosAlarmBaseProps {
  lambdaFunction: aws_lambda.IFunction;
  period: Duration;
  threshold: Duration;
}

export interface DemosLambdaThrottlesAlarmProps extends DemosAlarmBaseProps {
  lambdaFunction: aws_lambda.IFunction;
  period: Duration;
  threshold: number;
}

export interface DemosSqsOldestMessageAgeAlarmProps extends DemosAlarmBaseProps {
  queue: aws_sqs.IQueue;
  period: Duration;
  threshold: Duration;
}

export interface DemosSqsVisibleMessagesAlarmProps extends DemosAlarmBaseProps {
  queue: aws_sqs.IQueue;
  period: Duration;
  threshold: number;
}

export class CloudWatchAlarmRegistry {
  private readonly lambdaFunctions = new Map<string, aws_lambda.IFunction>();
  private readonly queues = new Map<string, aws_sqs.IQueue>();
  private readonly distributions = new Map<string, aws_cloudfront.Distribution>();
  private readonly databaseInstances = new Map<string, aws_rds.DatabaseInstance>();

  registerLambda<T extends aws_lambda.IFunction>(id: string, lambdaFunction: T): T {
    this.lambdaFunctions.set(id, lambdaFunction);
    return lambdaFunction;
  }

  lambda(id: string): aws_lambda.IFunction {
    return this.get(this.lambdaFunctions, "Lambda function", id);
  }

  registerQueue<T extends aws_sqs.IQueue>(id: string, queue: T): T {
    this.queues.set(id, queue);
    return queue;
  }

  queue(id: string): aws_sqs.IQueue {
    return this.get(this.queues, "SQS queue", id);
  }

  registerDistribution<T extends aws_cloudfront.Distribution>(id: string, distribution: T): T {
    this.distributions.set(id, distribution);
    return distribution;
  }

  distribution(id: string): aws_cloudfront.Distribution {
    return this.get(this.distributions, "CloudFront distribution", id);
  }

  registerDatabaseInstance<T extends aws_rds.DatabaseInstance>(id: string, databaseInstance: T): T {
    this.databaseInstances.set(id, databaseInstance);
    return databaseInstance;
  }

  databaseInstance(id: string): aws_rds.DatabaseInstance {
    return this.get(this.databaseInstances, "RDS database instance", id);
  }

  private get<T>(resources: Map<string, T>, kind: string, id: string): T {
    const resource = resources.get(id);
    if (resource == null) {
      throw new Error(`${kind} "${id}" has not been registered for CloudWatch alarms.`);
    }

    return resource;
  }
}

function alarmName(props: Pick<DemosAlarmBaseProps, "project" | "stage" | "name">): string {
  return `${props.project}-${props.stage}-${props.name}`;
}

function alarmDescription(props: Pick<DemosAlarmBaseProps, "stage" | "description">): string {
  return `[${props.stage}] ${props.description}`;
}

export function createMetricAlarm(props: DemosMetricAlarmProps): aws_cloudwatch.Alarm {
  const alarm = new aws_cloudwatch.Alarm(props.scope, props.id, {
    alarmName: alarmName(props),
    alarmDescription: alarmDescription(props),
    metric: props.metric,
    threshold: props.threshold,
    comparisonOperator: props.comparisonOperator,
    evaluationPeriods: props.evaluationPeriods,
    datapointsToAlarm: props.datapointsToAlarm,
    treatMissingData: props.treatMissingData ?? aws_cloudwatch.TreatMissingData.NOT_BREACHING,
  });

  if (props.alarmActions) {
    alarm.addAlarmAction(...props.alarmActions);
  }

  return alarm;
}

export function createLambdaDurationAlarm(
  props: DemosLambdaDurationAlarmProps
): aws_cloudwatch.Alarm {
  const { lambdaFunction, period, threshold, ...alarmProps } = props;

  return createMetricAlarm({
    ...alarmProps,
    metric: lambdaFunction.metricDuration({
      period,
      statistic: "Maximum",
    }),
    threshold: threshold.toMilliseconds(),
    comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  });
}

export function createLambdaErrorsAlarm(
  props: DemosLambdaErrorsAlarmProps
): aws_cloudwatch.Alarm {
  const { lambdaFunction, period, threshold, ...alarmProps } = props;

  return createMetricAlarm({
    ...alarmProps,
    metric: lambdaFunction.metricErrors({
      period,
      statistic: "Sum",
    }),
    threshold,
    comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  });
}

export function createLambdaThrottlesAlarm(
  props: DemosLambdaThrottlesAlarmProps
): aws_cloudwatch.Alarm {
  const { lambdaFunction, period, threshold, ...alarmProps } = props;

  return createMetricAlarm({
    ...alarmProps,
    metric: lambdaFunction.metricThrottles({
      period,
      statistic: "Sum",
    }),
    threshold,
    comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  });
}

export function createSqsOldestMessageAgeAlarm(
  props: DemosSqsOldestMessageAgeAlarmProps
): aws_cloudwatch.Alarm {
  const { queue, period, threshold, ...alarmProps } = props;

  return createMetricAlarm({
    ...alarmProps,
    metric: queue.metricApproximateAgeOfOldestMessage({
      period,
      statistic: "Maximum",
    }),
    threshold: threshold.toSeconds(),
    comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  });
}

export function createSqsVisibleMessagesAlarm(
  props: DemosSqsVisibleMessagesAlarmProps
): aws_cloudwatch.Alarm {
  const { queue, period, threshold, ...alarmProps } = props;

  return createMetricAlarm({
    ...alarmProps,
    metric: queue.metricApproximateNumberOfMessagesVisible({
      period,
      statistic: "Maximum",
    }),
    threshold,
    comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  });
}

export function createAnomalyAlarm(
  props: DemosAnomalyAlarmProps
): aws_cloudwatch.AnomalyDetectionAlarm {
  const alarm = new aws_cloudwatch.AnomalyDetectionAlarm(props.scope, props.id, {
    alarmName: alarmName(props),
    alarmDescription: alarmDescription(props),
    metric: props.metric,
    comparisonOperator:
      props.comparisonOperator ?? aws_cloudwatch.ComparisonOperator.GREATER_THAN_UPPER_THRESHOLD,
    evaluationPeriods: props.evaluationPeriods,
    datapointsToAlarm: props.datapointsToAlarm,
    treatMissingData: props.treatMissingData ?? aws_cloudwatch.TreatMissingData.NOT_BREACHING,
    stdDevs: props.stdDevs,
  });

  if (props.alarmActions) {
    alarm.addAlarmAction(...props.alarmActions);
  }

  return alarm;
}
