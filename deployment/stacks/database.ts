import {
  CfnOutput,
  Stack,
  StackProps,
  aws_iam,
  aws_ec2,
  aws_rds,
  RemovalPolicy,
  Duration,
  aws_secretsmanager,
  aws_kms,
  Fn,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";

import * as securityGroup from "../lib/security-group";
import * as ssm from "../lib/ssm-parameter";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

interface DatabaseStackProps {
  vpc: aws_ec2.IVpc;
  cloudVpnSecurityGroup: aws_ec2.ISecurityGroup;
  secretsManagerVpceSg: aws_ec2.ISecurityGroup;
}

export class DatabaseStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps & DeploymentConfigProperties & DatabaseStackProps
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

    const rdsSecurityGroup = securityGroup.create({
      ...commonProps,
      name: `${commonProps.project}-${commonProps.stage}-rds-sg`,
    });

    new CfnOutput(commonProps.scope, "dbSecurityGroupID", {
      value: rdsSecurityGroup.securityGroup.securityGroupId,
      exportName: `${commonProps.project}-${commonProps.stage}-rds-security-group-id`,
    });

    const rdsKMSKey = new aws_kms.Key(commonProps.scope, "rdsKmsKey", {
      enableKeyRotation: true,
      alias: `alias/${commonProps.project}-${commonProps.scope}-rds`,
      description: "KMS key for encrypting RDS",
    });

    const dbInstance = new aws_rds.DatabaseInstance(
      commonProps.scope,
      `${commonProps.project}-${commonProps.stage}-rds`,
      {
        engine: aws_rds.DatabaseInstanceEngine.postgres({
          version: aws_rds.PostgresEngineVersion.VER_17_4,
        }),
        instanceType: aws_ec2.InstanceType.of(
          aws_ec2.InstanceClass.BURSTABLE4_GRAVITON,
          aws_ec2.InstanceSize.MICRO
        ),
        vpc: commonProps.vpc,
        vpcSubnets: { subnets: props.vpc.privateSubnets },
        multiAz: commonProps.stage == "prod",
        allocatedStorage: 20,
        databaseName: "demos",
        storageType: aws_rds.StorageType.GP3,
        storageEncrypted: true,
        credentials: aws_rds.Credentials.fromGeneratedSecret("demos_admin", {
          secretName: `${commonProps.project}-${commonProps.stage}-rds-admin`,
        }),
        securityGroups: [
          rdsSecurityGroup.securityGroup,
          commonProps.cloudVpnSecurityGroup,
        ],
        publiclyAccessible: false,
        removalPolicy: ["prod", "impl"].includes(commonProps.stage)
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
        deleteAutomatedBackups: true,
        instanceIdentifier: `${commonProps.project}-${commonProps.stage}-rds`,
        backupRetention: Duration.days(7),
        cloudwatchLogsExports: ["postgresql", "upgrade"],
        cloudwatchLogsRetention: RetentionDays.THREE_MONTHS,
        storageEncryptionKey: rdsKMSKey,
        port: 15432,
      }
    );

    const rdsPWRotationSecurityGroup = securityGroup.create({
      ...commonProps,
      name: `${commonProps.project}-${commonProps.stage}-rds-pw-rotation-sg`,
    });

    rdsPWRotationSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(
        rdsSecurityGroup.securityGroup.securityGroupId
      ),
      aws_ec2.Port.tcp(dbInstance.instanceEndpoint.port),
      "Allow egress to RDS",
      true
    );

    const secretsManagerVpceSgId = Fn.importValue(
      `${commonProps.stage}SecretsManagerVpceSg`
    );

    rdsPWRotationSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(secretsManagerVpceSgId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to secrets manager VPCE"
    );

    rdsSecurityGroup.securityGroup.addIngressRule(
      aws_ec2.Peer.securityGroupId(
        rdsPWRotationSecurityGroup.securityGroup.securityGroupId
      ),
      aws_ec2.Port.tcp(dbInstance.instanceEndpoint.port),
      "Allow ingress from PW rotation lambda",
      true
    );

    dbInstance.secret?.addRotationSchedule("rdsRotationSchedule", {
      automaticallyAfter: Duration.days(30),
      hostedRotation: aws_secretsmanager.HostedRotation.postgreSqlSingleUser({
        vpc: commonProps.vpc,
        functionName: `${commonProps.project}-${commonProps.stage}-rds-rotation`,
        vpcSubnets: {
          subnetType: aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [rdsPWRotationSecurityGroup.securityGroup],
      }),
    });

    ssm.create({
      ...commonProps,
      name: "rdsHost",
      value: dbInstance.instanceEndpoint.hostname,
    });
    ssm.create({
      ...commonProps,
      name: "dbPort",
      value: dbInstance.instanceEndpoint.port.toString(),
    });

    new CfnOutput(commonProps.scope, "dbHost", {
      value: dbInstance.instanceEndpoint.hostname,
      exportName: `${commonProps.project}-${commonProps.stage}-rds-hostname`,
    });

    new CfnOutput(commonProps.scope, "dbPort", {
      value: dbInstance.instanceEndpoint.port.toString(),
      exportName: `${commonProps.project}-${commonProps.stage}-rds-port`,
    });
  }
}
