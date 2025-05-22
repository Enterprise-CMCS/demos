import {
  CfnOutput,
  Stack,
  StackProps,
  aws_iam,
  aws_ec2,
  aws_cognito,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";

import * as cognito from "../lib/cognito";
import * as apigateway from "../lib/apigateway";
import * as lambda from "../lib/lambda";
import * as securityGroup from "../lib/security-group";
import { IVpc } from "aws-cdk-lib/aws-ec2";

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
    // const { isDev, secureCloudfrontDomainName } = props;
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

    let graphqlLambdaSecurityGroup;
    if (props.vpc) {
      graphqlLambdaSecurityGroup = securityGroup.create({
        ...commonProps,
        name: "graphqlSecurityGroup",
        vpc: props.vpc,
      });
    }

    // const cognito_outputs = cognito.create(commonProps);
    const apigateway_outputs = apigateway.create({
      ...commonProps,
      userPool: props.cognito_userpool,
    });

    lambda.create(
      {
        ...commonProps,
        entry: "../server/dist",
        handler: "graphqlHandler",
        api: apigateway_outputs.api,
        path: "graphql",
        method: "POST",
        vpc: props.vpc,
        securityGroup: props.isLocalstack
          ? undefined
          : graphqlLambdaSecurityGroup?.securityGroup,
        authorizer: props.isLocalstack
          ? undefined
          : apigateway_outputs.authorizer,
        asCode: true,
      },
      "graphql"
    );
    // Outputs

    new CfnOutput(this, "ApiUrl", {
      value: apigateway_outputs.apiGatewayRestApiUrl,
    });
  }
}
