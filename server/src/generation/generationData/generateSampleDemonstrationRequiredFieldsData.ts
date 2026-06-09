import { addYears } from "date-fns";
import { SdgDivision } from "../../types";
import { DemonstrationRequiredFields } from "../application/updateRequiredFields/updateAdditionalDemonstrationData";

export const generateSampleDemonstrationRequiredFieldsData = ({
  effectiveDate,
  yearsActive,
}: {
  effectiveDate: Date;
  yearsActive: number;
}): DemonstrationRequiredFields => ({
  effectiveDate,
  expirationDate: addYears(effectiveDate, yearsActive),
  sdgDivision: "Division of Eligibility and Coverage Demonstrations" satisfies SdgDivision,
});
