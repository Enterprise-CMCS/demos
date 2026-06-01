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
  srrConfigured: true,
  dataConnectRoleArn: "arn:aws:iam::1234567890:role/dataconnectrole",
};

function expectWafBlockedRequestsAnomalyAlarm(
  template: Template,
  props: {
    alarmName: string;
    rule: string;
    webAcl: string;
    region: string | ReturnType<typeof Match.anyValue>;
  }
) {
  template.hasResourceProperties("AWS::CloudWatch::Alarm", {
    AlarmName: props.alarmName,
    ComparisonOperator: "GreaterThanUpperThreshold",
    EvaluationPeriods: 3,
    DatapointsToAlarm: 2,
    ThresholdMetricId: Match.anyValue(),
    Metrics: Match.arrayWith([
      Match.objectLike({
        Expression: Match.stringLikeRegexp("ANOMALY_DETECTION_BAND"),
      }),
      Match.objectLike({
        MetricStat: Match.objectLike({
          Metric: Match.objectLike({
            MetricName: "BlockedRequests",
            Namespace: "AWS/WAFV2",
            Dimensions: Match.arrayWith([
              Match.objectLike({
                Name: "Region",
                Value: props.region,
              }),
              Match.objectLike({
                Name: "Rule",
                Value: props.rule,
              }),
              Match.objectLike({
                Name: "WebACL",
                Value: props.webAcl,
              }),
            ]),
          }),
          Period: 300,
          Stat: "Sum",
        }),
      }),
    ]),
    TreatMissingData: "notBreaching",
  });
}

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
      srrConfigured: false,
    });
    const template = Template.fromStack(uiStack);

    const allResources = Object.keys(template.toJSON().Resources);
    expect(allResources.length).toEqual(1);

    console.log(template.toJSON().Resources.CloudFrontDistributionBA64CE3A.Properties.DistributionConfig);

    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        Origins: Match.arrayWith([
          Match.objectLike({
            DomainName: "example.com",
          }),
        ]),
        PriceClass: "PriceClass_All",
      }),
    });
  });
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
    template.resourceCountIs("AWS::CloudWatch::Alarm", 5);

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

  test("should create CloudFront error rate alarms", () => {
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

    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-cloudfront-5xx-error-rate-high",
      ComparisonOperator: "GreaterThanThreshold",
      EvaluationPeriods: 2,
      DatapointsToAlarm: 2,
      MetricName: "5xxErrorRate",
      Namespace: "AWS/CloudFront",
      Statistic: "Average",
      Threshold: 1,
      TreatMissingData: "notBreaching",
    });

    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-cloudfront-4xx-error-rate-anomaly",
      ComparisonOperator: "GreaterThanUpperThreshold",
      EvaluationPeriods: 3,
      DatapointsToAlarm: 2,
      ThresholdMetricId: Match.anyValue(),
      Metrics: Match.arrayWith([
        Match.objectLike({
          Expression: Match.stringLikeRegexp("ANOMALY_DETECTION_BAND"),
        }),
        Match.objectLike({
          MetricStat: Match.objectLike({
            Metric: Match.objectLike({
              MetricName: "4xxErrorRate",
              Namespace: "AWS/CloudFront",
            }),
            Stat: "Average",
          }),
        }),
      ]),
      TreatMissingData: "notBreaching",
    });
  });

  test("should create WAF blocked request anomaly alarms", () => {
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

    expectWafBlockedRequestsAnomalyAlarm(template, {
      alarmName: "demos-unittest-api-waf-missing-cloudfront-header-blocked-requests-anomaly",
      rule: "DenyWithoutCloudfrontHeader",
      webAcl: "unittestApiWafMetric",
      region: Match.anyValue(),
    });
    expectWafBlockedRequestsAnomalyAlarm(template, {
      alarmName: "demos-unittest-api-waf-rate-limiting-blocked-requests-anomaly",
      rule: "RateLimiting",
      webAcl: "unittestApiWafMetric",
      region: Match.anyValue(),
    });
    expectWafBlockedRequestsAnomalyAlarm(template, {
      alarmName: "demos-unittest-cloudfront-waf-rate-limiting-blocked-requests-anomaly",
      rule: "RateLimiting",
      webAcl: "WebACL",
      region: "CloudFront",
    });
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
          Name: "ZScalerOrCloudbees",
          Statement: Match.objectLike({
            AndStatement: Match.objectLike({
              Statements: Match.arrayWith([
                Match.objectLike({
                  NotStatement: Match.objectLike({
                    Statement: Match.objectLike({
                      ByteMatchStatement: Match.objectLike({
                        SearchString: mockZapHeaderVal,
                      }),
                    }),
                  }),
                }),
              ]),
            }),
          }),
        }),
      ]),
    });
  });
});
