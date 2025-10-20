import { aws_apigateway, Duration } from "aws-cdk-lib";
import { CommonProps } from "../types/props";

import { MockIntegration, Model, PassthroughBehavior } from "aws-cdk-lib/aws-apigateway";
import { DemosLogGroup } from "./logGroup";

export function create(props: CommonProps) {
  const apiAccessLogGroup = new DemosLogGroup(props.scope, "ApiAccessLogs", {
    name: "apigateway/access",
    isEphemeral: props.isEphemeral,
    stage: props.stage,
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
      accessLogDestination: new aws_apigateway.LogGroupLogDestination(apiAccessLogGroup.logGroup),
      accessLogFormat: aws_apigateway.AccessLogFormat.custom(
        "requestId: $context.requestId, ip: $context.identity.sourceIp, " +
          "caller: $context.identity.caller, user: $context.identity.user, " +
          "requestTime: $context.requestTime, httpMethod: $context.httpMethod, " +
          "resourcePath: $context.resourcePath, status: $context.status, " +
          "protocol: $context.protocol, responseLength: $context.responseLength"
      ),
    },
    defaultCorsPreflightOptions: {
      allowOrigins: [`https://${props.cloudfrontHost}`],
      allowMethods: aws_apigateway.Cors.ALL_METHODS,
    },
  });

  api.addGatewayResponse("Default4XXResponse", {
    type: aws_apigateway.ResponseType.DEFAULT_4XX,
    responseHeaders: {
      "Access-Control-Allow-Origin": `'https://${props.cloudfrontHost}'`,
      "Access-Control-Allow-Headers": "'*'",
    },
  });

  api.addGatewayResponse("Default5XXResponse", {
    type: aws_apigateway.ResponseType.DEFAULT_5XX,
    responseHeaders: {
      "Access-Control-Allow-Origin": `'https://${props.cloudfrontHost}'`,
      "Access-Control-Allow-Headers": "'*'",
    },
  });

  const healthEndpoint = new MockIntegration({
    integrationResponses: [
      {
        statusCode: "200",
        responseTemplates: {
          "application/json": JSON.stringify({ message: "ok", hash: `${process.env.API_COMMIT_HASH || "unknown"}` }),
        },
      },
    ],
    passthroughBehavior: PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": '{"statusCode": 200}',
    },
  });

  const apiParentResource = api.root.addResource("api");

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
    apiParentResource,
  };
}
