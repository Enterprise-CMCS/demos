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
};
const commongAppArgs = {
      context: {
        [BUNDLING_STACKS]: []
      }
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
      0
    );
  });
});
