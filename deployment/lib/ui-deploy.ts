import {
  aws_cloudfront,
  aws_iam,
  aws_s3,
  aws_s3_assets,
  aws_s3_deployment,
  custom_resources,
  Duration,
} from "aws-cdk-lib";
import { CommonProps } from "../types/props";
import path from "path";

interface UIDeploymentProps extends CommonProps {
  uiBucket: aws_s3.Bucket;
  distribution: aws_cloudfront.Distribution;
  applicationEndpointUrl: string;
  cognitoParamNames: {
    authority: string;
    clientId: string;
  };
}

export function create(props: UIDeploymentProps) {
  const spaPath = "../client/";
  const buildOutputPath = path.join(spaPath, "dist");

  const deploymentRole = new aws_iam.Role(props.scope, "BucketDeploymentRole", {
    assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
    path: props.iamPath,
    permissionsBoundary: props.iamPermissionsBoundary,
    inlinePolicies: {
      InlinePolicy: new aws_iam.PolicyDocument({
        statements: [
          new aws_iam.PolicyStatement({
            actions: [
              "s3:PutObject",
              "s3:PutObjectAcl",
              "s3:DeleteObject",
              "s3:DeleteObjectVersion",
              "s3:GetBucketLocation",
              "s3:GetObject",
              "s3:ListBucket",
              "s3:ListBucketVersions",
            ],
            resources: [props.uiBucket.bucketArn, `${props.uiBucket.bucketArn}/*`],
          }),
          new aws_iam.PolicyStatement({
            actions: ["cloudfront:CreateInvalidation"],
            resources: ["*"],
          }),
        ],
      }),
    },
  });

  const deployWebsite = new aws_s3_deployment.BucketDeployment(props.scope, "DeployWebsite", {
    sources: [aws_s3_deployment.Source.asset(buildOutputPath)],
    destinationBucket: props.uiBucket,
    distribution: props.distribution,
    distributionPaths: ["/*"],
    prune: true,
    cacheControl: [
      aws_s3_deployment.CacheControl.setPublic(),
      aws_s3_deployment.CacheControl.maxAge(Duration.days(365)),
      aws_s3_deployment.CacheControl.noCache(),
    ],
    role: deploymentRole,
  });
  const buildAsset = new aws_s3_assets.Asset(props.scope, "uiBuildAsset", {
    path: buildOutputPath,
  });

  const gitHashFile = new aws_s3_deployment.DeployTimeSubstitutedFile(props.scope, "gitHashFile", {
    source: path.join("assets", "version.json"),
    destinationBucket: props.uiBucket,
    destinationKey: "version.json",
    substitutions: {
      version: process.env.UI_COMMIT_HASH || "unknown",
    },
  });

  const invalidateCloudfront = new custom_resources.AwsCustomResource(props.scope, "InvalidateCloudfront", {
    onCreate: undefined,
    onDelete: undefined,
    onUpdate: {
      service: "CloudFront",
      action: "createInvalidation",
      parameters: {
        DistributionId: props.distribution.distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: ["/*"],
          },
          CallerReference: `invalidate-${buildAsset.assetHash}`,
        },
      },
      physicalResourceId: custom_resources.PhysicalResourceId.of(`InvalidateCloudfront-${props.stage}`),
    },
    role: deploymentRole,
  });
  invalidateCloudfront.node.addDependency(deployWebsite);
  invalidateCloudfront.node.addDependency(gitHashFile);
}
