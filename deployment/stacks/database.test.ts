import { App, aws_ec2, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { DatabaseStack } from "./database";

const mockCommonProps = {
  project: "demos",
  isDev: true,
  isLocalstack: false,
  isEphemeral: false,
  stage: "unittest",
  zScalerIps: ["0.1.2.3"],
  hostEnvironment: "dev",
  cloudfrontHost: "unittest.demos.com",
};

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
      mockSecurityGroupId
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

    template.hasResource("AWS::RDS::DBInstance", {
      DeletionPolicy: "Delete",
    });

    template.hasResourceProperties("AWS::RDS::DBInstance", {
      Engine: "postgres",
      DBInstanceClass: "db.t4g.micro",
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
      mockSecurityGroupId
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
  });
});
