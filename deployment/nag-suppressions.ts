import { Stack } from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

export function applyCoreSuppressions(core: Stack) {
  NagSuppressions.addStackSuppressions(core, [
    {
      id: "AwsSolutions-COG3",
      reason:
        "Advanced security mode is an increased cost and unnecessary since all logins are managed by IDM in PROD",
    },
  ]);
}

export function applyUISuppressions(ui: Stack, stage: string) {
  NagSuppressions.addStackSuppressions(ui, [
    {
      id: "AwsSolutions-L1",
      reason:
        "This is caused by the bucket deployment, which is not managed within our code",
    },
  ]);

  NagSuppressions.addResourceSuppressionsByPath(
    ui,
    `/demos-${stage}-ui/BucketDeploymentRole/DefaultPolicy/Resource`,
    [
      {
        id: "AwsSolutions-IAM5",
        reason:
          "CDK adds non-modifiable default policies that fail this rule. Required for the bucket deployment",
      },
      {
        id: "AwsSolutions-L1",
        reason:
          "This is caused by the bucket deployment, which is not managed within our code",
      },
    ]
  );

  NagSuppressions.addResourceSuppressionsByPath(
    ui,
    `/demos-${stage}-ui/BucketDeploymentRole/Resource`,
    [
      {
        id: "AwsSolutions-IAM5",
        reason:
          "CDK adds non-modifiable default policies that fail this rule. Required for the bucket deployment",
      },
    ]
  );
}

export function applyApiSuppressions(api: Stack, stage: string) {
  NagSuppressions.addResourceSuppressionsByPath(
    api,
    `/demos-${stage}-api/ApiGatewayRestApi/Resource`,
    [
      {
        id: "AwsSolutions-APIG4",
        reason:
          "This is a healthcheck endpoint that does not return any actual information",
      },
    ]
  );

  NagSuppressions.addResourceSuppressionsByPath(
    api,
    `/demos-${stage}-api/ApiGatewayRestApi/Default/api/health/GET/Resource`,
    [
      {
        id: "AwsSolutions-APIG4",
        reason:
          "This is a healthcheck endpoint that does not return any actual information",
      },
      {
        id: "AwsSolutions-COG4",
        reason: "No authorization is needed for the health endpoint",
      },
    ]
  );
  NagSuppressions.addResourceSuppressionsByPath(
    api,
    `/demos-${stage}-api/ApiGatewayRestApi/Default/api/graphql/POST/Resource`,
    [
      {
        id: "AwsSolutions-COG4",
        reason: "Cognito is still being used for authorization, but done with a custom authorizer rather than the AWS default one",
      },
    ]
  );

  NagSuppressions.addResourceSuppressionsByPath(
    api,
    `/demos-${stage}-api/ApiGatewayRestApi/Resource`,
    [
      {
        id: "AwsSolutions-APIG2",
        reason:
          "Request validation is done on the backend. Would be difficult to sensibly implement for a graphql endpoint",
      },
    ]
  );

  NagSuppressions.addResourceSuppressionsByPath(
    api,
    `/demos-${stage}-api/graphql/graphqlLambdaExecutionRole/Resource`,
    [
      {
        id: "AwsSolutions-IAM5",
        reason: "Permissions given are required for the lambda execution role",
      },
    ]
  );

  NagSuppressions.addResourceSuppressionsByPath(
    api,
    `/demos-${stage}-api/authorizer/authorizerLambdaExecutionRole/Resource`,
    [
      {
        id: "AwsSolutions-IAM5",
        reason: "Permissions given are required for the lambda execution role",
      },
    ]
  );
}

export function applyDatabaseSuppressions(database: Stack, stage: string) {
  NagSuppressions.addStackSuppressions(
    database,
    stage != "prod"
      ? [
          {
            id: "AwsSolutions-RDS3",
            reason: "Not using multiAZ database in non-prod environments",
          },
          {
            id: "AwsSolutions-RDS10",
            reason: "Not using deletion protection in non-prod environments",
          },
          // TODO: Revisit
          {
            id: "AwsSolutions-IAM4",
            reason: "Using AWS managed policies currently",
          },
        ]
      : []
  );
  NagSuppressions.addResourceSuppressionsByPath(
    database,
    `/demos-${stage}-database/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource`, // pragma: allowlist secret
    [
      {
        id: "AwsSolutions-IAM5",
        reason: "CDK default policy that can't be modified",
      },
    ]
  );
}
