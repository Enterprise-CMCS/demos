import { PrismaTransactionClient } from "../../../prismaClient";
import { DateType, PhaseNameWithTrackedStatus } from "../../../types";

export type OrderedPhaseDateTypes = {
  dateTypeId: DateType;
  phaseId: PhaseNameWithTrackedStatus;
}[];
export async function getOrderedPhaseDateTypes(
  tx: PrismaTransactionClient
): Promise<OrderedPhaseDateTypes> {
  return (await tx.phaseDateType.findMany({
    select: {
      dateTypeId: true,
      phaseId: true,
    },
    orderBy: {
      phase: {
        phaseNumber: "asc",
      },
    },
  })) as OrderedPhaseDateTypes;
}
