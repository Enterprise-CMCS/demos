import { App, aws_ec2, Stack } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { ApiStack } from "./api";
import { DeploymentConfigProperties } from "../config";
import { BUNDLING_STACKS } from "aws-cdk-lib/cx-api";

const commongAppArgs = {
      context: {
        [BUNDLING_STACKS]: []
      }
    }

const mockCommonProps: DeploymentConfigProperties = {
  project: "demos",
  isDev: true,
  isLocalstack: false,
  isEphemeral: false,
  stage: "unittest",
  zScalerIps: ["0.1.2.3"],
  hostEnvironment: "unitTestHost" as "dev",
  cloudfrontHost: "unittest.demos.com",
};

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
    template.resourceCountIs("AWS::EC2::SecurityGroup", 2);
    template.resourceCountIs("AWS::Lambda::Function", 2);
    template.resourceCountIs("AWS::ApiGateway::RestApi", 1);
    template.resourceCountIs("AWS::ApiGateway::Authorizer", 1);

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
    });

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
});
