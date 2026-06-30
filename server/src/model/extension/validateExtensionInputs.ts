import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";
import { PrismaTransactionClient } from "../../prismaClient";
import { getApplication } from "../application";
import { checkDemonstrationStatus } from "../demonstration";

export async function validateCreateExtensionInput(
  input: { demonstrationId: string },
  tx: PrismaTransactionClient
): Promise<void> {
  const demonstration = await getApplication(input.demonstrationId, {
    applicationTypeId: "Demonstration",
    tx: tx,
  });

  const errors: (string | undefined)[] = [];
  errors.push(checkDemonstrationStatus(demonstration, "extension"));
  cleanErrorsAndThrow(errors, "createExtension", "CREATE_EXTENSION_VALIDATION_FAILED");
}
