import { GraphQLError } from "graphql";
import { PrismaTransactionClient } from "../../prismaClient";
import { selectManyDeliverableDemonstrationTypes } from "../deliverableDemonstrationType/queries";
import { ParsedSetDemonstrationTypesInput } from "./demonstrationTypeTagAssignmentTypes";

export async function checkForDeliverableUsedDemonstrationTypes(
  input: ParsedSetDemonstrationTypesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  if (input.demonstrationTypesToDelete.length === 0) {
    return;
  }

  const linkedTypes = await selectManyDeliverableDemonstrationTypes(
    {
      demonstrationId: input.demonstrationId,
      demonstrationTypeTagNameId: { in: input.demonstrationTypesToDelete },
    },
    tx
  );

  if (linkedTypes.length > 0) {
    const linkedTypeNames = [
      ...new Set(linkedTypes.map((linkedType) => linkedType.demonstrationTypeTagNameId)),
    ];
    throw new GraphQLError(
      `Cannot remove demonstration types associated with a deliverable: ${linkedTypeNames.join(", ")}.`,
      { extensions: { code: "BAD_USER_INPUT" } }
    );
  }
}
