import { App, aws_ec2, Stack } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { DatabaseStack } from "./database";
import { DeploymentConfigProperties } from "../config";

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

function expectRdsAlarm(
  template: Template,
  props: {
    alarmName: string;
    metricName: string;
    comparisonOperator: string;
    threshold: number;
    evaluationPeriods?: number;
    datapointsToAlarm?: number;
  }
) {
  template.hasResourceProperties("AWS::CloudWatch::Alarm", {
    AlarmName: props.alarmName,
    ComparisonOperator: props.comparisonOperator,
    EvaluationPeriods: props.evaluationPeriods ?? 2,
    DatapointsToAlarm: props.datapointsToAlarm ?? 2,
    MetricName: props.metricName,
    Namespace: "AWS/RDS",
    Period: 300,
    Statistic: "Average",
    Threshold: props.threshold,
    TreatMissingData: "notBreaching",
    Dimensions: Match.arrayWith([
      Match.objectLike({
        Name: "DBInstanceIdentifier",
        Value: Match.anyValue(),
      }),
    ]),
  });
}

describe("Database Stack", () => {
  test("should create proper resources when non-ephemeral", () => {
    const app = new App();
    const mockCoreStack = new Stack(app, "mockCore");

    const mockPrivateSubnets = ["subnet-private1", "subnet-private2"];
    const mockVpc = aws_ec2.Vpc.fromVpcAttributes(mockCoreStack, "mockVpc", {
      vpcId: "vpc-123456789",
      availabilityZones: ["us-east-1a", "us-east-1b"],
      publicSubnetIds: ["subnet-public1", "subnet-public2"],
      privateSubnetIds: mockPrivateSubnets,
    });

    const mockSecurityGroupId = "sg-1234abcd";
    const mockSecurityGroup = aws_ec2.SecurityGroup.fromSecurityGroupId(
      mockCoreStack,
      "mockSecurityGroup",
      mockSecurityGroupId,
    );

    const databaseStack = new DatabaseStack(app, "mockDatabase", {
      ...mockCommonProps,
      env: {
        region: "us-east-1",
        account: "0123456789",
      },
      vpc: mockVpc,
      cloudVpnSecurityGroup: mockSecurityGroup,
      secretsManagerVpceSg: mockSecurityGroup,
    });

    const template = Template.fromStack(databaseStack);

    template.resourceCountIs("AWS::EC2::SecurityGroup", 2);
    template.resourceCountIs("AWS::RDS::DBInstance", 1);
    template.resourceCountIs("AWS::KMS::Key", 1);
    template.resourceCountIs("AWS::CloudWatch::Alarm", 7);

    template.hasResource("AWS::RDS::DBInstance", {
      DeletionPolicy: "Delete",
    });

    template.hasResourceProperties("AWS::RDS::DBInstance", {
      Engine: "postgres",
      DBInstanceClass: "db.t4g.micro",
    });

    expectRdsAlarm(template, {
      alarmName: "demos-unittest-rds-free-storage-space-low",
      metricName: "FreeStorageSpace",
      comparisonOperator: "LessThanThreshold",
      threshold: 5368709120,
    });
    expectRdsAlarm(template, {
      alarmName: "demos-unittest-rds-cpu-utilization-high",
      metricName: "CPUUtilization",
      comparisonOperator: "GreaterThanThreshold",
      threshold: 80,
      evaluationPeriods: 3,
      datapointsToAlarm: 3,
    });
    expectRdsAlarm(template, {
      alarmName: "demos-unittest-rds-database-connections-high",
      metricName: "DatabaseConnections",
      comparisonOperator: "GreaterThanThreshold",
      threshold: 80,
    });
    expectRdsAlarm(template, {
      alarmName: "demos-unittest-rds-freeable-memory-low",
      metricName: "FreeableMemory",
      comparisonOperator: "LessThanThreshold",
      threshold: 134217728,
    });
    expectRdsAlarm(template, {
      alarmName: "demos-unittest-rds-read-latency-high",
      metricName: "ReadLatency",
      comparisonOperator: "GreaterThanThreshold",
      threshold: 0.1,
    });
    expectRdsAlarm(template, {
      alarmName: "demos-unittest-rds-write-latency-high",
      metricName: "WriteLatency",
      comparisonOperator: "GreaterThanThreshold",
      threshold: 0.1,
    });
    expectRdsAlarm(template, {
      alarmName: "demos-unittest-rds-disk-queue-depth-high",
      metricName: "DiskQueueDepth",
      comparisonOperator: "GreaterThanThreshold",
      threshold: 5,
    });

    template.hasOutput("dbHost", {
      Export: {
        Name: "demos-unittest-rds-hostname",
      },
    });

    template.hasOutput("dbPort", {
      Export: {
        Name: "demos-unittest-rds-port",
      },
    });
  });

  test("should retain rds for impl/prod", () => {
    const app = new App();
    const mockCoreStack = new Stack(app, "mockCore");

    const mockPrivateSubnets = ["subnet-private1", "subnet-private2"];
    const mockVpc = aws_ec2.Vpc.fromVpcAttributes(mockCoreStack, "mockVpc", {
      vpcId: "vpc-123456789",
      availabilityZones: ["us-east-1a", "us-east-1b"],
      publicSubnetIds: ["subnet-public1", "subnet-public2"],
      privateSubnetIds: mockPrivateSubnets,
    });

    const mockSecurityGroupId = "sg-1234abcd";
    const mockSecurityGroup = aws_ec2.SecurityGroup.fromSecurityGroupId(
      mockCoreStack,
      "mockSecurityGroup",
      mockSecurityGroupId,
    );

    const databaseStack = new DatabaseStack(app, "mockDatabase", {
      ...mockCommonProps,
      stage: "prod",
      env: {
        region: "us-east-1",
        account: "0123456789",
      },
      vpc: mockVpc,
      cloudVpnSecurityGroup: mockSecurityGroup,
      secretsManagerVpceSg: mockSecurityGroup,
    });

    const template = Template.fromStack(databaseStack);

    template.resourceCountIs("AWS::RDS::DBInstance", 1);
    template.hasResource("AWS::RDS::DBInstance", {
      DeletionPolicy: "Retain",
    });
    template.resourceCountIs("AWS::Logs::SubscriptionFilter", 2);
    console.log(JSON.stringify(template.toJSON(), null, 2));
    template.hasResourceProperties("AWS::Logs::SubscriptionFilter", {
      LogGroupName: Match.objectLike({
        "Fn::Join": Match.arrayWith(["", Match.arrayWith(["/upgrade"])]),
      }),
    });

    template.hasResourceProperties("AWS::Logs::SubscriptionFilter", {
      LogGroupName: Match.objectLike({
        "Fn::Join": Match.arrayWith(["", Match.arrayWith(["/postgresql"])]),
      }),
    });
  });
});
