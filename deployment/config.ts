import { Aws } from "aws-cdk-lib";
import { getSecret } from "./util/getSecret";

export interface DeploymentConfigProperties {
  project: string;
  stage: string;
  iamPermissionsBoundaryArn?: string;
  iamPath?: string;
  isDev: boolean;
  isLocalstack: boolean;
  cloudfrontCertificateArn?: string;
}

export const determineDeploymentConfig = async (
  stage: string
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

  const secretConfig =
    stage != "bootstrap"
      ? JSON.parse((await getSecret(`${project}-${stage}/config`))!)
      : {};

  return {
    ...config,
    ...secretConfig,
  };
};
