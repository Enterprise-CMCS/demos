import {
  aws_apigateway,
  Duration,
  RemovalPolicy,
  aws_logs,
  aws_cognito,
} from "aws-cdk-lib";
import { CommonProps } from "../types/props";

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

  const apiParentResource = api.root.addResource("api")

  const healthResource = apiParentResource.addResource("health");
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
    apiParentResource
  };
}
