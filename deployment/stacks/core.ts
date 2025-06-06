import {
  CfnOutput,
  Stack,
  StackProps,
  aws_iam,
  aws_cognito,
  aws_ec2,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";

import * as cognito from "../lib/cognito";
import * as ssm from "../lib/ssm-parameter";
import * as securityGroup from "../lib/security-group";

export class CoreStack extends Stack {
  public readonly cognito_outputs: aws_cognito.UserPool;
  public readonly cognitoAuthorityParamName: string;
  public readonly cognitoClientIdParamName: string;
  public readonly vpcId?: string;
  public readonly vpc: aws_ec2.IVpc;
  public readonly secretsManagerVpceSg: aws_ec2.ISecurityGroup;
  public readonly cloudVpnSecurityGroup: aws_ec2.ISecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    props: StackProps & DeploymentConfigProperties
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

    const cognito_outputs = cognito.create(commonProps);
    this.cognito_outputs = cognito_outputs.userPool;

    const vpc = props.isLocalstack
      ? undefined
      : aws_ec2.Vpc.fromLookup(this, "vpc", {
          tags: {
            Name: `demos-east-${commonProps.stage}`,
          },
        });

    if (!vpc) {
      throw new Error("The specified VPC could not be found.");
    }

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

    const secretsManagerEndpointSG = securityGroup.create({
      ...commonProps,
      vpc,
      name: `${commonProps.project}-${commonProps.stage}-secrets-manager-vpce`,
    });

    vpc.addInterfaceEndpoint("secretsManagerEndpoint", {
      service: aws_ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: {
        subnets: vpc.privateSubnets,
      },
      securityGroups: [secretsManagerEndpointSG.securityGroup],
    });

    this.secretsManagerVpceSg = secretsManagerEndpointSG.securityGroup;
    new CfnOutput(commonProps.scope, "secretsManagerVpceSg", {
      value: secretsManagerEndpointSG.securityGroup.securityGroupId,
      exportName: `${commonProps.stage}SecretsManagerVpceSg`,
    });

    new CfnOutput(this, "cognitoAuthority", {
      value: cognito_outputs.authority,
      exportName: "cognitoAuthority",
    });

    this.cloudVpnSecurityGroup = aws_ec2.SecurityGroup.fromLookupByName(
      commonProps.scope,
      "vpnSecurityGroup",
      "cmscloud-vpn",
      vpc
    );
  }
}
