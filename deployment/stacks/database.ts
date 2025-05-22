import {
  CfnOutput,
  Stack,
  StackProps,
  aws_iam,
  aws_cognito,
  aws_ec2,
  aws_ssm,
  aws_rds,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { DeploymentConfigProperties } from "../config";

import * as securityGroup from "../lib/security-group";
import * as ssm from "../lib/ssm-parameter";

interface DatabaseStackProps {
  vpc: aws_ec2.IVpc;
}

export class DatabaseStack extends Stack {
  public readonly cognito_outputs: aws_cognito.UserPool;
  public readonly cognitoAuthorityParamName: string;
  public readonly cognitoClientIdParamName: string;
  public readonly vpcId?: string;

  constructor(
    scope: Construct,
    id: string,
    props: StackProps & DeploymentConfigProperties & DatabaseStackProps
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

    const sg = securityGroup.create({
      ...commonProps,
      name: `demos-${commonProps.stage}-rds-sg`,
    });

    const dbInstance = new aws_rds.DatabaseInstance(
      commonProps.scope,
      `${commonProps.project}-${commonProps.stage}-rds`,
      {
        engine: aws_rds.DatabaseInstanceEngine.postgres({
          version: aws_rds.PostgresEngineVersion.VER_17_4,
        }),
        instanceType: aws_ec2.InstanceType.of(
          aws_ec2.InstanceClass.BURSTABLE4_GRAVITON,
          aws_ec2.InstanceSize.MICRO
        ),
        vpc: commonProps.vpc,
        vpcSubnets: { subnets: props.vpc.privateSubnets },
        multiAz: false,
        allocatedStorage: 20,
        databaseName: "demos",
        storageEncrypted: true,
        credentials: aws_rds.Credentials.fromGeneratedSecret("demosAdmin"),
        securityGroups: [sg.securityGroup],
        publiclyAccessible: false,
        removalPolicy: RemovalPolicy.DESTROY, // FIXME: Update this to retain for higher envs
        deleteAutomatedBackups: true,
        instanceIdentifier: `${commonProps.project}-${commonProps.stage}-rds`,
      }
    );

    ssm.create({
      ...commonProps,
      name: "rdsHost",
      value: dbInstance.instanceEndpoint.hostname,
    });
    ssm.create({
      ...commonProps,
      name: "dbPort",
      value: dbInstance.instanceEndpoint.port.toString(),
    });

    new CfnOutput(commonProps.scope, "dbHost", {
      value: dbInstance.instanceEndpoint.hostname,
    });

    new CfnOutput(commonProps.scope, "dbPort", {
      value: dbInstance.instanceEndpoint.port.toString(),
    });
  }
}
