import { aws_lambda, RemovalPolicy, Stack } from "aws-cdk-lib";
import { LogGroup, RetentionDays, SubscriptionFilter, FilterPattern } from "aws-cdk-lib/aws-logs";
import { LambdaDestination } from "aws-cdk-lib/aws-logs-destinations";
import { Construct } from "constructs";

interface DemosLogGroupProps {
  isEphemeral: boolean;
  name?: string;
  stage: string;
  overrideFullName?: string;
}

export class DemosLogGroup extends Construct {
  public readonly logGroup: LogGroup;

  constructor(scope: Construct, id: string, props: DemosLogGroupProps) {
    super(scope, id);

    if (!props.name && !props.overrideFullName) {
      throw new Error("you must specify `name` or `overrideFullName` for the log group")
    }

    this.logGroup = new LogGroup(this, "LogGroup", {
      logGroupName: props.overrideFullName ?? `/demos/${props.stage}/${props.name}`,
      retention: !props.isEphemeral ? RetentionDays.THREE_MONTHS : RetentionDays.ONE_WEEK,
      removalPolicy: !props.isEphemeral ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })


    new SubscriptionFilter(this, "SubscriptionFilter", {
      logGroup: this.logGroup,
      destination: new LambdaDestination(DemosLogGroup.getSubscriptionLambda(this)),
      filterPattern: FilterPattern.allEvents(),
      filterName: "logs-to-cms-splunk"
    })

  }

  private static getSubscriptionLambda(scope: Construct): aws_lambda.IFunction {
    const stack = Stack.of(scope);
    const id = "CMSCloudLoggingLambda";

    const existing = stack.node.tryFindChild(id)
    if (existing) {
      return existing as aws_lambda.IFunction
    }

    return aws_lambda.Function.fromFunctionName(stack, id, "cms-cloud-logging-cloudwatch-to-splunk")
  }
}
