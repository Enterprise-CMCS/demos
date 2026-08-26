import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";
import { PrismaTransactionClient } from "../../prismaClient";
import { checkPersonCanBePrimary } from "./checkPersonCanBePrimary";
import { SetDemonstrationRoleInput } from "./demonstrationRoleAssignmentSchema";

export async function validateSetDemonstrationRoleInput(
  input: SetDemonstrationRoleInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const errors: (string | undefined)[] = [];

  errors.push(await checkPersonCanBePrimary(input, tx));
  cleanErrorsAndThrow(errors, "setDemonstrationRole", "SET_DEMONSTRATION_ROLE_VALIDATION_FAILED");
}
