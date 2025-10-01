import { App, Aspects, DefaultStackSynthesizer, Tags } from "aws-cdk-lib";
import { determineDeploymentConfig } from "./config";

import { CoreStack } from "./stacks/core";
import { ApiStack } from "./stacks/api";
import { UiStack } from "./stacks/ui";
import { DatabaseStack } from "./stacks/database";
import { BootstrapStack } from "./stacks/bootstrap";
import { AwsSolutionsChecks } from "cdk-nag";
import {
  applyApiSuppressions,
  applyCoreSuppressions,
  applyDatabaseSuppressions,
  applyDbRoleSuppressions,
  applyFileUploadSuppressions,
  applyUISuppressions,
} from "./nag-suppressions";
import { FileUploadStack } from "./stacks/fileupload";
import { DBRoleStack } from "./stacks/dbRoles";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function main(passedContext?: { [key: string]: any }) {
  const path = "delegatedadmin/developer/";

  const app = new App({
    defaultStackSynthesizer: new DefaultStackSynthesizer({
      deployRoleArn:
        "arn:${AWS::Partition}:iam::${AWS::AccountId}:role/" +
        path +
        "cdk-${Qualifier}-deploy-role-${AWS::AccountId}-${AWS::Region}",
      fileAssetPublishingRoleArn:
        "arn:${AWS::Partition}:iam::${AWS::AccountId}:role/" +
        path +
        "cdk-${Qualifier}-file-publishing-role-${AWS::AccountId}-${AWS::Region}",
      imageAssetPublishingRoleArn:
        "arn:${AWS::Partition}:iam::${AWS::AccountId}:role/" +
        path +
        "cdk-${Qualifier}-image-publishing-role-${AWS::AccountId}-${AWS::Region}",
      cloudFormationExecutionRole:
        "arn:${AWS::Partition}:iam::${AWS::AccountId}:role/" +
        path +
        "cdk-${Qualifier}-cfn-exec-role-${AWS::AccountId}-${AWS::Region}",
      lookupRoleArn:
        "arn:${AWS::Partition}:iam::${AWS::AccountId}:role/" +
        path +
        "cdk-${Qualifier}-lookup-role-${AWS::AccountId}-${AWS::Region}",
      qualifier: "hnb659fds",
    }),
    context: passedContext,
  });

  const stage = app.node.getContext("stage");
  const hostEnv = app.node.tryGetContext("hostEnv");
  const config = await determineDeploymentConfig(stage, hostEnv);

  const project = config.project;

  const expectedAccount = process.env.EXPECTED_DEMOS_ACCOUNT;
  if (expectedAccount && process.env.CDK_DEFAULT_ACCOUNT != expectedAccount) {
    throw new Error("Wrong account!");
  }

  Tags.of(app).add("STAGE", stage);
  Tags.of(app).add("PROJECT", project);

  if (stage == "bootstrap") {
    new BootstrapStack(app, `${config.project}-${stage}`, {
      ...config,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });
    return app;
  }

  const core = new CoreStack(app, `${project}-${stage}-core`, {
    ...config,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });

  if (app.node.tryGetContext("db") == "include") {
    const database = new DatabaseStack(app, `${project}-${stage}-database`, {
      ...config,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
      vpc: core.vpc,
      cloudVpnSecurityGroup: core.cloudVpnSecurityGroup,
      secretsManagerVpceSg: core.secretsManagerVpceSg,
    });
    applyDatabaseSuppressions(database, stage);
    database.addDependency(core);
  }

  const fileUpload = new FileUploadStack(app, `${project}-${stage}-file-upload`, {
    ...config,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    vpc: core.vpc,
  });
  fileUpload.addDependency(core);

  const api = new ApiStack(app, `${project}-${stage}-api`, {
    ...config,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    vpc: core.vpc,
  });
  api.addDependency(core);
  api.addDependency(fileUpload);

  const ui = new UiStack(app, `${project}-${stage}-ui`, {
    ...config,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    cognitoParamNames: {
      authority: core.cognitoAuthorityParamName,
      clientId: core.cognitoClientIdParamName,
    },
  });
  ui.addDependency(core);
  ui.addDependency(api);

  if (!config.isEphemeral) {
    const dbRole = new DBRoleStack(app, `${project}-${stage}-db-role`, {
      ...config,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
      vpc: core.vpc,
    });
    applyDbRoleSuppressions(dbRole, stage);
    dbRole.addDependency(core);
    fileUpload.addDependency(dbRole);
    api.addDependency(dbRole);
  }

  applyCoreSuppressions(core);
  applyApiSuppressions(api, stage);
  applyUISuppressions(ui, stage);
  applyFileUploadSuppressions(fileUpload, stage);
  Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
  return app;
}
