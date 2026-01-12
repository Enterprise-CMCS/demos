import { PrismaTransactionClient } from "../../../prismaClient";
import { DateType, PhaseName } from "../../../types";

export type PhaseDateType = {
  phaseId: PhaseName;
  dateTypeId: DateType;
};

export const getPhaseDateTypesByIds = async (
  tx: PrismaTransactionClient,
  phaseIds: PhaseName[],
  dateTypes: DateType[]
): Promise<PhaseDateType[]> => {
  return (await tx.phaseDateType.findMany({
    where: {
      phaseId: { in: phaseIds },
      dateTypeId: { in: dateTypes },
    },
    select: {
      phaseId: true,
      dateTypeId: true,
    },
    // casting enforced by database constraints
  })) as PhaseDateType[];
};
