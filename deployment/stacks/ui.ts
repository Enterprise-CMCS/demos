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
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";

import * as uiDeploy from "../lib/ui-deploy";
import { execSync } from "child_process";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";

interface UIStackProps {
  cognitoParamNames: {
    authority: string;
    clientId: string;
  };
}

export class UiStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps & DeploymentConfigProperties & UIStackProps
  ) {

    super(scope, id, {
      ...props,
      terminationProtection: false,
    });

    const commonProps = {
      ...props,
      scope: this,
      iamPermissionsBoundary:
        props.iamPermissionsBoundaryArn != null
          ? aws_iam.ManagedPolicy.fromManagedPolicyArn(
              this,
              "iamPermissionsBoundary",
              props.iamPermissionsBoundaryArn
            )
          : undefined,
    };

    const logBucket = new aws_s3.Bucket(
      commonProps.scope,
      "CloudfrontLogBucket",
      {
        encryption: aws_s3.BucketEncryption.S3_MANAGED,
        publicReadAccess: false,
        blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
        objectOwnership: aws_s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
        removalPolicy: commonProps.isDev
          ? RemovalPolicy.DESTROY
          : RemovalPolicy.RETAIN,
        autoDeleteObjects: commonProps.isDev,
        enforceSSL: true,
      }
    );

    // Add bucket policy to allow CloudFront to write logs
    logBucket.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        principals: [new aws_iam.ServicePrincipal("cloudfront.amazonaws.com")],
        actions: ["s3:PutObject"],
        resources: [`${logBucket.bucketArn}/*`],
      })
    );

    // S3 Bucket for UI hosting
    const uiBucket = new aws_s3.Bucket(commonProps.scope, "uiBucket", {
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: logBucket,
      enforceSSL: true,
    });

    //
    // WAF
    //

    const prefixListEntries = execSync(
      `aws ec2 get-managed-prefix-list-entries --prefix-list-id $(aws ec2 describe-managed-prefix-lists --filters "Name=prefix-list-name,Values=zscaler" --query 'PrefixLists[0].PrefixListId' --output text) --output json --query "Entries[*].Cidr"`
    );

    const ipSet = new aws_wafv2.CfnIPSet(commonProps.scope, "cloudfrontWaf", {
      name: "AllowVPNIps",
      scope: "CLOUDFRONT",
      ipAddressVersion: "IPV4",
      addresses: JSON.parse(prefixListEntries.toString()),
    });

    const webAcl = new aws_wafv2.CfnWebACL(
      commonProps.scope,
      "cloudfrontWafAcl",
      {
        scope: "CLOUDFRONT",
        defaultAction: {
          block: {},
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
      }
    );

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
            contentSecurityPolicy:
              "default-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'",
            override: true,
          },
        },
      }
    );

    const distribution = new aws_cloudfront.Distribution(
      commonProps.scope,
      "CloudFrontDistribution",
      {
        certificate: commonProps.cloudfrontCertificateArn
          ? aws_certificatemanager.Certificate.fromCertificateArn(
              commonProps.scope,
              "certArn",
              commonProps.cloudfrontCertificateArn
            )
          : undefined,
        domainNames: [],
        geoRestriction: aws_cloudfront.GeoRestriction.allowlist("US"),
        defaultBehavior: {
          origin:
            aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
              uiBucket
            ),
          allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          viewerProtocolPolicy:
            aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: aws_cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
          responseHeadersPolicy: securityHeadersPolicy,
        },
        defaultRootObject: "index.html",
        enableLogging: true,
        logBucket,
        httpVersion: aws_cloudfront.HttpVersion.HTTP2,
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
        webAclId: webAcl.attrArn,
        enableIpv6: false, //TODO: only in lower environments
      }
    );
    distribution.applyRemovalPolicy(
      commonProps.isDev ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN
    );

    const apiOrigin = new HttpOrigin(
      "o9aa8lp6p3.execute-api.us-east-1.amazonaws.com",
      {
        originPath: "/dev",
      }
    );

    distribution.addBehavior("/api/*", apiOrigin, {
      allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: aws_cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy:
        aws_cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
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
      exportName: "cloudfrontUrl",
    });
  }
}
