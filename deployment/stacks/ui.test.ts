/* eslint-disable @typescript-eslint/no-explicit-any */
import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { UiStack } from "./ui";
import { DeploymentConfigProperties } from "../config";

const mockCommonProps: DeploymentConfigProperties = {
  project: "demos",
  isDev: true,
  isLocalstack: false,
  isEphemeral: false,
  stage: "unittest",
  zScalerIps: ["0.1.2.3"],
  hostEnvironment: "unitTestHost" as "dev",
  cloudfrontWafHeaderValue: "cloudfront-header-for-api",
  cloudfrontHost: "unittest.demos.com",
  srrConfigured: true
};

describe("UI Stack", () => {
  test("should create only basic cloudfront config when srr is not configured", () => {
    const app = new App();

    const uiStack = new UiStack(app, "mockUi", {
      ...mockCommonProps,
      env: {
        region: "us-east-1",
        account: "0123456789",
      },
      cognitoParamNames: {
        authority: "authority",
        clientId: "clientId",
      },
      srrConfigured: false
    });
    const template = Template.fromStack(uiStack);

    const allResources = Object.keys(template.toJSON().Resources)
    expect(allResources.length).toEqual(1)

    console.log(template.toJSON().Resources.CloudFrontDistributionBA64CE3A.Properties.DistributionConfig)

    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        Origins: Match.arrayWith([
          Match.objectLike({
            DomainName: "example.com"
          })
        ]),
        PriceClass: "PriceClass_All"
      })
    })
  })
  test("should create proper resources when non-ephemeral", () => {
    const app = new App();

    const uiStack = new UiStack(app, "mockUi", {
      ...mockCommonProps,
      env: {
        region: "us-east-1",
        account: "0123456789",
      },
      cognitoParamNames: {
        authority: "authority",
        clientId: "clientId",
      },
    });

    const template = Template.fromStack(uiStack);
    // const fs = require("fs");
    // fs.writeFileSync("template-ui.json", JSON.stringify(template.toJSON(), null, 2));

    template.resourceCountIs("AWS::CloudFront::Distribution", 1);
    // The DeployTimeSubstitutedFile has the type Custom::CDKBucketDeployment in
    // addition to the actual bucket deployment
    template.resourceCountIs("Custom::CDKBucketDeployment", 2);
    template.resourceCountIs("AWS::WAFv2::WebACL", 2);

    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        CacheBehaviors: Match.arrayWith([
          Match.objectLike({
            PathPattern: "/api/*",
          }),
        ]),
        Origins: Match.arrayWith([
          Match.objectLike({
            OriginPath: "/unittest",
            OriginCustomHeaders: Match.arrayEquals([
              Match.objectEquals({
                HeaderName: "x-allow-through",
                HeaderValue: mockCommonProps.cloudfrontWafHeaderValue,
              }),
            ]),
          }),
        ]),
      }),
    });

    const distributions = Object.values(template.toJSON().Resources).filter(
      (r: any) => r.Type == "AWS::CloudFront::Distribution"
    );
    expect(distributions.length).toEqual(1);
    const dist = distributions[0] as any;
    const origins = dist.Properties.DistributionConfig.Origins;
    expect(origins.length).toEqual(2);
    const apiOrigin = origins.filter((r: any) => r.OriginPath == "/unittest")[0];
    const cacheBehaviors = dist.Properties.DistributionConfig.CacheBehaviors;
    expect(cacheBehaviors.length).toEqual(1);
    expect(cacheBehaviors[0].TargetOriginId).toEqual(apiOrigin.Id);
  });

  test("should include header passthrough when a zapHeaderValue exists", () => {
    const app = new App();

    const mockZapHeaderVal = "test-header-val";

    const uiStack = new UiStack(app, "mockUi", {
      ...mockCommonProps,
      env: {
        region: "us-east-1",
        account: "0123456789",
      },
      cognitoParamNames: {
        authority: "authority",
        clientId: "clientId",
      },
      zapHeaderValue: mockZapHeaderVal,
    });

    const template = Template.fromStack(uiStack);
    template.resourceCountIs("AWS::WAFv2::WebACL", 2);

    template.hasResourceProperties("AWS::WAFv2::WebACL", {
      Rules: Match.arrayWith([
        Match.objectLike({
          Name: "AllowCMSCloudbees",
          Statement: Match.objectLike({
            ByteMatchStatement: Match.objectLike({
              SearchString: mockZapHeaderVal,
            }),
          }),
        }),
      ]),
    });
  });
});
