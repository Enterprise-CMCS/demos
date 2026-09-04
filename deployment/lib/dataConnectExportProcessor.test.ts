import { App, Stack, aws_s3 } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { BUNDLING_STACKS } from "aws-cdk-lib/cx-api";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { DataConnectExportProcessor, duckdbVersionFromLockFile } from "./dataConnectExportProcessor";
import { DeploymentConfigProperties } from "../config";

const mockProps: DeploymentConfigProperties = {
  project: "demos",
  isDev: true,
  isLocalstack: false,
  isEphemeral: false,
  stage: "unittest",
  zScalerIps: ["0.0.0.0"],
  hostEnvironment: "dev",
  cloudfrontHost: "unittest.demos.com",
  srrConfigured: false,
  dataConnectRoleArn: "arn:aws:iam::1234567890:role/dataconnectrole",
};

function synth(overrides: Partial<DeploymentConfigProperties> = {}) {
  const app = new App({ context: { [BUNDLING_STACKS]: [] } });
  const stack = new Stack(app, "dataConnectExportProcessorTest", {
    env: { account: "0123456789", region: "us-east-1" },
  });

  new DataConnectExportProcessor(stack, "DataConnectExportProcessor", {
    ...mockProps,
    ...overrides,
    exportBucket: new aws_s3.Bucket(stack, "MockExportBucket"),
  });

  return Template.fromStack(stack);
}

describe("DataConnectExportProcessor construct", () => {
  it("synthesizes a single lambda with the export secret and bucket in its environment", () => {
    const template = synth();

    template.resourceCountIs("AWS::Lambda::Function", 1);
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "demos-unittest-dataConnectExport",
      Handler: "index.handler",
      Timeout: 900,
      MemorySize: 3008,
      Environment: {
        Variables: Match.objectLike({
          DATABASE_SECRET_ARN: "demos-dev-rds-demos_export", // pragma: allowlist secret
          DB_SSL_MODE: "verify-full",
          EXPORT_BUCKET: Match.anyValue(),
        }),
      },
    });
  });

  it("reserves concurrency and enlarges /tmp", () => {
    // Both come from the props added to the shared construct. Staging paths are fixed per
    // relation, and COPY buffers a whole relation, so neither is decorative.
    synth().hasResourceProperties("AWS::Lambda::Function", {
      ReservedConcurrentExecutions: 1,
      EphemeralStorage: { Size: 2048 },
    });
  });

  it("schedules the export at 07:00 UTC and enables the rule outside ephemeral stages", () => {
    synth().hasResourceProperties("AWS::Events::Rule", {
      Name: "demos-unittest-dataconnect-export",
      ScheduleExpression: "cron(0 7 * * ? *)",
      State: "ENABLED",
    });
  });

  it("disables the schedule in an ephemeral stage", () => {
    // An ephemeral stage has no demos_export role, so a firing rule would only produce a
    // nightly failure.
    synth({ isEphemeral: true, enableAlarms: true }).hasResourceProperties("AWS::Events::Rule", {
      Name: "demos-unittest-dataconnect-export",
      State: "DISABLED",
    });
  });

  it("targets the lambda from the rule and lets EventBridge invoke it", () => {
    const template = synth();

    template.hasResourceProperties("AWS::Events::Rule", {
      Targets: Match.arrayWith([
        Match.objectLike({ Arn: Match.objectLike({ "Fn::GetAtt": Match.anyValue() }) }),
      ]),
    });
    template.hasResourceProperties("AWS::Lambda::Permission", {
      Action: "lambda:InvokeFunction",
      Principal: "events.amazonaws.com",
    });
  });

  it("grants write to the export bucket but not read", () => {
    const template = synth();
    const policies = Object.values(template.findResources("AWS::IAM::Policy"));

    const bucketActions = policies
      .flatMap((policy) => policy.Properties.PolicyDocument.Statement as { Action: unknown }[])
      .flatMap((statement) =>
        Array.isArray(statement.Action) ? statement.Action : [statement.Action]
      )
      .filter((action): action is string => typeof action === "string" && action.startsWith("s3:"));

    expect(bucketActions).toContain("s3:PutObject");
    expect(bucketActions).not.toContain("s3:GetObject");
  });

  it("grants read on the export database secret", () => {
    const template = synth();
    const policies = Object.values(template.findResources("AWS::IAM::Policy"));

    const secretActions = policies
      .flatMap((policy) => policy.Properties.PolicyDocument.Statement as { Action: unknown }[])
      .flatMap((statement) =>
        Array.isArray(statement.Action) ? statement.Action : [statement.Action]
      )
      .filter(
        (action): action is string =>
          typeof action === "string" && action.startsWith("secretsmanager:")
      );

    expect(secretActions).toContain("secretsmanager:GetSecretValue");
  });

  it("registers errors, duration and throttle alarms", () => {
    const template = synth();

    template.resourceCountIs("AWS::CloudWatch::Alarm", 3);
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-data-connect-export-lambda-errors",
      MetricName: "Errors",
      Namespace: "AWS/Lambda",
      Period: 300,
      Statistic: "Sum",
      Threshold: 0,
    });
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-data-connect-export-lambda-duration-near-timeout",
      MetricName: "Duration",
      Namespace: "AWS/Lambda",
      Statistic: "Maximum",
      // 80% of the 15 minute timeout.
      Threshold: 720000,
    });
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "demos-unittest-data-connect-export-lambda-throttles",
      MetricName: "Throttles",
      Namespace: "AWS/Lambda",
      Threshold: 0,
    });
  });

  it("does not synthesize alarms when ephemeral", () => {
    const template = synth({ isEphemeral: true });

    template.resourceCountIs("AWS::Lambda::Function", 1);
    template.resourceCountIs("AWS::CloudWatch::Alarm", 0);
  });
});

describe("duckdbVersionFromLockFile", () => {
  const lambdaLockFile = path.resolve(
    process.cwd(),
    "..",
    "lambdas",
    "dataConnectExport",
    "package-lock.json"
  );

  it("resolves the version the lambda itself will install", () => {
    // Read independently here rather than asserting a literal, because a literal in this test
    // would be the very second source of truth the resolver exists to remove.
    const lockFile = JSON.parse(readFileSync(lambdaLockFile, "utf8")) as {
      packages: Record<string, { version: string }>;
    };

    expect(duckdbVersionFromLockFile(lambdaLockFile)).toBe(
      lockFile.packages["node_modules/@duckdb/node-api"].version
    );
  });

  it("returns an exact version, never a range", () => {
    // npm install @duckdb/node-api@^1.5.5 would resolve on the build agent rather than here,
    // which is exactly the non-determinism the pin exists to prevent.
    expect(duckdbVersionFromLockFile(lambdaLockFile)).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("throws rather than letting npm pick a version when the lockfile has no entry", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "duckdb-lock-"));
    const emptyLock = path.join(dir, "package-lock.json");
    writeFileSync(emptyLock, JSON.stringify({ lockfileVersion: 3, packages: {} }));

    // Assert the path rather than wildcarding over it. Naming the offending lockfile is what
    // makes this error actionable, and a wildcard there also matched when the path was absent.
    expect(() => duckdbVersionFromLockFile(emptyLock)).toThrow(
      `@duckdb/node-api is not resolved in ${emptyLock}`
    );

    rmSync(dir, { recursive: true, force: true });
  });
});
