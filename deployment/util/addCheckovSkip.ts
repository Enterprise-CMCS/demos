import { CfnResource } from "aws-cdk-lib";
import { Construct } from "constructs";

interface CheckovSkip {
  id: string
  reason: string
}

const isCheckovSkipArray = (T: unknown): T is CheckovSkip[] => {
  if (!Array.isArray(T)) {
    if (typeof T !== "undefined") {
      throw new Error("invalid");
    }
    return false;
  }

  return T.every(entry => entry.id && entry.reason);
};

export function addCheckovSkip(resource: Construct, ...skips: CheckovSkip[]) {

  let cfnResource = resource as CfnResource;
  if (!(cfnResource instanceof CfnResource)) {
    cfnResource = resource.node.defaultChild as CfnResource;
  }
  const checkovMetadata = cfnResource.getMetadata("checkov");

  let existingSkip: CheckovSkip[] = [];

  if (isCheckovSkipArray(checkovMetadata?.skip)) {
    existingSkip = checkovMetadata?.skip;
  }

  cfnResource.addMetadata("checkov", {
    skip: [...existingSkip, ...skips],
  });

}
