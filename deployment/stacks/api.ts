import {
  CfnOutput,
  Stack,
  StackProps,
  aws_iam,
  aws_ec2,
  Fn,
  aws_secretsmanager,
  aws_cognito,
  aws_apigateway,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";

import * as apigateway from "../lib/apigateway";
import * as lambda from "../lib/lambda";
import * as securityGroup from "../lib/security-group";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import importNumberValue from "../util/importNumberValue";

interface APIStackProps {
  cognito_userpool: aws_cognito.UserPool;
  vpc: IVpc;
}

export class ApiStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps & DeploymentConfigProperties & APIStackProps
  ) {

    super(scope, id, {
      ...props,
      terminationProtection: false,
    });

    const commonProps = {
      ...props,
      scope: this,
      iamPermissionsBoundary:
        props.iamPermissionsBoundaryArn != null
          ? aws_iam.ManagedPolicy.fromManagedPolicyArn(
              this,
              "iamPermissionsBoundary",
              props.iamPermissionsBoundaryArn
            )
          : undefined,
    };

    const graphqlLambdaSecurityGroup = securityGroup.create({
      ...commonProps,
      name: "graphqlSecurityGroup",
      vpc: props.vpc,
    });

    const rdsSecurityGroupId = Fn.importValue(
      `${commonProps.project}-${commonProps.hostEnvironment}-rds-security-group-id`
    );

    const rdsPort = importNumberValue(
      `${commonProps.project}-${commonProps.hostEnvironment}-rds-port`
    );

    const rdsSg = aws_ec2.SecurityGroup.fromSecurityGroupId(
      commonProps.scope,
      "rdsSg",
      rdsSecurityGroupId
    );

    rdsSg.addIngressRule(
      aws_ec2.Peer.securityGroupId(
        graphqlLambdaSecurityGroup.securityGroup.securityGroupId
      ),
      aws_ec2.Port.tcp(rdsPort),
      "Allow ingress from GraphQL Security Group",
      true
    );

    graphqlLambdaSecurityGroup?.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(rdsSecurityGroupId),
      aws_ec2.Port.tcp(rdsPort),
      "Allow egress to RDS",
      true
    );

    const secretsManagerVpceSgId = Fn.importValue(
      `${commonProps.stage}SecretsManagerVpceSg`
    );

    graphqlLambdaSecurityGroup.securityGroup.addEgressRule(
      aws_ec2.Peer.securityGroupId(secretsManagerVpceSgId),
      aws_ec2.Port.HTTPS,
      "Allow traffic to secrets manager VPCE"
    );

    const cognitoAuthority = Fn.importValue(
      `${commonProps.hostEnvironment}CognitoAuthority`
    )
    
    const apigateway_outputs = apigateway.create({
      ...commonProps,
      userPool: props.cognito_userpool,
    });

    const dbSecret = aws_secretsmanager.Secret.fromSecretNameV2(commonProps.scope, "rdsDatabaseSecret",`demos-${commonProps.hostEnvironment}-rds-admin`)

    const authorizerLambda = lambda.create(
      {
        ...commonProps,
        entry: "../lambda_authorizer",
        handler: "index.handler",
        asCode: true,
        environment: {
          JWKS_URI: `${cognitoAuthority}/.well-known/jwks.json`,
          ...props.cognito_userpool.env
        }
      },
      "authorizer"
    )

    const tokenAuthorizer = new aws_apigateway.TokenAuthorizer(commonProps.scope, "jwtTokenAuthorizer", {
      handler: authorizerLambda.lambda.lambda,
      authorizerName: "cognitoTokenAuth"
    })

    const graphqlLambda = lambda.create(
      {
        ...commonProps,
        entry: "../server/dist",
        handler: "server.graphqlHandler",
        apiParentResource: apigateway_outputs.apiParentResource,
        path: "graphql",
        method: "POST",
        vpc: props.vpc,
        securityGroup: props.isLocalstack
          ? undefined
          : graphqlLambdaSecurityGroup?.securityGroup,
        authorizer: props.isLocalstack
          ? undefined
          : tokenAuthorizer,
        authorizationType: props.isLocalstack
          ? undefined
          : aws_apigateway.AuthorizationType.CUSTOM,
        asCode: true,
        environment: {
          BYPASS_AUTH: commonProps.hostEnvironment == "dev" ? "true" : "",
          DATABASE_URL: "postgres://placeholder",
          DATABASE_SECRET_ARN: dbSecret.secretName // This needs to be the name rather than the arn, otherwise the request from the lambda fails since no secret suffix is available
        }
      },
      "graphql"
    );
    dbSecret.grantRead(graphqlLambda.lambda.role)

    // Outputs

    new CfnOutput(this, "ApiUrl", {
      value: apigateway_outputs.apiGatewayRestApiUrl,
      exportName: `${commonProps.stage}ApiGWUrl`
    });
  }
}
