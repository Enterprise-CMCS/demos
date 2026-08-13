import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";
import { checkPersonCanBePrimary } from "./checkPersonCanBePrimary";
import { SetDemonstrationRoleInput } from "./demonstrationRoleAssignmentSchema";

export async function validateSetDemonstrationRoleInput(
  input: SetDemonstrationRoleInput
): Promise<void> {
  const errors: (string | undefined)[] = [];

  errors.push(await checkPersonCanBePrimary(input));
  cleanErrorsAndThrow(errors, "setDemonstrationRole", "SET_DEMONSTRATION_ROLE_VALIDATION_FAILED");
}
