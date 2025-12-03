import { PrismaTransactionClient } from "../../../prismaClient";
import { SetApplicationDatesInput } from "../../applicationDate/applicationDateSchema";

export async function findNotStartedPhasesFromDates(
  input: SetApplicationDatesInput,
  tx: PrismaTransactionClient
) {
  return await tx.applicationPhase.findMany({
    select: {
      phaseId: true,
      phase: {
        select: {
          phase: {
            select: {
              phaseDateTypes: {
                select: {
                  dateTypeId: true,
                },
              },
            },
          },
        },
      },
    },
    where: {
      applicationId: input.applicationId,
      phaseStatusId: "Not Started",
      phase: {
        phase: {
          phaseDateTypes: {
            some: {
              dateTypeId: {
                in: input.applicationDates.map((date) => date.dateType),
              },
            },
          },
        },
      },
    },
    orderBy: {
      phase: {
        phase: {
          phaseNumber: "asc",
        },
      },
    },
  });
}
