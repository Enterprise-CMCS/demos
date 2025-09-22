import { Demonstration, Modification } from "@prisma/client";

export async function resolveBundleStatus(parent: Demonstration | Modification) {
  return parent.statusId;
}
