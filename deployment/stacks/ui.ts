import {
  CfnOutput,
  Stack,
  StackProps,
  aws_iam,
  aws_s3,
  RemovalPolicy,
  aws_cloudfront,
  Duration,
  aws_certificatemanager,
  aws_cloudfront_origins,
  aws_wafv2,
  Fn,
  Aws,
  Tags,
  aws_route53,
  aws_route53_targets,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";

import * as uiDeploy from "../lib/ui-deploy";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { DemosLogGroup } from "../lib/logGroup";

interface UIStackProps {
  cognitoParamNames: {
    authority: string;
    clientId: string;
  };
}

export class UiStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & DeploymentConfigProperties & UIStackProps) {
    super(scope, id, {
      ...props,
      terminationProtection: false,
    });

    const commonProps = {
      ...props,
      scope: this,
      iamPermissionsBoundary:
        props.iamPermissionsBoundaryArn != null
          ? aws_iam.ManagedPolicy.fromManagedPolicyArn(this, "iamPermissionsBoundary", props.iamPermissionsBoundaryArn)
          : undefined,
    };

    const serverAccessLogBucket = new aws_s3.Bucket(commonProps.scope, "CloudfrontLogBucket", {
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: aws_s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      removalPolicy: commonProps.isDev ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      autoDeleteObjects: commonProps.isDev,
      enforceSSL: true,
      bucketName: `demos-${commonProps.stage}-ui-server-access`,
    });

    const cmsCloudLogBucket = aws_s3.Bucket.fromBucketName(
      commonProps.scope,
      "cmsCloudLogsBucket",
      `cms-cloud-${Aws.ACCOUNT_ID}-us-east-1`
    );

    // Add bucket policy to allow CloudFront to write logs
    serverAccessLogBucket.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        principals: [new aws_iam.ServicePrincipal("cloudfront.amazonaws.com")],
        actions: ["s3:PutObject"],
        resources: [`${serverAccessLogBucket.bucketArn}/*`],
      })
    );

    // S3 Bucket for UI hosting
    const uiBucket = new aws_s3.Bucket(commonProps.scope, "uiBucket", {
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: serverAccessLogBucket,
      enforceSSL: true,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
    });

    //
    // WAF
    //

    const ipSet = new aws_wafv2.CfnIPSet(commonProps.scope, "cloudfrontWaf", {
      name: `${commonProps.stage}AllowVPNIps`,
      scope: "CLOUDFRONT",
      ipAddressVersion: "IPV4",
      addresses: commonProps.zScalerIps,
    });

    const accessDeniedBodyName = "accessDenied";

    const customResponseBodies = {
      [accessDeniedBodyName]: {
        content: JSON.stringify({ error: "access denied outside vpn" }),
        contentType: "APPLICATION_JSON",
      },
    };

    const wafLogs = new DemosLogGroup(commonProps.scope, "wafLogs", {
      // AWS WAF has a restriction that log groups used must begin with `aws-waf-logs-`
      overrideFullName: `aws-waf-logs-demos-${commonProps.stage}`,
      isEphemeral: commonProps.isEphemeral,
      stage: commonProps.stage,
    });

    const webAcl = new aws_wafv2.CfnWebACL(commonProps.scope, "cloudfrontWafAcl", {
      scope: "CLOUDFRONT",
      defaultAction: {
        block: {
          customResponse: {
            responseCode: 403,
            customResponseBodyKey: accessDeniedBodyName,
          },
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "WebACL",
        sampledRequestsEnabled: true,
      },
      name: `${commonProps.project}-${commonProps.stage}-acl`,
      rules: [
        {
          name: "AllowZScaler",
          priority: 0,
          action: { allow: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "AllowZScaler",
            sampledRequestsEnabled: true,
          },
          statement: {
            ipSetReferenceStatement: {
              arn: ipSet.attrArn,
            },
          },
        },
      ],
      customResponseBodies,
    });

    new aws_wafv2.CfnLoggingConfiguration(commonProps.scope, "cloudfrontWafAclLogConf", {
      logDestinationConfigs: [wafLogs.logGroup.logGroupArn],
      resourceArn: webAcl.attrArn,
    });

    const apiAcl = new aws_wafv2.CfnWebACL(commonProps.scope, "apiWaf", {
      scope: "REGIONAL",
      defaultAction: { block: {} },
      name: `demos-${commonProps.stage}-api`,
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${commonProps.stage}ApiWafMetric`,
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: "AllowFromCloudfrontHeader",
          priority: 0,
          action: { allow: {} },
          statement: {
            byteMatchStatement: {
              fieldToMatch: {
                singleHeader: {
                  name: "x-allow-through",
                },
              },
              positionalConstraint: "EXACTLY",
              searchString: commonProps.cloudfrontWafHeaderValue,
              textTransformations: [
                {
                  priority: 0,
                  type: "NONE",
                },
              ],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `${commonProps.stage}AllowFromCFHeader`,
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    const apiUrl = Fn.importValue(`${commonProps.stage}ApiGWUrl`);
    const apiDomainName = Fn.parseDomainName(apiUrl);
    const apiId = Fn.split(".", apiDomainName, 5)[0];

    new aws_wafv2.CfnWebACLAssociation(commonProps.scope, "apiWafAssociation", {
      resourceArn: `arn:aws:apigateway:us-east-1::/restapis/${apiId}/stages/${commonProps.stage}`,
      webAclArn: apiAcl.attrArn,
    });

    new aws_wafv2.CfnLoggingConfiguration(commonProps.scope, "apiWafAclLogConf", {
      logDestinationConfigs: [wafLogs.logGroup.logGroupArn],
      resourceArn: apiAcl.attrArn,
    });

    const cognitoDomain = Fn.importValue(`${commonProps.stage}CognitoDomain`);
    const securityHeadersPolicy = new aws_cloudfront.ResponseHeadersPolicy(
      commonProps.scope,
      "CloudFormationHeadersPolicy",
      {
        responseHeadersPolicyName: `Headers-Policy-${commonProps.stage}`,
        comment: "Add Security Headers",
        securityHeadersBehavior: {
          contentTypeOptions: {
            override: true,
          },
          strictTransportSecurity: {
            accessControlMaxAge: Duration.days(730),
            includeSubdomains: true,
            preload: true,
            override: true,
          },
          frameOptions: {
            frameOption: aws_cloudfront.HeadersFrameOption.DENY,
            override: true,
          },
          contentSecurityPolicy: {
            contentSecurityPolicy: `default-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self' https://cognito-idp.${Aws.REGION}.amazonaws.com ${cognitoDomain}; frame-ancestors 'none'; object-src 'none'`,
            override: true,
          },
        },
      }
    );

    const distribution = new aws_cloudfront.Distribution(commonProps.scope, "CloudFrontDistribution", {
      certificate: commonProps.cloudfrontCertificateArn
        ? aws_certificatemanager.Certificate.fromCertificateArn(
            commonProps.scope,
            "certArn",
            commonProps.cloudfrontCertificateArn
          )
        : undefined,
      domainNames: [commonProps.cloudfrontHost],
      geoRestriction: aws_cloudfront.GeoRestriction.allowlist("US"),
      defaultBehavior: {
        origin: aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(uiBucket),
        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: aws_cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        responseHeadersPolicy: securityHeadersPolicy,
      },
      defaultRootObject: "index.html",
      enableLogging: true,
      logBucket: cmsCloudLogBucket,
      logFilePrefix: `AWSLogs/${Aws.ACCOUNT_ID}/Cloudfront/demos-${commonProps.stage}/`,
      httpVersion: aws_cloudfront.HttpVersion.HTTP2,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
      webAclId: webAcl.attrArn,
      enableIpv6: !["dev", "test", "impl"].includes(commonProps.hostEnvironment),
      comment: `Env Name: ${commonProps.stage}`,
    });
    distribution.applyRemovalPolicy(commonProps.isDev ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN);

    Tags.of(distribution).add("Name", `demos-${commonProps.stage}-cloudfront-dist`);

    const zone = aws_route53.HostedZone.fromLookup(commonProps.scope, "hostedZone", {
      domainName: `${commonProps.hostEnvironment}.demos.internal.cms.gov`,
      privateZone: true,
    });

    new aws_route53.ARecord(commonProps.scope, "cloudfrontARecord", {
      zone,
      recordName: commonProps.isEphemeral ? commonProps.stage : undefined,
      target: aws_route53.RecordTarget.fromAlias(new aws_route53_targets.CloudFrontTarget(distribution)),
    });

    const apiOrigin = new HttpOrigin(apiDomainName, {
      originPath: `/${commonProps.stage}`,
      customHeaders: {
        "x-allow-through": commonProps.cloudfrontWafHeaderValue!,
      },
    });

    distribution.addBehavior("/api/*", apiOrigin, {
      allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: aws_cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: aws_cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
    });

    const applicationEndpointUrl = `https://${distribution.distributionDomainName}/`;

    uiDeploy.create({
      ...commonProps,
      uiBucket,
      distribution,
      applicationEndpointUrl,
      cognitoParamNames: props.cognitoParamNames,
    });

    // Outputs

    new CfnOutput(this, "Cloudfront URL", {
      value: applicationEndpointUrl,
      exportName: `${commonProps.stage}CloudfrontUrl`,
    });
  }
}
