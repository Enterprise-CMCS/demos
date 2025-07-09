import { Aws } from "aws-cdk-lib";
import { getSecret } from "./util/getSecret";
import { getZScalerIps } from "./util/zscalerIps";

export interface DeploymentConfigProperties {
  project: string;
  stage: string;
  iamPermissionsBoundaryArn?: string;
  iamPath?: string;
  isDev: boolean;
  isLocalstack: boolean;
  isEphemeral: boolean;
  hostEnvironment: string;
  cloudfrontCertificateArn?: string;
  zScalerIps: string[];
}

export const determineDeploymentConfig = async (
  stage: string,
  hostEnv?: string
): Promise<DeploymentConfigProperties> => {
  const project = process.env.PROJECT || "demos";

  const iamPermissionsBoundaryArn = `arn:aws:iam::${Aws.ACCOUNT_ID}:policy/cms-cloud-admin/developer-boundary-policy`;
  const iamPath = "/delegatedadmin/developer/";

  const config = {
    stage,
    project,
    iamPath,
    iamPermissionsBoundaryArn,
    isDev: true,
    isLocalstack: process.env.CDK_DEFAULT_ACCOUNT == "000000000000",
  };

  const isEphemeral = !["dev","test","prod"].includes(stage)
  const hostEnvironment = !isEphemeral ? stage : hostEnv ? hostEnv : "dev"

  const secretConfig =
    stage != "bootstrap"
      ? JSON.parse((await getSecret(`${project}-${hostEnvironment}/config`))!)
      : {};

  const zScalerIps = await getZScalerIps()

  return {
    ...config,
    ...secretConfig,
    isEphemeral,
    hostEnvironment,
    zScalerIps
  };
};
