import { PhaseName } from "../../constants";
import { formatDateToPlainDate } from "../../dateUtilities";
import { PrismaTransactionClient } from "../../prismaClient";
import { validateAndUpdateDates } from "../applicationDate";
import { ApplicationDateInput } from "../applicationDate/applicationDateSchema";
import { startPhase } from "../applicationPhase";
import { __DEMOS_VERSION__ } from "../../flags";

export const updateAssociatedPhase = async (
  tx: PrismaTransactionClient,
  applicationId: string,
  phaseName: PhaseName
) => {
  const easternToday = formatDateToPlainDate(new Date());
  const phaseStartDate = await startPhase(tx, applicationId, phaseName, easternToday);

  const datesToUpdate: ApplicationDateInput[] = [];

  if (phaseStartDate) {
    datesToUpdate.push(phaseStartDate);
  }

  if (datesToUpdate.length > 0) {
    await validateAndUpdateDates(
      { applicationId: applicationId, applicationDates: datesToUpdate },
      tx,
      __DEMOS_VERSION__
    );
  }
};
