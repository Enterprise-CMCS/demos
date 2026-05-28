import { demonstrationResolvers } from "../model/demonstration/demonstrationResolvers";
import { LocalDate } from "../types";

export const setEffectiveAndExpirationDateOnDemonstration = async (
  demonstrationId: string,
  effectiveDate: LocalDate,
  expirationDate: LocalDate
) => {
  await demonstrationResolvers.Mutation.updateDemonstration(null, {
    id: demonstrationId,
    input: {
      effectiveDate,
      expirationDate,
    },
  });
};
