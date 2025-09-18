import { CdkCustomResourceResponse, CloudFormationCustomResourceEvent, Context } from "aws-lambda";
import { applyRoleChanges, deleteAllRoles } from "./services/roles";
import { loadEnvs } from "./util/env";

export const handler = async (event: CloudFormationCustomResourceEvent, context: Context) => {
  console.log("event", event);
  loadEnvs(context);

  const physicalResourceId = `demos-jesse-db-role-roles-custom${event.LogicalResourceId}`;

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
    switch (requestType) {
      case "Create":
        console.log("create");
        await applyRoleChanges(event.ResourceProperties.roles);
        break;
      case "Update":
        console.log("update");
        await applyRoleChanges(event.ResourceProperties.roles, event.OldResourceProperties.roles);
        break;
      case "Delete":
        console.log("delete");
        await deleteAllRoles(event.ResourceProperties.roles);
        break;

      default:
        throw new Error(`invalid request type: ${requestType}`);
    }
  } catch (err) {
    console.log("failed at root:", err);
    throw err;
  }
  response.Status = "SUCCESS";
  response.Data = {};
  return response;
};
