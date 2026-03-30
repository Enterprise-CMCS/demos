import { PrismaTransactionClient } from "../../../prismaClient";
import { DateType, PhaseName } from "../../../types";

export type OrderedPhaseDateTypes = {
  dateTypeId: DateType;
  phaseId: PhaseName;
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
  })) as OrderedPhaseDateTypes; // casting constrained by database
}
