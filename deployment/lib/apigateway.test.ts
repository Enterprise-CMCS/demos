import { App, Stack } from "aws-cdk-lib";
import { create } from "./apigateway";
import { Match, Template } from "aws-cdk-lib/assertions";

const mockCommonProps = {
  project: "demos",
  isDev: true,
  isLocalstack: false,
  isEphemeral: false,
  stage: "unittest",
  zScalerIps: ["0.1.2.3"],
  cloudfrontHost: "unittest.demos.com",
};

describe("ApiGateway", () => {
  test("should create a basic api gateway", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");

    create({
      ...mockCommonProps,
      scope: stack,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::ApiGateway::RestApi", 1);
    template.resourceCountIs("AWS::ApiGateway::Stage", 1);
    template.resourceCountIs("AWS::ApiGateway::Deployment", 1);
    template.resourceCountIs("AWS::Logs::LogGroup", 1);

    template.hasResourceProperties("AWS::ApiGateway::RestApi", {
      Name: "demos-unittest-api",
    });

    template.hasResourceProperties("AWS::ApiGateway::Stage", {
      StageName: mockCommonProps.stage,
    });

    template.hasResourceProperties("AWS::ApiGateway::Method", {
      HttpMethod: "GET",
      Integration: {
        Type: "MOCK",
      },
    });

    template.hasResourceProperties("AWS::ApiGateway::Resource", {
      PathPart: "api",
      ParentId: {
        "Fn::GetAtt": Match.arrayWith(["RootResourceId"]),
      },
    });
  });
});
