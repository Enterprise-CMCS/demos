import { aws_wafv2 } from "aws-cdk-lib";
import { DeploymentConfigProperties } from "../config";
import { CommonProps } from "../types/props";

type WafRuleNoPriority = Omit<aws_wafv2.CfnWebACL.RuleProperty, "priority">;

const RULE_AWS_BAD_INPUTS: WafRuleNoPriority = {
  name: "AWS-AWSManagedRulesKnownBadInputsRuleSet",
  overrideAction: { none: {} },
  statement: {
    managedRuleGroupStatement: {
      vendorName: "AWS",
      name: "AWSManagedRulesKnownBadInputsRuleSet",
    },
  },
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudWatchMetricsEnabled: true,
    metricName: "CommonRuleSetMetric",
  },
};

const RULE_RATE_LIMIT: WafRuleNoPriority = {
  name: "RateLimiting",
  action: { block: {} },
  statement: {
    rateBasedStatement: {
      evaluationWindowSec: 300,
      limit: 5000,
      aggregateKeyType: "IP",
    },
  },
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: "RateLimiting",
    sampledRequestsEnabled: true,
  },
};

const RULE_AWS_COMMON: WafRuleNoPriority = {
  name: "AWSCommonRule",
  statement: {
    managedRuleGroupStatement: {
      name: "AWSManagedRulesCommonRuleSet",
      vendorName: "AWS",
    },
  },
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: "AWSCommonRule",
    sampledRequestsEnabled: true,
  },
  overrideAction: { none: {} },
};

const RULE_AWS_IP_REPUTATION: WafRuleNoPriority = {
  name: "AWSManagedRulesAmazonIpReputationList",
  statement: {
    managedRuleGroupStatement: {
      name: "AWSManagedRulesAmazonIpReputationList",
      vendorName: "AWS",
    },
  },
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: "AWSManagedRulesAmazonIpReputationList",
    sampledRequestsEnabled: true,
  },
  overrideAction: { none: {} },
};

const RULE_US_ONLY: WafRuleNoPriority = {
  name: "USOnly",
  action: { block: {} },
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: "USOnly",
    sampledRequestsEnabled: true,
  },
  statement: {
    notStatement: {
      statement: {
        geoMatchStatement: {
          countryCodes: ["US"],
        },
      },
    },
  },
};

const baseWafRules: WafRuleNoPriority[] = [
  RULE_AWS_BAD_INPUTS,
  RULE_RATE_LIMIT,
  RULE_AWS_COMMON,
  RULE_AWS_IP_REPUTATION,
  RULE_US_ONLY,
];

const createHeaderValueBlockRule = (
  name: string,
  headerValue?: string,
  headerKey: string = "x-allow-through"
): WafRuleNoPriority => ({
  name,
  action: { block: {} },
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: name,
    sampledRequestsEnabled: true,
  },
  statement: {
    notStatement: {
      statement: {
        byteMatchStatement: {
          fieldToMatch: {
            singleHeader: {
              name: headerKey,
            },
          },
          positionalConstraint: "EXACTLY",
          searchString: headerValue,
          textTransformations: [
            {
              priority: 0,
              type: "NONE",
            },
          ],
        },
      },
    },
  },
});

export const accessDeniedBodyName = "accessDenied";

const createCombinedBlockRule = (
  name: string,
  ipSet: aws_wafv2.CfnIPSet,
  headerValue?: string,
  headerKey: string = "x-allow-through"
): WafRuleNoPriority => { 

  const statements: aws_wafv2.CfnWebACL.StatementProperty[] = [{
          notStatement: {
            statement: {
              ipSetReferenceStatement: {
                arn: ipSet.attrArn,
              },
            },
          },
        },
        ]

  if (headerValue) { 
    statements.push({
          notStatement: {
            statement: {
              byteMatchStatement: {
                fieldToMatch: {
                  singleHeader: {
                    name: headerKey,
                  },
                },
                positionalConstraint: "EXACTLY",
                searchString: headerValue,
                textTransformations: [
                  {
                    priority: 0,
                    type: "NONE",
                  },
                ],
              },
            },
          },
        })
  }

  return {
  name,
  action: { block: {
    customResponse: {
      responseCode: 403,
      customResponseBodyKey: accessDeniedBodyName
    }
  } },
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: name,
    sampledRequestsEnabled: true,
  },
  statement: {
    andStatement: {
      statements,
    },
  },
}
};

const addPriorities = (rules: WafRuleNoPriority[]): aws_wafv2.CfnWebACL.RuleProperty[] => {
  return rules.map((r, i) => ({ ...r, priority: i }));
};

export const createCloudfrontRules = (
  commonProps: CommonProps & DeploymentConfigProperties
): aws_wafv2.CfnWebACL.RuleProperty[] => {
  const ipSet = new aws_wafv2.CfnIPSet(commonProps.scope, "cloudfrontWaf", {
    name: `${commonProps.stage}AllowVPNIps`,
    scope: "CLOUDFRONT",
    ipAddressVersion: "IPV4",
    addresses: [...commonProps.zScalerIps],
  });

  const rules = [
    ...baseWafRules
  ];

  if (commonProps.stage != "prod") {
    rules.unshift(createCombinedBlockRule("ZScalerOrCloudbees", ipSet, commonProps.zapHeaderValue),);
  }

  return addPriorities(rules);
};

export const createRegionalRules = (
  commonProps: CommonProps & DeploymentConfigProperties
): aws_wafv2.CfnWebACL.RuleProperty[] => {
  const rules = [
    createHeaderValueBlockRule("DenyWithoutCloudfrontHeader", commonProps.cloudfrontWafHeaderValue),
    ...baseWafRules,
  ];

  return addPriorities(rules);
};
