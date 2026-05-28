import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { ClearanceLevel, LocalDate, PhaseName, SetApplicationDatesInput } from "../../types";
import { applicationDateResolvers } from "../../model/applicationDate/applicationDateResolvers";
import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../../dateUtilities";
import { TZDate } from "@date-fns/tz";
import { applicationResolvers } from "../../model/application/applicationResolvers";

const PHASE_NAME: PhaseName = "Review";

export const completeReviewPhase = async (
  applicationId: string,
  clearanceLevel: ClearanceLevel,
  baseNow: TZDate
) => {
  applicationResolvers.Mutation.setApplicationClearanceLevel(null, {
    input: {
      applicationId,
      clearanceLevel,
    },
  });

  const applicationDates: SetApplicationDatesInput["applicationDates"] = [
    {
      dateType: "OGD Approval to Share with SMEs",
      dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
    },
    {
      dateType: "Draft Approval Package to Prep",
      dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
    },
    {
      dateType: "DDME Approval Received",
      dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
    },
    {
      dateType: "State Concurrence",
      dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
    },
    {
      dateType: "BN PMT Approval to Send to OMB",
      dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
    },
    {
      dateType: "Draft Approval Package Shared",
      dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
    },
    {
      dateType: "Receive OMB Concurrence",
      dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
    },
    {
      dateType: "Receive OGC Legal Clearance",
      dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
    },
  ];

  if (clearanceLevel === "CMS (OSORA)") {
    const cmsOsoraDates: SetApplicationDatesInput["applicationDates"] = [
      {
        dateType: "Submit Approval Package to OSORA",
        dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
      },
      {
        dateType: "OSORA R1 Comments Due",
        dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
      },
      {
        dateType: "OSORA R2 Comments Due",
        dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
      },
      {
        dateType: "CMS (OSORA) Clearance End",
        dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
      },
    ];
    applicationDates.push(...cmsOsoraDates);
  } else if (clearanceLevel === "COMMs") {
    const cmsOsoraDates: SetApplicationDatesInput["applicationDates"] = [
      {
        dateType: "Package Sent for COMMs Clearance",
        dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
      },
      {
        dateType: "COMMs Clearance Received",
        dateValue: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(baseNow)) as LocalDate,
      },
    ];
    applicationDates.push(...cmsOsoraDates);
  }

  await applicationDateResolvers.Mutation.setApplicationDates(null, {
    input: {
      applicationId,
      applicationDates,
    },
  });

  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: {
      applicationId,
      phaseName: PHASE_NAME,
    },
  });
};
