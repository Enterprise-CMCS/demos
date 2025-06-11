import {
  CfnOutput,
  Stack,
  StackProps,
  aws_iam,
  aws_cognito,
  aws_ec2,
  Fn,
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
      `${commonProps.project}-${commonProps.stage}-rds-security-group-id`
    );

    const rdsPort = importNumberValue(
      `${commonProps.project}-${commonProps.stage}-rds-port`
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
