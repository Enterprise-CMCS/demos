import {
  aws_cloudfront,
  aws_iam,
  aws_lambda,
  aws_s3,
  aws_s3_assets,
  aws_s3_deployment,
  custom_resources,
  Duration,
} from "aws-cdk-lib";
import { CommonProps } from "../types/props";
import path from "path";
import { Construct } from "constructs";

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

  const cm = deploymentRole.node.tryFindChild("DefaultPolicy")?.node.defaultChild as aws_iam.CfnPolicy;
  cm.cfnOptions.metadata = {
    checkov: {
      skip: [{
        id: "CKV_AWS_111",
        reason: "CDK allows invalidation on all by default without options for limiting: https://github.com/aws/aws-cdk/blob/main/packages/aws-cdk-lib/aws-s3-deployment/lib/bucket-deployment.ts#L422"
      }]
    }
  }

  const crh = (deployWebsite.node.findChild("CustomResourceHandler") as aws_lambda.SingletonFunction);
  const crhLambda = (crh["lambdaFunction"] as Construct).node.defaultChild as aws_lambda.CfnFunction
  crhLambda.cfnOptions.metadata = {
    checkov: {
      skip: [{
        id: "CKV_AWS_173",
        reason: "Controlled by CDK internally"
      }]
    }
  }

  const gitHashFile = new aws_s3_deployment.DeployTimeSubstitutedFile(props.scope, "gitHashFile", {
    source: path.join("assets", "version.json"),
    destinationBucket: props.uiBucket,
    destinationKey: "version.json",
    substitutions: {
      version: process.env.UI_COMMIT_HASH || "unknown",
    },
  });

  gitHashFile.node.addDependency(deployWebsite)

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
  invalidateCloudfront.node.addDependency(gitHashFile);
}
