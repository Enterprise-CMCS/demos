import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { CommonProps } from "../types/props";
import {
  Duration,
  aws_apigateway,
  aws_codedeploy,
  aws_ec2,
  aws_lambda,
} from "aws-cdk-lib";
import {
  Role,
  PolicyDocument,
  PolicyStatement,
  Effect,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";

interface LambdaProps extends CommonProps {
  additionalPolicies?: PolicyStatement[];
  entry: string;
  handler: string;
  timeout?: Duration;
  memorySize?: number;
  environment?: { [key: string]: string };
  path?: string;
  method?: string;
  apiParentResource?: aws_apigateway.Resource;
  vpc?: aws_ec2.IVpc;
  securityGroup?: aws_ec2.SecurityGroup;
  useAlias?: boolean;
  deploymentConfig?: aws_codedeploy.ILambdaDeploymentConfig;
  authorizer?: aws_apigateway.Authorizer;
  authorizationType?: aws_apigateway.AuthorizationType;
  asCode?: boolean;
}

export function create(props: LambdaProps, id: string) {
  const lambda = new Lambda(props.scope, id, props);
  
  return {
    functionName: lambda.lambda.functionName,
    lambda,
  };
}

export class Lambda extends Construct {
  public readonly lambda: NodejsFunction;
  public readonly role: Role;

  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id);

    const {
      additionalPolicies = [],
      timeout = Duration.minutes(15), // longest available
      memorySize = 1024,
      asCode = false,
    } = props;

    const role = new Role(this, `${id}LambdaExecutionRole`, {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      permissionsBoundary: props.iamPermissionsBoundary,
      path: props.iamPath,
      inlinePolicies: {
        LambdaPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["ssm:GetParameter"],
              resources: ["*"],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              resources: ["arn:aws:logs:*:*:*"],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DescribeSubnets",
                "ec2:DeleteNetworkInterface",
                "ec2:AssignPrivateIpAddresses",
                "ec2:UnassignPrivateIpAddresses",
              ],
              resources: ["*"],
            }),
            ...additionalPolicies,
          ],
        }),
      },
    });
    this.role = role;
    this.lambda = new NodejsFunction(this, id, {
      functionName: `${props.project}-${props.stage}-${id}`,
      entry: !asCode ? props.entry : undefined,
      code: asCode ? aws_lambda.Code.fromAsset(props.entry) : undefined,
      handler: `${props.handler}`,
      runtime: Runtime.NODEJS_22_X,
      timeout,
      memorySize,
      role,
      securityGroups:
        props.vpc && props.securityGroup ? [props.securityGroup] : undefined,
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: props.environment,
      vpc: props.vpc,
      vpcSubnets: props.vpc ? { subnets: props.vpc.privateSubnets } : undefined,
    });

    let alias;

    if (props.useAlias) {
      alias = new aws_lambda.Alias(this, `${id}-alias`, {
        aliasName: "current",
        version: this.lambda.currentVersion,
      });
    }

    if (alias && props.deploymentConfig) {
      new aws_codedeploy.LambdaDeploymentGroup(this, `${id}-deployment`, {
        alias,
        deploymentConfig: props.deploymentConfig,
      });
    }

    if (props.apiParentResource && props.path && props.method) {
      const resource = props.apiParentResource.resourceForPath(props.path);
      resource.addMethod(
        props.method,
        new aws_apigateway.LambdaIntegration(alias ? alias : this.lambda),
        {
          authorizationType: props.isLocalstack
            ? undefined
            : props.authorizationType,
          authorizer: props.isLocalstack ? undefined : props.authorizer,
          // authorizationScopes: props.isLocalstack
          //   ? undefined
          //   : ["demosApi/read", "demosApi/write"],
        }
      );
    }
  }
}
