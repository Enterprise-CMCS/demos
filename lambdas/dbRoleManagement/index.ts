import { CdkCustomResourceResponse, CloudFormationCustomResourceEvent, Context } from "aws-lambda";
import { applyRoleChanges, deleteAllRoles } from "./services/roles";
import { getStage, loadEnvs } from "./util/env";
import {log} from "./log"

// Not adding the logger AsyncLocalStorage configuration since calls to this
// lambda are so infrequent. The code is still in the log.ts file for any future
// use, and to keep the log.ts file consistent across all services
export const handler = async (event: CloudFormationCustomResourceEvent, context: Context) => {
  log.info({event}, "incoming event"); // Do not remove this log, it is important for troubleshooting
  loadEnvs(context);

  const physicalResourceId = `demos-${getStage()}-db-role-roles-custom${event.LogicalResourceId}`;

  if (!event.ResourceProperties?.roles) {
    throw new Error("the array of roles must be defined");
  }

  const response: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: physicalResourceId,
  };

  const requestType = event.RequestType;
  try {
    log.debug({requestType});
    switch (requestType) {
      case "Create":
        await applyRoleChanges(event.ResourceProperties.roles);
        break;
      case "Update":
        await applyRoleChanges(event.ResourceProperties.roles, event.OldResourceProperties.roles);
        break;
      case "Delete":
        await deleteAllRoles(event.ResourceProperties.roles);
        break;

      default:
        throw new Error(`invalid request type: ${requestType}`);
    }
  } catch (err) {
    log.error({error: (err as Error).message}, "failed at root");
    throw err;
  }
  response.Status = "SUCCESS";
  response.Data = {};
  return response;
};
