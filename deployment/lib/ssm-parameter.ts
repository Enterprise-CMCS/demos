import { aws_ssm, aws_ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";
import { CommonProps } from "../types/props";

interface CreateSSMParameterProps extends CommonProps {
  name: string;
  value: string;
  description?: string;
}

export function create(props: CreateSSMParameterProps) {
  const name = `/${props.project}/${props.stage}/${props.name}`;
  const cogParam = new aws_ssm.StringParameter(
    props.scope,
    `parameter${props.project}${props.stage}${props.name}`,
    {
      parameterName: name,
      stringValue: props.value,
      description: props.description,
      tier: aws_ssm.ParameterTier.STANDARD,
    }
  );

  return {
    name,
  };
}

interface GetSSMParameterProps extends CommonProps {
  name: string;
}

export function get(props: GetSSMParameterProps) {
  return aws_ssm.StringParameter.fromStringParameterName(
    props.scope,
    `${props.name.split("/").join("")}`,
    props.name
  );
}
