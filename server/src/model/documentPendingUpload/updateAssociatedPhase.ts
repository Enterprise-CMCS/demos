import { PhaseName } from "../../constants";
import { getEasternNow } from "../../dateUtilities";
import { PrismaTransactionClient } from "../../prismaClient";
import { validateAndUpdateDates } from "../applicationDate";
import { ApplicationDateInput } from "../applicationDate/applicationDateSchema";
import { startPhase } from "../applicationPhase";

export const updateAssociatedPhase = async (
  tx: PrismaTransactionClient,
  applicationId: string,
  phaseName: PhaseName
) => {
  const easternNow = getEasternNow();
  const phaseStartDate = await startPhase(tx, applicationId, phaseName, easternNow);

  const datesToUpdate: ApplicationDateInput[] = [];

  if (phaseStartDate) {
    datesToUpdate.push(phaseStartDate);
  }

  if (datesToUpdate.length > 0) {
    await validateAndUpdateDates(
      { applicationId: applicationId, applicationDates: datesToUpdate },
      tx
    );
  }
};
