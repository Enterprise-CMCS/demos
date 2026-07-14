import {
  CfnOutput,
  Stack,
  StackProps,
  aws_iam,
  aws_ec2,
  aws_rds,
  aws_cloudwatch,
  RemovalPolicy,
  Duration,
  aws_secretsmanager,
  aws_kms,
  Fn,
  aws_lambda,
  aws_logs,
  IAspect,
  CfnResource,
  Aspects,
} from "aws-cdk-lib";
import { Construct, IConstruct } from "constructs";

import { DeploymentConfigProperties } from "../config";

import * as securityGroup from "../lib/security-group";
import * as alarms from "../lib/alarms";
import * as ssm from "../lib/ssm-parameter";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

interface DatabaseStackProps {
  vpc: aws_ec2.IVpc;
  cloudVpnSecurityGroup: aws_ec2.ISecurityGroup;
  secretsManagerVpceSg: aws_ec2.ISecurityGroup;
}

export class DatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & DeploymentConfigProperties & DatabaseStackProps) {
    super(scope, id, {
      ...props,
      terminationProtection: false,
    });

    const commonProps = {
      ...props,
      scope: this,
      iamPermissionsBoundary:
        props.iamPermissionsBoundaryArn == null
          ? undefined: aws_iam.ManagedPolicy.fromManagedPolicyArn(this, "iamPermissionsBoundary", props.iamPermissionsBoundaryArn),
    };
    const alarmResources = new alarms.CloudWatchAlarmRegistry();

    const rdsSecurityGroup = securityGroup.create({
      ...commonProps,
      name: `${commonProps.project}-${commonProps.stage}-rds-sg`,
    });

    const sharedServicesSg = aws_ec2.SecurityGroup.fromLookupByName(
      commonProps.scope,
      "vpnSecurityGroup",
      "cmscloud-shared-services",
      props.vpc
    );

    const cmsSecuritySg = aws_ec2.SecurityGroup.fromLookupByName(
      commonProps.scope,
      "cmsSecurityToolsSG",
      "cmscloud-security-tools",
      props.vpc
    );

    new CfnOutput(commonProps.scope, "dbSecurityGroupID", {
      value: rdsSecurityGroup.securityGroup.securityGroupId,
      exportName: `${commonProps.project}-${commonProps.stage}-rds-security-group-id`,
    });

    const rdsKMSKey = new aws_kms.Key(commonProps.scope, "rdsKmsKey", {
      enableKeyRotation: true,
      alias: `alias/${commonProps.project}-${commonProps.scope}-rds`,
      description: "KMS key for encrypting RDS",
    });

    const engine = aws_rds.DatabaseInstanceEngine.postgres({
          version: aws_rds.PostgresEngineVersion.VER_17_8,
        })

    const parameterGroup = new aws_rds.ParameterGroup(commonProps.scope, "rdsParameterGroup", {
      name: `demos-${commonProps.stage}-postgres-17`,
      engine,
      parameters: {
        shared_preload_libraries: "pg_stat_statements,pg_tle,pg_cron,pgaudit",
        "cron.database_name": "demos",
        ssl_min_protocol_version: "TLSv1.2",
        log_replication_commands: "on",
        log_disconnections: "on",
        log_connections: "on",
        log_line_prefix: "%m:%r:%u@%d:[%p]:%l:%e:%s:%v:%x:%c:%q%a:",
        log_statement: "ddl",
        log_error_verbosity: "verbose",
        log_rotation_size: "1000000",
        "rds.force_ssl": "1",
      }
    })

    const instanceSizeByStage: Partial<Record<string, aws_ec2.InstanceSize>> = {
      test: aws_ec2.InstanceSize.SMALL,
      impl: aws_ec2.InstanceSize.LARGE,
      prod: aws_ec2.InstanceSize.LARGE,
    }

    const instanceSize = instanceSizeByStage[props.stage] ?? aws_ec2.InstanceSize.MICRO

    const dbInstance = new aws_rds.DatabaseInstance(
      commonProps.scope,
      `${commonProps.project}-${commonProps.stage}-rds`,
      {
        engine,
        instanceType: aws_ec2.InstanceType.of(aws_ec2.InstanceClass.BURSTABLE4_GRAVITON, instanceSize),
        vpc: commonProps.vpc,
        vpcSubnets: { subnets: props.vpc.privateSubnets },
        multiAz:  commonProps.stage == "prod",
        allocatedStorage: 20,
        databaseName: "demos",
        storageType: aws_rds.StorageType.GP3,
        storageEncrypted: true,
        credentials: aws_rds.Credentials.fromGeneratedSecret("demos_admin", {
          secretName: `${commonProps.project}-${commonProps.stage}-rds-admin`,
        }),
        securityGroups: [rdsSecurityGroup.securityGroup, commonProps.cloudVpnSecurityGroup, sharedServicesSg, cmsSecuritySg],
        publiclyAccessible: false,
        removalPolicy: ["prod", "impl"].includes(commonProps.stage) ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
        deleteAutomatedBackups: true,
        instanceIdentifier: `${commonProps.project}-${commonProps.stage}-rds`,
        backupRetention: commonProps.stage == "prod" ? Duration.days(30) : Duration.days(7),
        cloudwatchLogsExports: ["postgresql", "upgrade"],
        cloudwatchLogsRetention: RetentionDays.THREE_MONTHS,
        storageEncryptionKey: rdsKMSKey,
        port: 15432,
        parameterGroup: parameterGroup,
        monitoringInterval:  ["prod", "impl"].includes(commonProps.stage) ?  Duration.seconds(60) : undefined
      }
    );
    alarmResources.registerDatabaseInstance("rds", dbInstance);

    const cfnDbInstance = dbInstance.node.defaultChild as aws_rds.CfnDBInstance;
    cfnDbInstance.cfnOptions.metadata = {
      checkov: {
        skip: [{
          id: "CKV_AWS_161",
          reason: "Using username/password with auto-rotations for now"
        },
        {
          id: "CKV_AWS_157",
          reason: "To save costs, lower environments will not use multi-az"
        },{
          id: "CKV_AWS_118",
          reason: "Enhanced monitoring is enabled in IMPL and PROD"
        }]
      }
    };

    Aspects.of(this).add(new SuppressCheckovLogRetentionPolicy());

    this.setupCloudWatchAlarms(commonProps, alarmResources);

    const cmsCloudLogFunc = aws_lambda.Function.fromFunctionName(
      commonProps.scope,
      "CMSCloudLoggingLambda",
      "cms-cloud-logging-cloudwatch-to-splunk"
    );
    for (const lg in dbInstance.cloudwatchLogGroups) {
      // dbInstance.cloudwatchLogGroups[lg].addSubscriptionFilter cannot be used
      // because the log group name contains a token and leads to errors.
      // CfnSubscriptionFilter can work with the tokens
      const lgName = dbInstance.cloudwatchLogGroups[lg].logGroupName;
      new aws_logs.CfnSubscriptionFilter(commonProps.scope, `${lg}SubFilter`, {
        filterName: `${lg}-to-splunk`,
        logGroupName: lgName,
        filterPattern: "",
        destinationArn: cmsCloudLogFunc.functionArn,
      });
    }

    const rdsPWRotationSecurityGroup = securityGroup.create({
      ...commonProps,
      name: `${commonProps.project}-${commonProps.stage}-rds-pw-rotation-sg`,
    });

    rdsPWRotationSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(rdsSecurityGroup.securityGroup.securityGroupId),
      aws_ec2.Port.tcp(dbInstance.instanceEndpoint.port),
      "Allow egress to RDS",
      true
    );

    const secretsManagerVpceSgId = Fn.importValue(`${commonProps.stage}SecretsManagerVpceSg`);

    rdsPWRotationSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(secretsManagerVpceSgId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to secrets manager VPCE"
    );

    rdsSecurityGroup.securityGroup.addIngressRule(
      aws_ec2.Peer.securityGroupId(rdsPWRotationSecurityGroup.securityGroup.securityGroupId),
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

  private setupCloudWatchAlarms(
    props: DeploymentConfigProperties,
    resources: alarms.CloudWatchAlarmRegistry
  ) {
    if (props.isEphemeral && !props.enableAlarms) {
      return;
    }

    const dbInstance = resources.databaseInstance("rds");
    const rdsAlarmPeriod = Duration.minutes(5);
    const gibibyte = 1024 * 1024 * 1024;
    const mebibyte = 1024 * 1024;

    alarms.createMetricAlarm({
      ...props,
      scope: this,
      id: "RdsFreeStorageSpaceAlarm",
      name: "rds-free-storage-space-low",
      description: "RDS free storage is below 5 GiB.",
      metric: dbInstance.metricFreeStorageSpace({
        period: rdsAlarmPeriod,
        statistic: "Average",
      }),
      threshold: 5 * gibibyte,
      comparisonOperator: aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    alarms.createMetricAlarm({
      ...props,
      scope: this,
      id: "RdsCpuUtilizationAlarm",
      name: "rds-cpu-utilization-high",
      description: "RDS CPU utilization is above 80% for 15 minutes.",
      metric: dbInstance.metricCPUUtilization({
        period: rdsAlarmPeriod,
        statistic: "Average",
      }),
      threshold: 80,
      comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 3,
      datapointsToAlarm: 3,
    });

    alarms.createMetricAlarm({
      ...props,
      scope: this,
      id: "RdsDatabaseConnectionsAlarm",
      name: "rds-database-connections-high",
      description: "RDS database connections are above the initial safe threshold.",
      metric: dbInstance.metricDatabaseConnections({
        period: rdsAlarmPeriod,
        statistic: "Average",
      }),
      threshold: 80,
      comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    alarms.createMetricAlarm({
      ...props,
      scope: this,
      id: "RdsFreeableMemoryAlarm",
      name: "rds-freeable-memory-low",
      description: "RDS freeable memory is below 128 MiB.",
      metric: dbInstance.metricFreeableMemory({
        period: rdsAlarmPeriod,
        statistic: "Average",
      }),
      threshold: 128 * mebibyte,
      comparisonOperator: aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    alarms.createMetricAlarm({
      ...props,
      scope: this,
      id: "RdsReadLatencyAlarm",
      name: "rds-read-latency-high",
      description: "RDS read latency is above 100 ms.",
      metric: dbInstance.metric("ReadLatency", {
        period: rdsAlarmPeriod,
        statistic: "Average",
      }),
      threshold: 0.1,
      comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    alarms.createMetricAlarm({
      ...props,
      scope: this,
      id: "RdsWriteLatencyAlarm",
      name: "rds-write-latency-high",
      description: "RDS write latency is above 100 ms.",
      metric: dbInstance.metric("WriteLatency", {
        period: rdsAlarmPeriod,
        statistic: "Average",
      }),
      threshold: 0.1,
      comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    alarms.createMetricAlarm({
      ...props,
      scope: this,
      id: "RdsDiskQueueDepthAlarm",
      name: "rds-disk-queue-depth-high",
      description: "RDS disk queue depth is above 5.",
      metric: dbInstance.metric("DiskQueueDepth", {
        period: rdsAlarmPeriod,
        statistic: "Average",
      }),
      threshold: 5,
      comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });
  }
}

class SuppressCheckovLogRetentionPolicy implements IAspect {
  visit(node: IConstruct): void {
    if (!CfnResource.isCfnResource(node)) return;
    if (node.cfnResourceType === "AWS::IAM::Policy") {

      const path = node.node.path;

      if (
        path.includes("/LogRetention") &&
        path.endsWith("/ServiceRole/DefaultPolicy/Resource")
      ) {
        node.addMetadata("checkov", {
          skip: [
            {
              id: "CKV_AWS_111",
              comment:
                "CDK-managed LogRetention custom resource role; only used to apply CloudWatch Logs retention. Not worth updating or managing",
            },
          ],
        });
      }
    }

    if (node.cfnResourceType === "AWS::SecretsManager::Secret") {
      const path = node.node.path
      if (path.includes("demos-dev-rds/Secret/Resource")) {
        node.addMetadata("checkov", {
          skip: [
            {
              id: "CKV_AWS_149",
              reason: "Sticking with AWS owned KMS key for now. Can revisit a CMK in the future"
            }
          ]
        })
      }
    }
  }
}
