import { aws_ec2 } from "aws-cdk-lib";
import { CommonProps } from "../types/props";

interface SecurityGroupProps extends CommonProps {
  name: string;
  vpc: aws_ec2.IVpc;
  description?: string;
}

export function create(props: SecurityGroupProps) {
  const securityGroup = new aws_ec2.SecurityGroup(props.scope, props.name, {
    vpc: props.vpc,
    allowAllOutbound: false,
    description: props.description,
    securityGroupName: `${props.project}-${props.stage}-${props.name}`,
  });

  return {
    securityGroupId: securityGroup.uniqueId,
    securityGroup,
  };
}
