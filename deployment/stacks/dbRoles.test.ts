import { App, aws_ec2, Stack } from "aws-cdk-lib";
import { DBRoleStack } from "./dbRoles";
import { Template } from "aws-cdk-lib/assertions";
import { DeploymentConfigProperties } from "../config";
import { dev } from "../databaseRoles";
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
};

const commongAppArgs = {
      context: {
        [BUNDLING_STACKS]: []
      }
    }

describe("DB Roles Stack", () => {
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

    const dbRoleStack = new DBRoleStack(app, "mockDBRole", {
      ...mockCommonProps,
      env: {
        region: "us-east-1",
        account: "0123456789",
      },
      vpc: mockVpc,
    });

    const template = Template.fromStack(dbRoleStack);
    template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
    template.resourceCountIs("AWS::Lambda::Function", 2); // second lambda is managed by CDK internally
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: `demos-${mockCommonProps.stage}-dbRoleManagement`,
    });

    template.resourceCountIs("AWS::CloudFormation::CustomResource", 1);
    template.hasResourceProperties("AWS::CloudFormation::CustomResource", {
      roles: dev,
    });
  });
});
