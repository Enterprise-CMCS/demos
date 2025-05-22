import {
  aws_apigateway,
  Duration,
  RemovalPolicy,
  aws_logs,
  aws_cognito,
  aws_iam,
} from "aws-cdk-lib";
import { CommonProps } from "../types/props";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

import { execSync } from "node:child_process";
import {
  MockIntegration,
  Model,
  PassthroughBehavior,
} from "aws-cdk-lib/aws-apigateway";

interface ApiGatewayProps extends CommonProps {
  userPool: aws_cognito.UserPool;
}

export function create(props: ApiGatewayProps) {
  const logGroup = new aws_logs.LogGroup(props.scope, "ApiAccessLogs", {
    removalPolicy: props.isDev ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
  });

  const prefixListEntries = execSync(
    `aws ec2 get-managed-prefix-list-entries --prefix-list-id $(aws ec2 describe-managed-prefix-lists --filters "Name=prefix-list-name,Values=zscaler" --query 'PrefixLists[0].PrefixListId' --output text) --output json --query "Entries[*].Cidr"`
  );

  const api = new aws_apigateway.RestApi(props.scope, "ApiGatewayRestApi", {
    restApiName: `${props.project}-${props.stage}-api`,
    deploy: true,
    cloudWatchRole: false,
    deployOptions: {
      stageName: props.stage,
      tracingEnabled: true,
      loggingLevel: aws_apigateway.MethodLoggingLevel.INFO,
      dataTraceEnabled: true,
      metricsEnabled: false,
      throttlingBurstLimit: 5000,
      throttlingRateLimit: 10000.0,
      cachingEnabled: false,
      cacheTtl: Duration.seconds(300),
      cacheDataEncrypted: false,
      accessLogDestination: new aws_apigateway.LogGroupLogDestination(logGroup),
      accessLogFormat: aws_apigateway.AccessLogFormat.custom(
        "requestId: $context.requestId, ip: $context.identity.sourceIp, " +
          "caller: $context.identity.caller, user: $context.identity.user, " +
          "requestTime: $context.requestTime, httpMethod: $context.httpMethod, " +
          "resourcePath: $context.resourcePath, status: $context.status, " +
          "protocol: $context.protocol, responseLength: $context.responseLength"
      ),
    },
    defaultCorsPreflightOptions: {
      allowOrigins: aws_apigateway.Cors.ALL_ORIGINS,
      allowMethods: aws_apigateway.Cors.ALL_METHODS,
    },
  });

  const resourcePolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    principals: [new aws_iam.AnyPrincipal()],
    actions: ["execute-api:Invoke"],
    resources: ["execute-api:/*/*/*"],
    conditions: {
      IpAddress: {
        "aws:SourceIp": JSON.parse(prefixListEntries.toString()),
      },
    },
  });

  api.addToResourcePolicy(resourcePolicy);

  api.addGatewayResponse("Default4XXResponse", {
    type: aws_apigateway.ResponseType.DEFAULT_4XX,
    responseHeaders: {
      "Access-Control-Allow-Origin": "'*'",
      "Access-Control-Allow-Headers": "'*'",
    },
  });

  api.addGatewayResponse("Default5XXResponse", {
    type: aws_apigateway.ResponseType.DEFAULT_5XX,
    responseHeaders: {
      "Access-Control-Allow-Origin": "'*'",
      "Access-Control-Allow-Headers": "'*'",
    },
  });

  const authorizer = props.isLocalstack
    ? undefined
    : new aws_apigateway.CognitoUserPoolsAuthorizer(
        props.scope,
        "cognitoAuthorizer",
        {
          cognitoUserPools: [props.userPool],
          authorizerName: "cognito-auth",
        }
      );

  const healthEndpoint = new MockIntegration({
    integrationResponses: [
      {
        statusCode: "200",
        responseTemplates: {
          "application/json": JSON.stringify({ message: "ok" }),
        },
      },
    ],
    passthroughBehavior: PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": '{"statusCode": 200}',
    },
  });

  const healthResource = api.root.addResource("health");
  healthResource.addMethod("GET", healthEndpoint, {
    methodResponses: [
      {
        statusCode: "200",
        responseModels: {
          "application/json": Model.EMPTY_MODEL,
        },
      },
    ],
  });

  return {
    api,
    restApiId: api.restApiId,
    apiGatewayRestApiUrl: api.url.slice(0, -1),
    authorizer,
  };
}
