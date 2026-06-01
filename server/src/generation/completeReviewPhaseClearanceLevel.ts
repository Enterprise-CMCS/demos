import { TZDate } from "@date-fns/tz";
import { applicationResolvers } from "../model/application/applicationResolvers";
import { ApplicationType, ClearanceLevel } from "../types";
import { addApplicationDates } from "./addApplicationDates";

export const completeReviewPhaseClearanceLevel = async ({
  applicationId,
  clearanceLevel,
  baseNow,
  applicationType,
}: {
  applicationId: string;
  clearanceLevel: ClearanceLevel;
  baseNow: TZDate;
  applicationType: ApplicationType;
}) => {
  await applicationResolvers.Mutation.setApplicationClearanceLevel(null, {
    input: {
      applicationId,
      clearanceLevel,
    },
  });

  if (clearanceLevel === "CMS (OSORA)") {
    await addApplicationDates({
      applicationId,
      dates: [
        {
          dateType: "Submit Approval Package to OSORA",
          dateValue: baseNow,
        },
        {
          dateType: "OSORA R1 Comments Due",
          dateValue: baseNow,
        },
        {
          dateType: "OSORA R2 Comments Due",
          dateValue: baseNow,
        },
        {
          dateType: "CMS (OSORA) Clearance End",
          dateValue: baseNow,
        },
      ],
    });
  } else {
    await addApplicationDates({
      applicationId,
      dates: [
        {
          dateType: "Package Sent for COMMs Clearance",
          dateValue: baseNow,
        },
        {
          dateType: "COMMs Clearance Received",
          dateValue: baseNow,
        },
      ],
    });
  }
};
