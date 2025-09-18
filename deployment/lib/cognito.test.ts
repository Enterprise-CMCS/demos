import { App, Stack } from "aws-cdk-lib";
import { create, createUserPoolClient } from "./cognito";
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

  test("includes IDM logout URL in dev", () => {
    const app = new App();
    const stack = new Stack(app, "DevStack");

    create({
      ...mockCommonProps,
      scope: stack,
      stage: "dev",
      isDev: true,
      cloudfrontHost: "dev.example.com",
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties("AWS::Cognito::UserPoolClient", {
      LogoutURLs: Match.arrayWith([
        "https://dev.example.com/",
        "http://localhost:3000/",
        "https://test.idp.idm.cms.gov/login/signout",
      ]),
    });
  });

  test("excludes IDM logout URL in prod", () => {
    const app = new App();
    const stack = new Stack(app, "ProdStack");

    create({
      ...mockCommonProps,
      scope: stack,
      stage: "prod",
      isDev: false,
      isEphemeral: false,
      cloudfrontHost: "prod.example.com",
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties("AWS::Cognito::UserPoolClient", {
      LogoutURLs: Match.arrayWith(["https://prod.example.com/"]),
    });
    template.hasResourceProperties("AWS::Cognito::UserPoolClient", {
      LogoutURLs: Match.not(Match.arrayWith(["https://test.idp.idm.cms.gov/login/signout"])),
    });
  });

  test("createUserPoolClient includes IDM logout URL in dev", () => {
    const app = new App();
    const stack = new Stack(app, "ImportDevStack");

    createUserPoolClient(
      {
        ...mockCommonProps,
        scope: stack,
        stage: "dev",
        isDev: true,
        isEphemeral: false,
        cloudfrontHost: "dev.example.com",
      },
      "pool-id-placeholder",
      "dev"
    );

    const template = Template.fromStack(stack);
    template.hasResourceProperties("AWS::Cognito::UserPoolClient", {
      LogoutURLs: Match.arrayWith([
        "https://dev.example.com/",
        "http://localhost:3000/",
        "https://test.idp.idm.cms.gov/login/signout",
      ]),
    });
  });

  test("createUserPoolClient excludes IDM logout URL in prod", () => {
    const app = new App();
    const stack = new Stack(app, "ImportProdStack");

    createUserPoolClient(
      {
        ...mockCommonProps,
        scope: stack,
        stage: "prod",
        isDev: false,
        isEphemeral: false,
        cloudfrontHost: "prod.example.com",
      },
      "pool-id-placeholder",
      "prod"
    );

    const template = Template.fromStack(stack);
    template.hasResourceProperties("AWS::Cognito::UserPoolClient", {
      LogoutURLs: Match.arrayWith([
        "https://prod.example.com/",
      ]),
    });
    template.hasResourceProperties("AWS::Cognito::UserPoolClient", {
      LogoutURLs: Match.not(Match.arrayWith(["https://test.idp.idm.cms.gov/login/signout"])),
    });
  });
});
