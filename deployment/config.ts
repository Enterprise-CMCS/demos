import { Aws } from "aws-cdk-lib";
import { getSecret } from "./util/getSecret";
import { getZScalerIps } from "./util/zscalerIps";
import { getUserPoolIdByName } from "./util/getUserPoolId";
import * as fs from "fs";
import { getParameter } from "./util/getParameter";
import { configuredDistributionExists } from "./util/checkCloudfront";

export interface DeploymentConfigProperties {
  project: string;
  stage: string;
  iamPermissionsBoundaryArn?: string;
  iamPath?: string;
  isDev: boolean;
  isLocalstack: boolean;
  isEphemeral: boolean;
  hostEnvironment: "dev" | "test" | "impl" | "prod";
  cloudfrontCertificateArn?: string;
  cloudfrontHost: string;
  zScalerIps: string[];
  hostUserPoolId?: string;
  idmMetadataEndpoint?: string;
  cloudfrontWafHeaderValue?: string;
  zapHeaderValue?: string;
  srrConfigured: boolean;
}

export const determineDeploymentConfig = async (
  stage: string,
  hostEnv?: string
): Promise<DeploymentConfigProperties> => {
  const project = process.env.PROJECT ?? "demos";

  const iamPermissionsBoundaryArn = `arn:aws:iam::${Aws.ACCOUNT_ID}:policy/cms-cloud-admin/developer-boundary-policy`;
  const iamPath = "/delegatedadmin/developer/";

  const config = {
    stage,
    project,
    iamPath,
    iamPermissionsBoundaryArn,
    isDev: stage === "dev",
    isLocalstack: process.env.CDK_DEFAULT_ACCOUNT == "000000000000",
  };

  const isEphemeral = !["dev", "test", "prod"].includes(stage);
  const hostEnvironment = !isEphemeral ? stage : hostEnv ?? "dev";
  const hostUserPoolId = isEphemeral ? await getUserPoolIdByName(`${project}-${hostEnvironment}-user-pool`) : undefined;

  const secretConfig =
    stage != "bootstrap" ? JSON.parse((await getSecret(`${project}-${hostEnvironment}/config`))!) : {};

  const zScalerIps = await getZScalerIps();

  let cloudfrontHost = `${hostEnvironment}.demos.internal.cms.gov`;

  if (isEphemeral) {
    cloudfrontHost = `${stage}.${cloudfrontHost}`;
  }

  const pubCertData = await getParameter("/demos/pub-cms-cert-1")
  fs.writeFileSync("./cert.pem", `${pubCertData}`);

  let srrConfigured = false
  try {
    const cloudfrontReady = await getParameter(`/demos/cloudfront/${stage}`)
    if (cloudfrontReady.startsWith("SRR has been configured:") && stage != "bootstrap") {
      srrConfigured = true
    } else {
      if (["dev", "test"].includes(stage) || await configuredDistributionExists(stage)) {
        throw new Error("A configured distribution already exists. Running this will delete it");
        
      }
    }
  } catch (err) {
    if (stage != "bootstrap") {
      throw err
    }
  }

  return {
    ...config,
    ...secretConfig,
    isEphemeral,
    hostEnvironment,
    zScalerIps,
    hostUserPoolId,
    cloudfrontHost,
    srrConfigured
  };
};
