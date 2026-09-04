import { Construct } from "constructs";
import {
  Duration,
  Size,
  aws_ec2 as ec2,
  aws_events,
  aws_events_targets,
  aws_s3 as s3,
  aws_secretsmanager,
} from "aws-cdk-lib";
import { OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import path from "node:path";

import * as alarms from "./alarms";
import * as demosLambda from "./lambda";
import { DeploymentConfigProperties } from "../config";

// Pinned so the binding the afterBundling hook installs cannot drift from the version the
// lambda's own package-lock.json resolves.
const DUCKDB_VERSION = "1.5.5-r.4";

const EXPORT_TIMEOUT = Duration.minutes(15);

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

    const exportLambda = new demosLambda.Lambda(this, "dataConnectExport", {
      ...props,
      scope: this,
      entry: path.join(exportDir, "index.ts"),
      depsLockFilePath: path.join(exportDir, "package-lock.json"),
      handler: "index.handler",
      timeout: EXPORT_TIMEOUT,
      asCode: false,
      // @duckdb/node-api is external and installed by the afterBundling hook rather than
      // through nodeModules. CDK bundles locally, so npm runs on the musl build agent and
      // would resolve the musl binding, which cannot load on Lambda's glibc runtime.
      externalModules: [
        "@aws-sdk",
        "@aws-sdk/client-secrets-manager",
        "@aws-sdk/client-s3",
        "@duckdb/node-api",
      ],
      // pg, pg-cursor and pino are CommonJS: esbuild's ESM output turns their internal
      // require() into a shim that throws at cold start.
      nodeModules: ["pg", "pg-cursor", "pino"],
      // Same shape as the cert copy for emailer in stacks/api.ts.
      commandHooks: {
        // Runs after CDK has installed nodeModules, so this is the last word on which
        // binding ends up in the asset. --min-release-age overrides the 7 day floor in
        // deployment/.npmrc, which would otherwise refuse a recently published version.
        afterBundling(_inputDir: string, outputDir: string): string[] {
          return [
            [
              "npm install",
              `--prefix ${outputDir}`,
              "--os=linux --cpu=x64 --libc=glibc",
              "--no-save --ignore-scripts --min-release-age=0",
              `@duckdb/node-api@${DUCKDB_VERSION}`,
            ].join(" "),
          ];
        },
        beforeBundling() {
          return [];
        },
        beforeInstall() {
          return [];
        },
      },
      format: OutputFormat.ESM,
      memorySize: 3008,
      // COPY buffers a whole relation before writing, and every relation is staged to /tmp
      // before anything uploads.
      ephemeralStorageSize: Size.gibibytes(2),
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
    this.schedule.addTarget(new aws_events_targets.LambdaFunction(exportLambda.lambda));

    this.setupCloudWatchAlarms(props, alarmResources);

    dbSecret.grantRead(exportLambda.lambda);
    props.exportBucket.grantWrite(exportLambda.lambda);
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
