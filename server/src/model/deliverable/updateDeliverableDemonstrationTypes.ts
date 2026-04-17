import { getDeliverable, ParsedUpdateDeliverableInput } from ".";
import { PrismaTransactionClient } from "../../prismaClient";
import { TagName } from "../../types";
import { findSetDifferences } from "../../validationUtilities";
import {
  getDeliverableDemonstrationTypes,
  setDeliverableDemonstrationTypes,
} from "../deliverableDemonstrationType";

export async function updateDeliverableDemonstrationTypes(
  deliverableId: string,
  updateInput: ParsedUpdateDeliverableInput,
  tx: PrismaTransactionClient
): Promise<void> {
  // If the demonstraion types aren't present, do nothing
  if (!updateInput.demonstrationTypes) {
    return undefined;
  }

  // Need to get the demonstration ID for inserts
  const currentDeliverable = await getDeliverable({ id: deliverableId }, tx);

  // Can turn these into a set because DB guarantees uniqueness
  const oldDemonstrationTypes: Set<TagName> = new Set(
    (await getDeliverableDemonstrationTypes(deliverableId, tx)).map(
      (demonstrationType) => demonstrationType.demonstrationTypeTagNameId
    )
  );

  // If there's a difference, do an update on the database
  const diff = findSetDifferences(oldDemonstrationTypes, updateInput.demonstrationTypes);
  if (!diff.setsMatch) {
    await setDeliverableDemonstrationTypes(
      {
        deliverableId: deliverableId,
        demonstrationId: currentDeliverable.demonstrationId,
        demonstrationTypes: Array.from(updateInput.demonstrationTypes),
      },
      tx
    );
  }
}
