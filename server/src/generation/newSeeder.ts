import { addDays } from "date-fns";
import { generatePerson } from "./user/generatePerson";
import { generateUser } from "./user/generateUser";
import { PhaseName, STATES_AND_TERRITORIES } from "../constants";
import { generateDemonstration } from "./application/demonstration/generateDemonstration";
import { generateAmendmentOnDemonstration } from "./application/modification/generateAmendmentOnDemonstration";
import { generateExtensionOnDemonstration } from "./application/modification/generateExtensionOnDemonstration";
import { generateDeliverableOnDemonstration } from "./deliverable/generateDeliverableOnDemonstration";
import {
  progressApplicationThroughApproval,
  progressApplicationThroughPhase,
} from "./application/progressApplicationThroughApproval";
import { generateSampleDateData } from "./generationData/generateSampleDateData";
import { generateSampleDocumentData } from "./generationData/generateSampleDocumentData";
import {
  updateAdditionalDemonstrationData,
  updateRequiredFieldsForDemonstrationApproval,
} from "./application/updateRequiredFields/updateAdditionalDemonstrationData";
import { applyDemonstrationTypes } from "./application/demonstration/applyDemonstrationTypes";
import { updateRequiredFieldsForAmendmentApproval } from "./application/updateRequiredFields/updateRequiredFieldsForAmendment";
import { updateRequiredFieldsForExtensionApproval } from "./application/updateRequiredFields/updateRequiredFieldsForExtension";
import { LocalDate, SdgDivision, SignatureLevel, State, TagName } from "../types";
import { config } from "dotenv";
import { amendmentResolvers } from "../model/amendment/amendmentResolvers";
import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../dateUtilities";
import { extensionResolvers } from "../model/extension/extensionResolvers";

type ModificationSeederConfiguration = {
  name: string;
  description: string;
  effectiveDate?: Date;
  signatureLevel?: SignatureLevel;
  completedThroughPhase?: PhaseName;
  documentOwnerUserId: string;
};

type DeliverableSeederConfiguration = {
  name: string;
  deliverableType: string;
  dueDate: Date;
};

type DemonstrationTypeSeederConfiguration = {
  name: TagName;
  effectiveDate: Date;
  expirationDate: Date;
};

type DemonstrationSeederConfiguration = {
  documentOwnerUserId: string;
  name: string;
  sdgDivision?: SdgDivision;
  completedThroughPhase?: PhaseName;
  projectOfficerUserId: string;
  expirationDate?: Date;
  effectiveDate?: Date;
  demonstrationTypes?: DemonstrationTypeSeederConfiguration[];
  amendments?: ModificationSeederConfiguration[];
  extensions?: ModificationSeederConfiguration[];
  deliverables?: DeliverableSeederConfiguration[];
};

export const seedAmendment = async (
  demonstrationId: string,
  config: ModificationSeederConfiguration
) => {
  const amendment = await amendmentResolvers.Mutation.createAmendment(null, {
    input: {
      name: config.name,
      description: config.description,
      demonstrationId,
    },
  });
  await amendmentResolvers.Mutation.updateAmendment(null, {
    id: amendment.id,
    input: {
      effectiveDate: config.effectiveDate
        ? (formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(config.effectiveDate)
          ) as LocalDate)
        : null,
      signatureLevel: config.signatureLevel,
    },
  });
  if (!config.completedThroughPhase) {
    return;
  }
  if (
    config.completedThroughPhase === "Approval Summary" &&
    (!config.effectiveDate || !config.signatureLevel)
  ) {
    throw new Error(
      "To seed an amendment through the Approval Summary phase, please provide values for effectiveDate and signatureLevel in the configuration."
    );
  }

  await progressApplicationThroughPhase({
    applicationId: amendment.id,
    clearanceLevel: "CMS (OSORA)",
    documentOwnerUserId: config.documentOwnerUserId,
    completedThroughPhase: config.completedThroughPhase,
  });
};

export const seedExtension = async (
  demonstrationId: string,
  config: ModificationSeederConfiguration
) => {
  const extension = await extensionResolvers.Mutation.createExtension(null, {
    input: {
      name: config.name,
      description: config.description,
      demonstrationId,
    },
  });
  await extensionResolvers.Mutation.updateExtension(null, {
    id: extension.id,
    input: {
      effectiveDate: config.effectiveDate
        ? (formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(config.effectiveDate)
          ) as LocalDate)
        : null,
      signatureLevel: config.signatureLevel,
    },
  });
  if (!config.completedThroughPhase) {
    return;
  }
  if (
    config.completedThroughPhase === "Approval Summary" &&
    (!config.effectiveDate || !config.signatureLevel)
  ) {
    throw new Error(
      "To seed an extension through the Approval Summary phase, please provide values for effectiveDate and signatureLevel in the configuration."
    );
  }

  await progressApplicationThroughPhase({
    applicationId: extension.id,
    clearanceLevel: "CMS (OSORA)",
    documentOwnerUserId: config.documentOwnerUserId,
    completedThroughPhase: config.completedThroughPhase,
  });
};

export const seedDemonstration = async (
  cmsUserId: string,
  config: DemonstrationSeederConfiguration
) => {
  const demonstration = await generateDemonstration({
    name: config.name,
    description: `Demonstration ${config.name} description`,
    projectOfficerUserId: config.projectOfficerUserId,
    stateId: STATES_AND_TERRITORIES[0].id,
    sdgDivision: config.sdgDivision,
  });

  await updateAdditionalDemonstrationData({
    demonstrationId: demonstration.id,
    expirationDate: config.expirationDate,
    effectiveDate: config.effectiveDate,
  });

  if (!config.completedThroughPhase) {
    return;
  }

  if (
    config.completedThroughPhase === "Approval Summary" &&
    (!config.sdgDivision ||
      !config.effectiveDate ||
      !config.expirationDate ||
      !config.demonstrationTypes ||
      config.demonstrationTypes.length === 0)
  ) {
    throw new Error(
      "To seed a demonstration through the Approval Summary phase, please provide values for sdgDivision, effectiveDate, expirationDate, and demonstrationTypes in the configuration."
    );
  }

  await progressApplicationThroughPhase({
    applicationId: demonstration.id,
    clearanceLevel: "CMS (OSORA)",
    documentOwnerUserId: config.documentOwnerUserId,
    completedThroughPhase: config.completedThroughPhase,
  });

  if (config.amendments) {
    for (const amendmentConfig of config.amendments) {
      const amendment = await seedAmendment(demonstration.id, amendmentConfig);
    }
    if (config.extensions) {
      for (const extensionConfig of config.extensions) {
        const extension = await seedExtensionOnDemonstration(config);
      }
    }
    if (config.deliverables) {
      for (const deliverableConfig of config.deliverables) {
        const deliverable = await seedDeliverableOnDemonstration(config);
      }
    }
  }
};

//   const demonstration = await generateDemonstration({
//     description: "Test demonstration description",
//     name: "Test demonstration",
//     projectOfficerUserId: cmsUserId,
//     stateId: STATES_AND_TERRITORIES[0].id,
//   });

//   await updateRequiredFieldsForDemonstrationApproval({
//     demonstrationId: demonstration.id,
//     requiredFields: {
//       effectiveDate: addDays(new Date(), -30),
//       expirationDate: addDays(new Date(), 30),
//       sdgDivision: "Division of Eligibility and Coverage Demonstrations",
//     },
//   });

//   await applyDemonstrationTypes({
//     demonstrationId: demonstration.id,
//     demonstrationTypes: [
//       {
//         name: "demos-1115a",
//         effectiveDate: addDays(new Date(), -30),
//         expirationDate: addDays(new Date(), 30),
//       },
//     ],
//   });
//   await progressApplicationThroughApproval({
//     applicationId: demonstration.id,
//     documentOwnerUserId: cmsUserId,
//     dates: generateSampleDateData({ approvalDate: addDays(new Date(), -10) }),
//     documents: generateSampleDocumentData(),
//     clearanceLevel: "CMS (OSORA)",
//   });

//   const amendment = await generateAmendmentOnDemonstration({
//     demonstrationId: demonstration.id,
//     name: "Test amendment",
//     description: "Test amendment description",
//   });
//   await updateRequiredFieldsForAmendmentApproval({
//     amendmentId: amendment.id,
//     requiredFields: {
//       effectiveDate: addDays(new Date(), -15),
//       signatureLevel: "OCD",
//     },
//   });

//   await progressApplicationThroughApproval({
//     applicationId: amendment.id,
//     documentOwnerUserId: cmsUserId,
//     dates: generateSampleDateData({ approvalDate: addDays(new Date(), -5) }),
//     documents: generateSampleDocumentData(),
//     clearanceLevel: "CMS (OSORA)",
//   });

//   const extension = await generateExtensionOnDemonstration({
//     demonstrationId: demonstration.id,
//     name: "Test extension",
//     description: "Test extension description",
//   });

//   await updateRequiredFieldsForExtensionApproval({
//     extensionId: extension.id,
//     requiredFields: {
//       effectiveDate: addDays(new Date(), -15),
//       signatureLevel: "OCD",
//     },
//   });

//   await progressApplicationThroughApproval({
//     applicationId: extension.id,
//     documentOwnerUserId: cmsUserId,
//     dates: generateSampleDateData({ approvalDate: addDays(new Date(), -2) }),
//     documents: generateSampleDocumentData(),
//     clearanceLevel: "CMS (OSORA)",
//   });

//   const deliverable = await generateDeliverableOnDemonstration({
//     demonstrationId: demonstration.id,
//     name: "Test deliverable",
//     cmsOwnerUserId: cmsUserId,
//     deliverableType: "Close Out Report",
//     dueDate: addDays(new Date(), 30),
//   });
// };

const runSeeder = async () => {
  const person = await generatePerson({
    firstName: "CMS",
    lastName: "User",
    email: "cms_user@fakeemail.com",
    personTypeId: "demos-cms-user",
  });
  const user = await generateUser({
    personId: person.id,
    username: "cms_user",
    personTypeId: "demos-cms-user",
  });
};

runSeeder();
