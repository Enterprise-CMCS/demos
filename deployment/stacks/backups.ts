import {
  Stack,
  StackProps,
  aws_iam,
  Duration,
  Fn,
  aws_ec2,
  aws_backup,
  aws_rds,
  aws_events,
  aws_events_targets,
  aws_secretsmanager,
  aws_s3,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";

import * as lambda from "../lib/lambda";
import * as path from "node:path";
import importNumberValue from "../util/importNumberValue";
import * as securityGroup from "../lib/security-group";
import { IVpc } from "aws-cdk-lib/aws-ec2";

interface BackupStackProps extends StackProps, DeploymentConfigProperties {
  vpc: IVpc;
}

export class BackupStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & DeploymentConfigProperties & BackupStackProps) {
    super(scope, id, {
      ...props,
      terminationProtection: false,
    });

    const commonProps = {
      ...props,
      scope: this,
      iamPermissionsBoundary:
        props.iamPermissionsBoundaryArn == null
          ? undefined
          : aws_iam.ManagedPolicy.fromManagedPolicyArn(this, "iamPermissionsBoundary", props.iamPermissionsBoundaryArn),
    };

    const backupValidationSecurityGroup = securityGroup.create({
      ...props,
      name: "backupValidationSecurityGroup",
      vpc: props.vpc,
      scope: this,
    });

    const secretsManagerVpceSgId = Fn.importValue(`${props.stage}SecretsManagerVpceSg`);

    backupValidationSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(secretsManagerVpceSgId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to secrets manager VPCE",
    );

    const s3PrefixList = aws_ec2.PrefixList.fromLookup(this, "s3PrefixList", {
      prefixListName: `com.amazonaws.${this.region}.s3`,
    });

    backupValidationSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.prefixList(s3PrefixList.prefixListId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to S3",
    );

    backupValidationSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.anyIpv4(),
      aws_ec2.Port.HTTPS,
      "Allow https outbound",
    );

    const dbSecret = aws_secretsmanager.Secret.fromSecretNameV2(
      commonProps.scope,
      "rdsDatabaseSecret",
      `demos-${commonProps.hostEnvironment}-rds-demos_server`,
    );

    const libPath = path.join(".", "lib");
    const rel = path.resolve(libPath);
    const validationLambda = lambda.create(
      {
        ...commonProps,
        entry: path.join(rel, "validateBackups.ts"),
        handler: "index.handler",
        asCode: false,
        timeout: Duration.minutes(3),
        vpc: props.vpc,
        securityGroup: backupValidationSecurityGroup.securityGroup,
        environment: {
          DATABASE_SECRET_ARN: dbSecret.secretName,
        },
      },
      "backup-validation",
    );
    validationLambda.lambda.role.addToPolicy(
      new aws_iam.PolicyStatement({
        sid: "AllowS3List",
        effect: aws_iam.Effect.ALLOW,
        actions: ["s3:ListBucket", "s3:HeadObject", "s3:GetObject"],
        resources: ["arn:aws:s3:::awsbackup-restore*", "arn:aws:s3:::demos*"],
      }),
    );
    validationLambda.lambda.role.addToPolicy(
      new aws_iam.PolicyStatement({
        sid: "AllowValidationResults",
        effect: aws_iam.Effect.ALLOW,
        actions: ["backup:PutRestoreValidationResult"],
        resources: ["*"],
      }),
    );
    validationLambda.lambda.role.addToPolicy(
      new aws_iam.PolicyStatement({
        sid: "AllowDescribeRDS",
        effect: aws_iam.Effect.ALLOW,
        actions: ["rds:DescribeDBInstances"],
        resources: ["*"],
      }),
    );

    dbSecret.grantRead(validationLambda.lambda.role);

    const rdsSecurityGroupId = Fn.importValue(`${props.project}-${props.hostEnvironment}-rds-security-group-id`);

    const rdsPort = importNumberValue(`${props.project}-${props.hostEnvironment}-rds-port`);

    const rdsSg = aws_ec2.SecurityGroup.fromSecurityGroupId(this, "rdsSg", rdsSecurityGroupId);

    rdsSg.addIngressRule(
      aws_ec2.Peer.securityGroupId(backupValidationSecurityGroup.securityGroup.securityGroupId),
      aws_ec2.Port.tcp(rdsPort),
    );

    backupValidationSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(rdsSecurityGroupId),
      aws_ec2.Port.tcp(rdsPort),
      "Allow egress to RDS",
      true,
    );

    /// Restore Testing Plan

    const backupVault = aws_backup.BackupVault.fromBackupVaultName(this, "CmsOitVault", "CMS_OIT_Backups_Vault");
    const backupRole = aws_iam.Role.fromRoleName(this, "defaultBackupRole", "service-role/AWSBackupDefaultServiceRole");

    const plan = new aws_backup.CfnRestoreTestingPlan(this, "RestoreTestingPlan", {
      restoreTestingPlanName: `${props.stage}_Restore_Testing`,
      scheduleExpression: "cron(30 12 20 * ? *)",
      scheduleExpressionTimezone: "America/New_York",
      startWindowHours: 1,
      recoveryPointSelection: {
        algorithm: "LATEST_WITHIN_WINDOW",
        includeVaults: [backupVault.backupVaultArn],
        recoveryPointTypes: ["SNAPSHOT", "CONTINUOUS"],
        selectionWindowDays: 7,
      },
    });

    const databaseInstance = aws_rds.DatabaseInstance.fromLookup(this, "rdsProtectedInstance", {
      instanceIdentifier: `demos-${props.hostEnvironment}-rds`,
    });

    const subnetGroup = new aws_rds.SubnetGroup(this, "rdsRestoreTestingSubnetGroup", {
      vpc: props.vpc,
      description: "Subnet group to be used by restore testing",
      vpcSubnets: {subnets: props.vpc.privateSubnets},
      subnetGroupName: `demos-${props.stage}-restore-test-subnet-group`
    })

    const selection = new aws_backup.CfnRestoreTestingSelection(this, "RdsRestoreTestSelection", {
      restoreTestingPlanName: plan.ref,
      restoreTestingSelectionName: `${props.stage}_rds`,
      iamRoleArn: backupRole.roleArn,
      protectedResourceType: "RDS",
      protectedResourceArns: [databaseInstance.instanceArn],
      validationWindowHours: 24,
      restoreMetadataOverrides: {
        dbSubnetGroupName: subnetGroup.subnetGroupName,
        vpcSecurityGroupIds: JSON.stringify(
          databaseInstance.connections.securityGroups.map((sg) => sg.securityGroupId),
        ),
        dbParameterGroupName: `demos-${props.hostEnvironment}-postgres-17`,
      },
    });
    selection.node.addDependency(plan);

    const cleanBucketName = Fn.importValue(`${props.stage}CleanBucketName`);
    const cleanBucket = aws_s3.Bucket.fromBucketName(this, "cleanBucket", cleanBucketName);
    const selectionS3 = new aws_backup.CfnRestoreTestingSelection(this, "cleanBucketRestoreTestSelection", {
      restoreTestingPlanName: plan.ref,
      restoreTestingSelectionName: `${props.stage}_clean_bucket`,
      iamRoleArn: backupRole.roleArn,
      protectedResourceType: "S3",
      protectedResourceArns: [cleanBucket.bucketArn],
      validationWindowHours: 24,
    });
    selectionS3.node.addDependency(plan);

    const awsBackupRestoreAction = new aws_events.Rule(this, "awsBackupRestoreAction", {
      ruleName: `demos-${props.stage}-backup-restore-action`,
      description: `A backup restore action has completed`,
      eventPattern: {
        source: ["aws.backup"],
        detailType: ["Restore Job State Change"],
        detail: {
          restoreTestingPlanArn: [plan.restoreTestingPlanRef.restoreTestingPlanArn],
          status: ["COMPLETED"],
        },
      },
    });

    awsBackupRestoreAction.addTarget(new aws_events_targets.LambdaFunction(validationLambda.lambda.lambda));
  }
}
