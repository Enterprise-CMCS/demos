import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";
import { PrismaTransactionClient } from "../../prismaClient";
import { getApplication } from "../application";
import { checkDemonstrationStatus } from "../demonstration";

export async function validateCreateAmendmentInput(
  input: { demonstrationId: string },
  tx: PrismaTransactionClient
): Promise<void> {
  const demonstration = await getApplication(input.demonstrationId, {
    applicationTypeId: "Demonstration",
    tx: tx,
  });

  const errors: (string | undefined)[] = [];
  errors.push(checkDemonstrationStatus(demonstration, "amendment"));
  cleanErrorsAndThrow(errors, "createAmendment", "CREATE_AMENDMENT_VALIDATION_FAILED");
}
