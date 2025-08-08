import { IManagedPolicy } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface CommonProps {
  scope: Construct;
  project: string;
  stage: string;
  isDev: boolean;
  iamPermissionsBoundaryArn?: string;
  iamPath?: string;
  iamPermissionsBoundary?: IManagedPolicy;
  isLocalstack: boolean;
  isEphemeral: boolean;
  zScalerIps: string[];
  idmMetadataEndpoint?: string;
}
