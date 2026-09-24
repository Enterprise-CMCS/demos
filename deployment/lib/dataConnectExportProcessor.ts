import { Construct } from "constructs";
import {
  Duration,
  aws_ec2 as ec2,
  aws_events,
  aws_events_targets,
  aws_lambda,
  aws_s3 as s3,
  aws_secretsmanager,
} from "aws-cdk-lib";
import { OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import path from "node:path";

import * as alarms from "./alarms";
import * as demosLambda from "./lambda";
import { DeploymentConfigProperties } from "../config";
import { NagSuppressions } from "cdk-nag";

const EXPORT_TIMEOUT = Duration.minutes(15);

// Use one architecture for both Lambda registration and npm binding selection.
const LAMBDA_ARCHITECTURE = aws_lambda.Architecture.X86_64;

const NPM_CPU_BY_ARCHITECTURE: Record<string, string> = {
  x86_64: "x64",
  arm64: "arm64",
};

/**
 * Targets CDK's dependency install at the Lambda platform.
 *
 * npm otherwise selects DuckDB's native binding for the Alpine build agent.
 * Deriving the CPU from the Lambda architecture keeps the asset and runtime in
 * sync. This dependency tree does not need install scripts.
 */
export function bundlingEnvironmentFor(architecture: aws_lambda.Architecture): {
  [key: string]: string;
} {
  const cpu = NPM_CPU_BY_ARCHITECTURE[architecture.name];

  if (!cpu) {
    throw new Error(
      `No npm --cpu value is known for the ${architecture.name} architecture. Without one the ` +
        "asset would carry whichever DuckDB binding the build agent resolves for itself."
    );
  }

  return {
    npm_config_os: "linux",
    npm_config_cpu: cpu,
    npm_config_libc: "glibc",
    npm_config_ignore_scripts: "true",
  };
}

interface DataConnectExportProcessorProps extends DeploymentConfigProperties {
  exportBucket: s3.IBucket;
  vpc?: ec2.IVpc;
  securityGroup?: ec2.ISecurityGroup | ec2.ISecurityGroup[];
}

export class DataConnectExportProcessor extends Construct {
  public readonly schedule: aws_events.Rule;

  constructor(scope: Construct, id: string, props: DataConnectExportProcessorProps) {
    super(scope, id);

    const alarmResources = new alarms.CloudWatchAlarmRegistry();

    const dbSecret = aws_secretsmanager.Secret.fromSecretNameV2(
      this,
      "rdsDataConnectExportDatabaseSecret",
      `demos-${props.hostEnvironment}-rds-demos_export`
    );

    const exportDir = path.resolve(process.cwd(), "..", "lambdas", "dataConnectExport");
    const exportLockFile = path.join(exportDir, "package-lock.json");

    const exportLambda = new demosLambda.Lambda(this, "dataConnectExport", {
      ...props,
      scope: this,
      entry: path.join(exportDir, "index.ts"),
      depsLockFilePath: exportLockFile,
      handler: "index.handler",
      timeout: EXPORT_TIMEOUT,
      asCode: false,
      externalModules: ["@aws-sdk", "@aws-sdk/client-secrets-manager", "@aws-sdk/client-s3"],
      // pg, pg-copy-streams and pino are CommonJS: esbuild's ESM output turns their internal
      // require() into a shim that throws at cold start. DuckDB stays external because esbuild
      // cannot bundle its native .node file. CDK installs it from the Lambda lockfile using the
      // platform settings below.
      nodeModules: ["pg", "pg-copy-streams", "pino", "@duckdb/node-api"],
      architecture: LAMBDA_ARCHITECTURE,
      bundlingEnvironment: bundlingEnvironmentFor(LAMBDA_ARCHITECTURE),
      format: OutputFormat.ESM,
      memorySize: 1769,
      // Staging paths are fixed per relation, so two concurrent runs would overwrite each
      // other's files.
      reservedConcurrentExecutions: 1,
      vpc: props.vpc,
      securityGroup: props.securityGroup,
      environment: {
        DB_SSL_MODE: "verify-full",
        DATABASE_SECRET_ARN: dbSecret.secretName, // pragma: allowlist secret
        EXPORT_BUCKET: props.exportBucket.bucketName,
        LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
        NODE_EXTRA_CA_CERTS: "/var/runtime/ca-cert.pem",
      },
    });
    alarmResources.registerLambda("dataConnectExport", exportLambda.lambda);

    exportLambda.lambda.configureAsyncInvoke({
      retryAttempts: 1,
    });

    this.schedule = new aws_events.Rule(this, "DataConnectExportSchedule", {
      ruleName: `demos-${props.stage}-dataconnect-export`,
      description: "Nightly DataConnect parquet export",
      // Rule schedules are UTC only, and there is no timezone property on AWS::Events::Rule.
      // Firing on the same clock that stamps the dt= partition keeps the two in agreement.
      schedule: aws_events.Schedule.cron({ minute: "0", hour: "7" }),
      // An ephemeral stage cannot provision its own demos_export role, so leaving the rule
      // enabled there would produce a nightly failure against a role that does not exist.
      enabled: !props.isEphemeral,
    });
    this.schedule.addTarget(new aws_events_targets.LambdaFunction(exportLambda.lambda)
    );

    this.setupCloudWatchAlarms(props, alarmResources);

    dbSecret.grantRead(exportLambda.lambda);
    // grantWrite would also hand over s3:DeleteObject*, which this lambda never calls. Published
    // snapshots are what the DataConnect consumers read, so the exporter should not be able to
    // remove them.
    props.exportBucket.grantPut(exportLambda.lambda);

    NagSuppressions.addResourceSuppressions(exportLambda.role, [
      {
        id: "AwsSolutions-IAM5",
        reason: "Permissions are scoped to specific KMS key and UiPath documents bucket; S3 object ARNs require wildcard suffix.",
      },
    ], true)
  }

  private setupCloudWatchAlarms(
    props: DeploymentConfigProperties,
    resources: alarms.CloudWatchAlarmRegistry
  ) {
    if (props.isEphemeral && !props.enableAlarms) {
      return;
    }

    const alarmPeriod = Duration.minutes(5);

    alarms.createLambdaErrorsAlarm({
      ...props,
      scope: this,
      id: "DataConnectExportLambdaErrorsAlarm",
      name: "data-connect-export-lambda-errors",
      description: "DataConnect export Lambda has one or more errors in a 5-minute period.",
      lambdaFunction: resources.lambda("dataConnectExport"),
      period: alarmPeriod,
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    alarms.createLambdaDurationAlarm({
      ...props,
      scope: this,
      id: "DataConnectExportLambdaDurationAlarm",
      name: "data-connect-export-lambda-duration-near-timeout",
      description: "DataConnect export Lambda duration is above 80% of its configured timeout.",
      lambdaFunction: resources.lambda("dataConnectExport"),
      period: alarmPeriod,
      threshold: Duration.seconds(EXPORT_TIMEOUT.toSeconds() * 0.8),
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    alarms.createLambdaThrottlesAlarm({
      ...props,
      scope: this,
      id: "DataConnectExportLambdaThrottlesAlarm",
      name: "data-connect-export-lambda-throttles",
      description:
        "DataConnect export Lambda has one or more throttled invocations in a 5-minute period.",
      lambdaFunction: resources.lambda("dataConnectExport"),
      period: alarmPeriod,
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });
  }
}
