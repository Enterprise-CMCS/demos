import { CfnOutput, Stack, StackProps, aws_iam, aws_cognito, aws_ec2, RemovalPolicy, aws_s3, Duration, aws_kms } from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";

import * as cognito from "../lib/cognito";
import * as ssm from "../lib/ssm-parameter";
import * as securityGroup from "../lib/security-group";
import { Bucket } from "aws-cdk-lib/aws-s3";

export class CoreStack extends Stack {
  public readonly cognito_outputs: aws_cognito.UserPool | aws_cognito.IUserPool;
  public readonly cognitoAuthorityParamName: string;
  public readonly cognitoClientIdParamName: string;
  public readonly vpcId?: string;
  public readonly vpc: aws_ec2.IVpc;
  public readonly secretsManagerVpceSg: aws_ec2.ISecurityGroup;
  public readonly cloudVpnSecurityGroup: aws_ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: StackProps & DeploymentConfigProperties) {
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

    let cognito_outputs: cognito.CognitoOutputs;
    if (!commonProps.isEphemeral) {
      cognito_outputs = cognito.create(commonProps);
      this.cognito_outputs = cognito_outputs.userPool;
    } else if (commonProps.hostUserPoolId) {
      cognito_outputs = cognito.createUserPoolClient(
        commonProps,
        commonProps.hostUserPoolId,
        commonProps.hostEnvironment
      );
      this.cognito_outputs = cognito_outputs.userPool;
    } else {
      throw new Error("cannot start ephemeral environment without host user pool");
    }

    const vpc = props.isLocalstack
      ? aws_ec2.Vpc.fromLookup(this, "lsVpc", { tags: { Name: `demos-local` } })
      : aws_ec2.Vpc.fromLookup(this, "vpc", {
          tags: {
            Name: `demos-east-${!commonProps.isEphemeral ? commonProps.stage : commonProps.hostEnvironment}`,
          },
        });

    this.vpcId = vpc.vpcId;
    this.vpc = vpc;

    // These SSM parameters should be unnecessary, but there is an issue with
    // CDK, cognito, and bucket deployments...
    //
    // https://github.com/aws/aws-cdk/issues/19257#issuecomment-1102807097
    const ca = ssm.create({
      ...commonProps,
      name: "cognitoAuthority",
      value: cognito_outputs.authority,
    });
    const cid = ssm.create({
      ...commonProps,
      name: "cognitoClientId",
      value: cognito_outputs.userPoolClientId,
    });

    this.cognitoAuthorityParamName = ca.name;
    this.cognitoClientIdParamName = cid.name;

    const secretsManagerSecurityGroupName = `${commonProps.project}-${commonProps.hostEnvironment}-secrets-manager-vpce`;

    let secretsManagerEndpointSG: aws_ec2.ISecurityGroup;

    if (!commonProps.isEphemeral) {
      secretsManagerEndpointSG = securityGroup.create({
        ...commonProps,
        vpc,
        name: secretsManagerSecurityGroupName,
      }).securityGroup;

      vpc.addInterfaceEndpoint("secretsManagerEndpoint", {
        service: aws_ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        subnets: {
          subnets: vpc.privateSubnets,
        },
        securityGroups: [secretsManagerEndpointSG],
      });

      vpc.addGatewayEndpoint("s3GatewayEndpoint", {
        service: aws_ec2.GatewayVpcEndpointAwsService.S3,
      });

      const ssmEndpointSecurityGroupName = `${commonProps.project}-${commonProps.hostEnvironment}-ssm-vpce`;
      const ssmEndpoint = securityGroup.create({
        ...commonProps,
        vpc,
        scope: this,
        name: ssmEndpointSecurityGroupName,
      }).securityGroup;

      vpc.addInterfaceEndpoint("ssmEndpoint", {
        service: aws_ec2.InterfaceVpcEndpointAwsService.SSM,
        subnets: {
          subnets: vpc.privateSubnets,
        },
        securityGroups: [ssmEndpoint],
      });
    } else {
      // Ephemeral Environments
      secretsManagerEndpointSG = aws_ec2.SecurityGroup.fromLookupByName(
        commonProps.scope,
        "hostEnvSecretsManagerSG",
        `${commonProps.project}-${commonProps.hostEnvironment}-${secretsManagerSecurityGroupName}`,
        vpc
      );
    }

    this.secretsManagerVpceSg = secretsManagerEndpointSG;

    const accessLogs = new Bucket(this, "S3AccessLogBucket", {
          encryption: aws_s3.BucketEncryption.S3_MANAGED,
          removalPolicy:
            props.isDev || props.isEphemeral ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
          blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
          autoDeleteObjects: props.isDev || props.isEphemeral,
          enforceSSL: true,
          versioned: false,
          bucketName: `${commonProps.project}-${commonProps.stage}-s3-access-logs`,
          lifecycleRules: [
            {
              id: "ExpireOldFiles",
              expiration: Duration.days(commonProps.isEphemeral ? 7 : 90)
            }
          ]
        });

    const accessLogBucketCfn = accessLogs.node.defaultChild as aws_s3.CfnBucket;
    accessLogBucketCfn.cfnOptions.metadata = {
      checkov: {
        skip: [{
          id: "CKV_AWS_18",
          reason: "the access log bucket itself does not need access logs"
        },{
          id: "CKV_AWS_21",
          reason: "versioning on the access log bucket itself is intentionally disabled"
        }]
      }
    }

    new aws_kms.Key(this, "lambdaEnvEncryption", {
      enableKeyRotation: true,
      alias: `alias/demos-${props.stage}-lambda-env`,
    });

    new CfnOutput(commonProps.scope, "secretsManagerVpceSg", {
      value: secretsManagerEndpointSG.securityGroupId,
      exportName: `${commonProps.stage}SecretsManagerVpceSg`,
    });

    new CfnOutput(this, "cognitoAuthority", {
      value: cognito_outputs.authority,
      exportName: `${commonProps.stage}CognitoAuthority`,
    });

    new CfnOutput(this, "cognitoDomain", {
      value: cognito_outputs.domain,
      exportName: `${commonProps.stage}CognitoDomain`,
    });

    new CfnOutput(this, "cognitoClientId", {
      value: cognito_outputs.userPoolClientId,
      exportName: `${commonProps.stage}CognitoClientId`,
    });

    new CfnOutput(commonProps.scope, "accessLogBucketArn", {
      value: accessLogs.bucketArn,
      exportName: `${commonProps.stage}AccessLogBucketArn`,
    });

    this.cloudVpnSecurityGroup = aws_ec2.SecurityGroup.fromLookupByName(
      commonProps.scope,
      "vpnSecurityGroup",
      "cmscloud-vpn",
      vpc
    );
  }
}
