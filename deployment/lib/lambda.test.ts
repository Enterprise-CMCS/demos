import { App, aws_apigateway, aws_codedeploy, aws_ec2, Duration, Stack } from "aws-cdk-lib";
import { create } from "./lambda";
import { Match, Template } from "aws-cdk-lib/assertions";
import { Construct } from "constructs";

const mockCommonProps = {
  project: "demos",
  isDev: true,
  isLocalstack: false,
  isEphemeral: false,
  stage: "unittest",
  zScalerIps: ["0.1.2.3"],
  cloudfrontHost: "unittest.demos.com",
};

describe("lambda", () => {
  test("should create a basic lambda function and role", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");

    create(
      {
        ...mockCommonProps,
        scope: stack,
        handler: "mockLambda.handler",
        entry: "lib/mockLambda.js",
        timeout: Duration.minutes(10),
        memorySize: 1000,
      },
      "unit-test-lambda"
    );

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "demos-unittest-unit-test-lambda",
      Handler: "mockLambda.handler",
      Timeout: 600,
      MemorySize: 1000,
    });

    template.hasResourceProperties("AWS::Logs::LogGroup", {
      LogGroupName: "/demos/unittest/lambda/unit-test-lambda",
    });

    template.hasResourceProperties("AWS::IAM::Role", {
      Policies: Match.arrayWith([
        Match.objectLike({
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: Match.arrayEquals(["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]),
              }),
              Match.objectLike({
                Action: Match.arrayEquals([
                  "ec2:CreateNetworkInterface",
                  "ec2:DescribeNetworkInterfaces",
                  "ec2:DescribeSubnets",
                  "ec2:DeleteNetworkInterface",
                  "ec2:AssignPrivateIpAddresses",
                  "ec2:UnassignPrivateIpAddresses",
                ]),
              }),
            ]),
          },
        }),
      ]),
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      Code: Match.objectLike({
        S3Key: Match.stringLikeRegexp("(.*).zip"),
      }),
    });
  });

  test("should create a VPC connected lambda function and role", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");

    const mockPrivateSubnets = ["subnet-private1", "subnet-private2"];
    const mockVpc = aws_ec2.Vpc.fromVpcAttributes(stack, "mockVpc", {
      vpcId: "vpc-123456789",
      availabilityZones: ["us-east-1a", "us-east-1b"],
      publicSubnetIds: ["subnet-public1", "subnet-public2"],
      privateSubnetIds: mockPrivateSubnets,
    });

    create(
      {
        ...mockCommonProps,
        scope: stack,
        handler: "mockLambda.handler",
        entry: "lib/mockLambda.js",
        vpc: mockVpc,
      },
      "unit-test-lambda"
    );

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::Lambda::Function", {
      VpcConfig: Match.objectLike({
        SubnetIds: Match.arrayEquals(mockPrivateSubnets),
      }),
    });
  });

  test("should create a VPC connected lambda function with security group", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");

    const mockPrivateSubnets = ["subnet-private1", "subnet-private2"];
    const mockVpc = aws_ec2.Vpc.fromVpcAttributes(stack, "mockVpc", {
      vpcId: "vpc-123456789",
      availabilityZones: ["us-east-1a", "us-east-1b"],
      publicSubnetIds: ["subnet-public1", "subnet-public2"],
      privateSubnetIds: mockPrivateSubnets,
    });

    const mockSecurityGroupId = "sg-1234abcd";
    const mockSecurityGroup = aws_ec2.SecurityGroup.fromSecurityGroupId(
      stack,
      "mockSecurityGroup",
      mockSecurityGroupId
    );

    create(
      {
        ...mockCommonProps,
        scope: stack,
        handler: "mockLambda.handler",
        entry: "lib/mockLambda.js",
        vpc: mockVpc,
        securityGroup: mockSecurityGroup,
      },
      "unit-test-lambda"
    );

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::Lambda::Function", {
      VpcConfig: Match.objectLike({
        SubnetIds: Match.arrayEquals(mockPrivateSubnets),
        SecurityGroupIds: [mockSecurityGroupId],
      }),
    });
  });

  test("should create a lambda with an alias and canary deploy", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");

    create(
      {
        ...mockCommonProps,
        scope: stack,
        handler: "mockLambda.handler",
        entry: "lib/mockLambda.js",
        useAlias: true,
        deploymentConfig: aws_codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
      },
      "unit-test-lambda"
    );

    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::Lambda::Alias", 1);
    template.hasResourceProperties("AWS::CodeDeploy::DeploymentGroup", {
      DeploymentConfigName: "CodeDeployDefault.LambdaCanary10Percent5Minutes",
    });
  });

  test("should create a lambda with an api gateway trigger and authorizer", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");

    class MockAuthorizer extends aws_apigateway.Authorizer {
      authorizerId: string;

      constructor(scope: Construct, id: string) {
        super(scope, id, {});
        this.authorizerId = id;
      }

      public _attachToApi(): void {
        return;
      }
    }

    const mockAuthorizerId = "testAuthorizer";
    const mockAuth = new MockAuthorizer(stack, mockAuthorizerId);

    create(
      {
        ...mockCommonProps,
        scope: stack,
        handler: "mockLambda.handler",
        entry: "lib/mockLambda.js",
        apiParentResource: aws_apigateway.Resource.fromResourceAttributes(stack, "mockApiResource", {
          resourceId: "res-123345",
          path: "/api",
          restApi: aws_apigateway.RestApi.fromRestApiAttributes(stack, "MockApi", {
            restApiId: "api-123456",
            rootResourceId: "root-123abc",
          }),
        }),
        path: "endpoint",
        method: "GET",
        authorizationType: aws_apigateway.AuthorizationType.CUSTOM,
        authorizer: mockAuth,
      },
      "unit-test-lambda"
    );

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ApiGateway::Method", {
      HttpMethod: "GET",
      Integration: Match.objectLike({ IntegrationHttpMethod: "POST" }),
      AuthorizationType: "CUSTOM",
      AuthorizerId: mockAuthorizerId,
    });
  });

  test("should create a lambda with an api gateway trigger targeting alias", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");

    create(
      {
        ...mockCommonProps,
        scope: stack,
        handler: "mockLambda.handler",
        entry: "lib/mockLambda.js",
        apiParentResource: aws_apigateway.Resource.fromResourceAttributes(stack, "mockApiResource", {
          resourceId: "res-123345",
          path: "/api",
          restApi: aws_apigateway.RestApi.fromRestApiAttributes(stack, "MockApi", {
            restApiId: "api-123456",
            rootResourceId: "root-123abc",
          }),
        }),
        path: "endpoint",
        method: "POST",
        useAlias: true,
        isLocalstack: true,
      },
      "unit-test-lambda"
    );

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ApiGateway::Method", {
      HttpMethod: "POST",
      Integration: Match.objectLike({
        IntegrationHttpMethod: "POST",
        Uri: Match.objectLike({
          "Fn::Join": [
            "",
            Match.arrayWith([Match.objectLike({ Ref: Match.stringLikeRegexp("unittestlambdaunittestlambdaalias") })]), // asserts the alias is used
          ],
        }),
      }),
    });
  });

  test("should create a lambda defined by directory rather than a single file", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");

    create(
      {
        ...mockCommonProps,
        scope: stack,
        handler: "mockLambda.handler",
        entry: "lib/",
        asCode: true,
      },
      "unit-test-lambda"
    );

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::Lambda::Function", {
      Code: Match.objectLike({
        S3Key: Match.stringLikeRegexp("(.*).zip"),
      }),
    });
  });
});
