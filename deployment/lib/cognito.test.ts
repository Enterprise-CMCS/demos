import { App, Stack } from "aws-cdk-lib";
import { create, createUserPoolClient } from "./cognito";
import { Template } from "aws-cdk-lib/assertions";

const mockCommonProps = {
  project: "demos",
  isDev: true,
  isLocalstack: false,
  isEphemeral: false,
  stage: "unittest",
  zScalerIps: ["0.1.2.3"],
  cloudfrontHost: "unittest.demos.com",
};

describe("Cognito", () => {
  test("should create a valid user pool", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");

    create({
      ...mockCommonProps,
      scope: stack,
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::Cognito::UserPool", {
      UserPoolName: "demos-unittest-user-pool",
    });
    template.hasResource("AWS::Cognito::UserPool", {
      UpdateReplacePolicy: "Retain",
    });

    template.hasResourceProperties("AWS::Cognito::UserPoolIdentityProvider", {
      ProviderName: "demos-unittest-idm",
      ProviderType: "SAML",
    });

    template.hasResourceProperties("AWS::Cognito::UserPoolClient", {
      ClientName: "demos-unittest-user-pool-client",
    });
  });

  test("should run", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");

    createUserPoolClient(
      {
        ...mockCommonProps,
        scope: stack,
      },
      "pool",
      "dev"
    );

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::Cognito::UserPoolClient", {
      ClientName: "demos-unittest-user-pool-client",
    });
  });
});
