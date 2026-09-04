import { App, Stack, aws_s3 } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { BUNDLING_STACKS } from "aws-cdk-lib/cx-api";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  DataConnectExportProcessor,
  duckdbInstallCommand,
  duckdbVersionFromLockFile,
  minReleaseAgeFromNpmrc,
} from "./dataConnectExportProcessor";
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
          // Match.anyValue() here accepted a hardcoded bucket name, so the reference is
          // asserted instead. The lambda writing to the wrong bucket is the failure this
          // variable exists to prevent.
          EXPORT_BUCKET: { Ref: Match.stringLikeRegexp("MockExportBucket") },
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

describe("duckdbInstallCommand", () => {
  it("installs into the asset directory rather than the lambda's own node_modules", () => {
    // Without --prefix the install would land in whichever directory CDK runs the hook from,
    // which is the lambda folder, so the binding would miss the asset and pollute the checkout.
    expect(duckdbInstallCommand("/staging/asset", "1.2.3-r.4", 7)).toContain("--prefix /staging/asset");
  });

  it("forces the glibc linux binding instead of the build agent's own platform", () => {
    // The build agent is node:24-alpine, so an unpinned install resolves the musl binding and
    // the lambda fails at cold start on Amazon Linux.
    expect(duckdbInstallCommand("/staging/asset", "1.2.3-r.4", 7)).toContain(
      "--os=linux --cpu=x64 --libc=glibc"
    );
  });

  it("pins the exact version it is given, leaving npm no choice", () => {
    expect(duckdbInstallCommand("/staging/asset", "1.2.3-r.4", 7)).toContain(
      "@duckdb/node-api@1.2.3-r.4"
    );
  });

  it("carries the supply-chain floor it is given, rather than waiving it", () => {
    // npm inherits no floor for an install aimed at a staging directory, so the only thing
    // keeping the repo-wide 7 day rule in force here is this flag.
    expect(duckdbInstallCommand("/staging/asset", "1.2.3-r.4", 7)).toContain(
      "--min-release-age=7"
    );
  });
});

describe("minReleaseAgeFromNpmrc", () => {
  const lambdaNpmrc = path.resolve(process.cwd(), "..", "lambdas", "dataConnectExport", ".npmrc");

  it("resolves the floor the lambda itself declares", () => {
    // Parsed differently from the implementation on purpose. Reusing its regex here would mean a
    // bug in that regex agreed with itself, and a literal would be the second source of truth
    // this function exists to remove.
    const declared = readFileSync(lambdaNpmrc, "utf8")
      .split("\n")
      .filter((line) => line.startsWith("min-release-age"))
      .map((line) => Number(line.split("=")[1].split("#")[0].trim()));

    expect(minReleaseAgeFromNpmrc(lambdaNpmrc)).toBe(declared[0]);
  });

  it("reads past the trailing comment rather than choking on it", () => {
    // The declaration is `min-release-age=7 # days`, so a naive split on = yields "7 # days",
    // and Number() of that is NaN, which npm would silently accept as no floor at all.
    expect(minReleaseAgeFromNpmrc(lambdaNpmrc)).not.toBeNaN();
    expect(minReleaseAgeFromNpmrc(lambdaNpmrc)).toBeGreaterThan(0);
  });

  it("throws rather than installing with no floor when the declaration is gone", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "npmrc-floor-"));
    const npmrc = path.join(dir, ".npmrc");
    writeFileSync(npmrc, "registry=https://registry.npmjs.org/\n");

    expect(() => minReleaseAgeFromNpmrc(npmrc)).toThrow(`min-release-age is not set in ${npmrc}`);

    rmSync(dir, { recursive: true, force: true });
  });
});
