import { aws_apigateway, Duration } from "aws-cdk-lib";
import { CommonProps } from "../types/props";

import { MockIntegration, Model, PassthroughBehavior } from "aws-cdk-lib/aws-apigateway";
import { DemosLogGroup } from "./logGroup";
import { NagSuppressions } from "cdk-nag";

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
    // The graphql lambda gzips large responses to stay under Lambda's 6 MB
    // payload limit and returns them base64-encoded. API Gateway only decodes
    // those back into bytes when the request's Accept media type is declared
    // binary, and clients send `Accept: */*`, so that is what we declare.
    // Integrations that return text (the mock /api/health response, CORS
    // preflight) leave contentHandling unset and still pass through as text.
    binaryMediaTypes: ["*/*"],
    deployOptions: {
      stageName: props.stage,
      tracingEnabled: true,
      loggingLevel: aws_apigateway.MethodLoggingLevel.INFO,
      dataTraceEnabled: false,
      metricsEnabled: false,
      throttlingBurstLimit: 5000,
      throttlingRateLimit: 10000,
      cachingEnabled: true,
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

  NagSuppressions.addResourceSuppressions(api.deploymentStage, [{
    id: "AwsSolutions-APIG3",
    reason: "WAF is added in the UI stack so that values can be shared between the cloudfront and api waf"
  }])

  const cfnApi = api.node.defaultChild as aws_apigateway.CfnRestApi;
  cfnApi.addPropertyOverride("SecurityPolicy", "SecurityPolicy_TLS13_2025_EDGE")
  cfnApi.addPropertyOverride("EndpointAccessMode", "STRICT");

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
    contentHandling: aws_apigateway.ContentHandling.CONVERT_TO_TEXT,
    integrationResponses: [
      {
        statusCode: "200",
        contentHandling: aws_apigateway.ContentHandling.CONVERT_TO_TEXT,
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
  const healthMethod = healthResource.addMethod("GET", healthEndpoint, {
    methodResponses: [
      {
        statusCode: "200",
        responseModels: {
          "application/json": Model.EMPTY_MODEL,
        },
      },
    ],
  });

  const cm = healthMethod.node.defaultChild as aws_apigateway.CfnMethod;
  cm.cfnOptions.metadata = {
    checkov: {
      skip: [{
        id: "CKV_AWS_59",
        reason: "public connectivity endpoint; no sensitive data or backend access"
      }]
    }
  }

  NagSuppressions.addResourceSuppressions(healthResource, [
    {
      id: "AwsSolutions-APIG4",
      reason: "This is a healthcheck endpoint that does not return any actual information",
    },
    {
      id: "AwsSolutions-COG4",
      reason: "No authorization is needed for the health endpoint",
    },
  ], true)

  NagSuppressions.addResourceSuppressions(api, [
    {
      id: "AwsSolutions-APIG2",
      reason:
        "Request validation is done on the backend. Would be difficult to sensibly implement for a graphql endpoint",
    },
  ])

  return {
    api,
    restApiId: api.restApiId,
    apiGatewayRestApiUrl: api.url.slice(0, -1),
    apiParentResource,
  };
}
