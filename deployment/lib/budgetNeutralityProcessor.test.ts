import { App, RemovalPolicy, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { BudgetNeutralityProcessor } from "./budgetNeutralityProcessor";
import { DeploymentConfigProperties } from "../config";
import { BUNDLING_STACKS } from "aws-cdk-lib/cx-api";
import { Key } from "aws-cdk-lib/aws-kms";

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

describe("BudgetNeutralityProcessor construct", () => {
  it("synthesizes queue, DLQ, and lambda", () => {
    const app = new App({
      context: {
        [BUNDLING_STACKS]: [],
      },
    });

    const stack = new Stack(app, "budgetNeutralityProcessorTest", {
      env: { account: "0123456789", region: "us-east-1" },
    });

    new BudgetNeutralityProcessor(stack, "BudgetNeutralityProcessor", {
      ...mockProps,
      removalPolicy: RemovalPolicy.DESTROY,
      kmsKey: new Key(stack, "BudgetNeutralityKmsKey"),
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SQS::Queue", 2);
    template.resourceCountIs("AWS::Lambda::Function", 1);
  });
});
