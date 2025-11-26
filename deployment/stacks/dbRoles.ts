import {
  aws_ec2,
  aws_iam,
  aws_lambda,
  aws_secretsmanager,
  CustomResource,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { IVpc } from "aws-cdk-lib/aws-ec2";

import { DeploymentConfigProperties } from "../config";

import * as lambda from "../lib/lambda";
import * as securityGroup from "../lib/security-group";
import importNumberValue from "../util/importNumberValue";
import { Provider } from "aws-cdk-lib/custom-resources";
import * as databaseRoles from "../databaseRoles";
import { CfnFunction } from "aws-cdk-lib/aws-lambda";

interface DBRoleStackProps extends StackProps, DeploymentConfigProperties {
  vpc: IVpc;
}

export class DBRoleStack extends Stack {
  constructor(scope: Construct, id: string, props: DBRoleStackProps) {
    super(scope, id, {
      ...props,
      terminationProtection: false,
    });


    const dbRoleManagementSecurityGroup = securityGroup.create({
      ...props,
      name: "dbRoleManagementSG",
      vpc: props.vpc,
      scope: this,
    });

    const rdsSecurityGroupId = Fn.importValue(`${props.project}-${props.hostEnvironment}-rds-security-group-id`);
    const rdsPort = importNumberValue(`${props.project}-${props.hostEnvironment}-rds-port`);
    const rdsSg = aws_ec2.SecurityGroup.fromSecurityGroupId(this, "rdsSg", rdsSecurityGroupId);

    rdsSg.addIngressRule(
      aws_ec2.Peer.securityGroupId(dbRoleManagementSecurityGroup.securityGroup.securityGroupId),
      aws_ec2.Port.tcp(rdsPort)
    );

    dbRoleManagementSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(rdsSecurityGroupId),
      aws_ec2.Port.tcp(rdsPort),
      "Allow egress to RDS",
      true
    );

    const secretsManagerVpceSgId = Fn.importValue(`${props.stage}SecretsManagerVpceSg`);

    dbRoleManagementSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(secretsManagerVpceSgId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to secrets manager VPCE"
    );

    const s3PrefixList = aws_ec2.PrefixList.fromLookup(this, "s3PrefixList", {
      prefixListName: `com.amazonaws.${this.region}.s3`,
    });

    // Egress to S3 is required for responding to cloudformation with statuses
    dbRoleManagementSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.prefixList(s3PrefixList.prefixListId),
      aws_ec2.Port.tcp(443)
    );

    const ssmSg = aws_ec2.SecurityGroup.fromLookupByName(
      this,
      "ssmSecurityGroup",
      `${props.project}-${props.hostEnvironment}-${props.project}-${props.hostEnvironment}-ssm-vpce`,
      props.vpc
    );

    dbRoleManagementSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(ssmSg.securityGroupId),
      aws_ec2.Port.HTTPS
    );

    const roleManagmentLambda = new lambda.Lambda(this, "dbRoleManagement", {
      ...props,
      scope: this,
      entry: "../lambdas/dbRoleManagement/index.ts",
      handler: "index.handler",
      vpc: props.vpc,
      securityGroup: dbRoleManagementSecurityGroup.securityGroup,
      asCode: false,
      externalModules: ["@aws-sdk"],
      nodeModules: ["pg", "pino"],
      timeout: Duration.minutes(2),
      environment: {
        DATABASE_SECRET_ARN: `demos-${props.hostEnvironment}-rds-admin`, // pragma: allowlist secret
        STAGE: props.hostEnvironment,
        NODE_EXTRA_CA_CERTS: "/var/runtime/ca-cert.pem",
      },
      depsLockFilePath: "../lambdas/dbRoleManagement/package-lock.json",
    });

    roleManagmentLambda.role.addToPolicy(
      new aws_iam.PolicyStatement({
        actions: ["ssm:PutParameter", "ssm:DeleteParameter", "ssm:DeleteParameters"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/demos/${props.hostEnvironment}/db-temp-password/*`,
        ],
      })
    );

    roleManagmentLambda.role.addToPolicy(
      new aws_iam.PolicyStatement({
        actions: [
          "secretsmanager:CreateSecret",
          "secretsmanager:DeleteSecret",
          "secretsmanager:UpdateSecret",
          "secretsmanager:DescribeSecret",
          "secretsmanager:RotateSecret",
        ],
        resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:demos-${props.hostEnvironment}*`],
      })
    );

    roleManagmentLambda.role.addToPolicy(
      new aws_iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [
          `arn:aws:lambda:${this.region}:${this.account}:function:demos-${props.hostEnvironment}-rds-rotation`,
        ],
      })
    );

    const dbSecret = aws_secretsmanager.Secret.fromSecretNameV2(
      this,
      "rdsDatabaseSecret",
      `demos-${props.hostEnvironment}-rds-admin`
    );
    dbSecret.grantRead(roleManagmentLambda.lambda);

    const crp = new Provider(this, "rolesCrp", {
      onEventHandler: roleManagmentLambda.lambda,
    });

    // This override is needed because the latest JS version is returned as node
    // 22 and the function is internal to CDK
    const il = crp.node.tryFindChild("framework-onEvent")?.node.defaultChild as CfnFunction
    il.runtime = aws_lambda.Runtime.NODEJS_24_X.name

    const cr = new CustomResource(this, "dbRoles", {
      serviceToken: crp.serviceToken,
      removalPolicy: RemovalPolicy.DESTROY,
      properties: {
        roles: databaseRoles[props.hostEnvironment],
      },
    });
    cr.node.addDependency(crp);
  }
}
