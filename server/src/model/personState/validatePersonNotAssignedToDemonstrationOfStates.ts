import { PrismaTransactionClient } from "../../prismaClient";
import { selectManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment/queries";
import { State } from "../state/stateSchema";

export async function validatePersonNotAssignedToDemonstrationOfStates(
  personId: string,
  stateIds: State["id"][],
  tx: PrismaTransactionClient
): Promise<string | undefined> {
  const roleAssignments = await selectManyDemonstrationRoleAssignments(
    {
      personId,
      stateId: {
        in: stateIds,
      },
    },
    tx
  );

  if (roleAssignments.length > 0) {
    const disallowedStateIds = roleAssignments
      .map((roleAssignment) => roleAssignment.stateId)
      .join(", ");
    return `Cannot unassign states ${disallowedStateIds} from person ${personId} because they are assigned to demonstrations belonging to them.`;
  }
}
