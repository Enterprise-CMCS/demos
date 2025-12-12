import { App, RemovalPolicy, Stack } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { UiPathProcessor } from "./uipathProcessor";
import { DeploymentConfigProperties } from "../config";
import { BUNDLING_STACKS } from "aws-cdk-lib/cx-api";

const mockProps: DeploymentConfigProperties = {
  project: "demos",
  isDev: true,
  isLocalstack: false,
  isEphemeral: false,
  stage: "unittest",
  zScalerIps: ["0.0.0.0"],
  hostEnvironment: "dev",
  cloudfrontHost: "unittest.demos.com",
  srrConfigured: false,
};

describe("UiPathProcessor construct", () => {
  it("synthesizes queue, DLQ, and lambda", () => {
    const app = new App({
      context: {
        // 👇 Disable bundling for ALL stacks in this test run
        [BUNDLING_STACKS]: [],
      },
    });

    const stack = new Stack(app, "uiPathProcessorTest");

    new UiPathProcessor(stack, "UiPathProcessor", {
      ...mockProps,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SQS::Queue", 2);
    template.resourceCountIs("AWS::Lambda::Function", 1);
    template.hasResourceProperties(
      "AWS::Lambda::Function",
      Match.objectLike({})
    );
  });
});
