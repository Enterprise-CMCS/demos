import { App, Stack, aws_lambda, aws_s3 } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { BUNDLING_STACKS } from "aws-cdk-lib/cx-api";

import { DataConnectExportProcessor, bundlingEnvironmentFor } from "./dataConnectExportProcessor";
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
      MemorySize: 1769,
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

  it("registers the architecture the DuckDB binding is installed for", () => {
    // A mismatched function and binding architecture would fail at cold start.
    synth().hasResourceProperties("AWS::Lambda::Function", {
      Architectures: ["x86_64"],
    });
  });

  it("reserves concurrency and uses the default temporary storage", () => {
    synth().hasResourceProperties("AWS::Lambda::Function", {
      ReservedConcurrentExecutions: 1,
    });
    const functions = synth().findResources("AWS::Lambda::Function");
    const [lambda] = Object.values(functions);
    expect(lambda.Properties.EphemeralStorage).toBeUndefined();
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

  it("grants put on the export bucket, but not read and not delete", () => {
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
    expect(bucketActions).not.toContain("s3:DeleteObject*");
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

describe("bundlingEnvironmentFor", () => {
  it("describes the Lambda runtime rather than the machine doing the build", () => {
    // Override the Alpine build agent's musl platform for Amazon Linux.
    expect(bundlingEnvironmentFor(aws_lambda.Architecture.X86_64)).toMatchObject({
      npm_config_os: "linux",
      npm_config_libc: "glibc",
    });
  });

  it("derives the npm cpu value from the architecture, for both of the ones Lambda offers", () => {
    // CDK and npm use different names for x86_64.
    expect(bundlingEnvironmentFor(aws_lambda.Architecture.X86_64).npm_config_cpu).toBe("x64");
    expect(bundlingEnvironmentFor(aws_lambda.Architecture.ARM_64).npm_config_cpu).toBe("arm64");
  });

  it("refuses an architecture it has no npm spelling for", () => {
    // Falling back would install the build agent's binding.
    expect(() => bundlingEnvironmentFor(aws_lambda.Architecture.custom("s390x"))).toThrow(
      "No npm --cpu value is known for the s390x architecture"
    );
  });

  it("suppresses install scripts", () => {
    expect(bundlingEnvironmentFor(aws_lambda.Architecture.X86_64).npm_config_ignore_scripts).toBe(
      "true"
    );
  });

  it("names every key so npm actually reads it", () => {
    // npm ignores configuration environment variables without this prefix.
    for (const key of Object.keys(bundlingEnvironmentFor(aws_lambda.Architecture.X86_64))) {
      expect(key).toMatch(/^npm_config_[a-z_]+$/);
    }
  });

  it("passes only strings, because that is all an environment can carry", () => {
    for (const value of Object.values(bundlingEnvironmentFor(aws_lambda.Architecture.X86_64))) {
      expect(typeof value).toBe("string");
    }
  });
});
