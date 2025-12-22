import { ICommandHooks, LogLevel, NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { CommonProps } from "../types/props";
import { Aws, Duration, aws_apigateway, aws_codedeploy, aws_ec2, aws_kms, aws_lambda } from "aws-cdk-lib";
import { Role, PolicyDocument, PolicyStatement, Effect, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { DemosLogGroup } from "./logGroup";

interface LambdaProps extends CommonProps {
  additionalPolicies?: PolicyStatement[];
  entry: string;
  handler: string;
  timeout?: Duration;
  memorySize?: number;
  environment?: { [key: string]: string };
  path?: string;
  method?: string;
  apiParentResource?: aws_apigateway.IResource;
  vpc?: aws_ec2.IVpc;
  securityGroup?: aws_ec2.ISecurityGroup | aws_ec2.ISecurityGroup[];
  useAlias?: boolean;
  deploymentConfig?: aws_codedeploy.ILambdaDeploymentConfig;
  authorizer?: aws_apigateway.Authorizer;
  authorizationType?: aws_apigateway.AuthorizationType;
  asCode?: boolean;
  externalModules?: string[];
  nodeModules?: string[];
  depsLockFilePath?: string;
  commandHooks?: ICommandHooks;
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
  private readonly isLocalStack: boolean;

  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id);

    this.isLocalStack = props.isLocalstack;

    const {
      additionalPolicies = [],
      timeout = Duration.minutes(15), // longest available
      memorySize = 1024,
      asCode = false,
    } = props;

    const logGroup = new DemosLogGroup(this, "LogGroup", {
      name: `lambda/${id}`,
      isEphemeral: props.isEphemeral,
      stage: props.stage,
    });

    let securityGroups: aws_ec2.ISecurityGroup[] | undefined;
    if (props.vpc && props.securityGroup) {
      securityGroups = Array.isArray(props.securityGroup) ? props.securityGroup : [props.securityGroup]
    }

    const role = new Role(this, `${id}LambdaExecutionRole`, {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      permissionsBoundary: props.iamPermissionsBoundary,
      path: props.iamPath,
      inlinePolicies: {
        LambdaPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
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
              conditions: {
                ArnNotEquals: {
                  "lambda:SourceFunctionArn": [
                      `arn:aws:lambda:${Aws.REGION}:${Aws.ACCOUNT_ID}:function:*`
                  ]
                }
              },
              resources: ["*"],
            }),
            ...additionalPolicies,
          ],
        }),
      },
    });
    this.role = role;

    const key = aws_kms.Key.fromLookup(this, "lambdaKmsKey", {
      aliasName: `alias/demos-${props.stage}-lambda-env`
    })

    this.lambda = new NodejsFunction(this, id, {
      functionName: `${props.project}-${props.stage}-${id}`,
      entry: !asCode ? props.entry : undefined,
      code: asCode ? aws_lambda.Code.fromAsset(props.entry) : undefined,
      depsLockFilePath: props.depsLockFilePath,
      handler: `${props.handler}`,
      runtime: Runtime.NODEJS_24_X,
      timeout,
      memorySize,
      role,
      securityGroups,
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: props.externalModules,
        nodeModules: props.nodeModules,
        logLevel: LogLevel.VERBOSE,
        commandHooks: props.commandHooks,
      },
      environment: props.environment,
      vpc: props.vpc,
      vpcSubnets: props.vpc ? { subnets: props.vpc.privateSubnets } : undefined,
      logGroup: logGroup.logGroup,
      loggingFormat: aws_lambda.LoggingFormat.JSON,
      environmentEncryption: key,
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
      resource.addMethod(props.method, new aws_apigateway.LambdaIntegration(alias ?? this.lambda), {
        authorizationType: this.onAws(props.authorizationType),
        authorizer: this.onAws(props.authorizer),
        // authorizationScopes: props.isLocalstack
        //   ? undefined
        //   : ["demosApi/read", "demosApi/write"],
      });
    }
  }

  private onAws<T>(value: T) {
    return this.isLocalStack ? undefined : value;
  }
}
