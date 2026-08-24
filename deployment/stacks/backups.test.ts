import { App, aws_ec2, Stack } from "aws-cdk-lib";
import { DeploymentConfigProperties } from "../config";
import * as backups from "./backups"
import { Template } from "aws-cdk-lib/assertions";
import { BUNDLING_STACKS } from "aws-cdk-lib/cx-api";


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

describe("Backups Stack", () => {
  test("should create proper resources when used", () => {
    const app = new App(commongAppArgs);
    const mockCoreStack = new Stack(app, "mockCore");

    const mockPrivateSubnets = ["subnet-private1", "subnet-private2"];
    const mockVpc = aws_ec2.Vpc.fromVpcAttributes(mockCoreStack, "mockVpc", {
      vpcId: "vpc-123456789",
      availabilityZones: ["us-east-1a", "us-east-1b"],
      publicSubnetIds: ["subnet-public1", "subnet-public2"],
      privateSubnetIds: mockPrivateSubnets,
    });

    const backupsStack = new backups.BackupStack(app, "mockApi", {
          ...mockCommonProps,
          env: {
            region: "us-east-1",
            account: "0123456789",
          },
          vpc: mockVpc,
        });

    const template = Template.fromStack(backupsStack);
    template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
    template.resourceCountIs("AWS::Backup::RestoreTestingPlan", 1);
    template.resourceCountIs("AWS::Backup::RestoreTestingSelection", 2);
    template.resourceCountIs("AWS::Lambda::Function", 1);
  })

})
