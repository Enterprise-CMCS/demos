import { App } from "aws-cdk-lib";
import { CoreStack } from "./core";
import { Template } from "aws-cdk-lib/assertions";

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

describe("Core Stack", () => {
  test("should create proper resources when non-ephemeral", () => {
    const app = new App();

    const coreStack = new CoreStack(app, "mockCore", {
      ...mockCommonProps,
      env: {
        region: "us-east-1",
        account: "0123456789",
      },
    });

    const template = Template.fromStack(coreStack);

    template.resourceCountIs("AWS::Cognito::UserPool", 1);
    template.resourceCountIs("AWS::Cognito::UserPoolClient", 1);
    template.resourceCountIs("AWS::EC2::VPCEndpoint", 3);
  });

  test("should create proper resources when ephemeral", () => {
    const app = new App();

    const coreStack = new CoreStack(app, "mockCore", {
      ...mockCommonProps,
      isEphemeral: true,
      hostUserPoolId: "mock-user-pool-id",
      env: {
        region: "us-east-1",
        account: "0123456789",
      },
    });

    const template = Template.fromStack(coreStack);

    template.resourceCountIs("AWS::Cognito::UserPool", 0);
    template.resourceCountIs("AWS::Cognito::UserPoolClient", 1);
    template.resourceCountIs("AWS::EC2::VPCEndpoint", 0);
  });

  test("should throw error when no user pool is specified for ephemeral environment", () => {
    const app = new App();

    expect(() => {
      new CoreStack(app, "mockCore", {
        ...mockCommonProps,
        isEphemeral: true,
        env: {
          region: "us-east-1",
          account: "0123456789",
        },
      });
    }).toThrow("cannot start ephemeral environment without host user pool");
  });
});
