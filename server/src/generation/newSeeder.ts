import { addDays } from "date-fns";
import { generatePerson } from "./user/generatePerson";
import { generateUser } from "./user/generateUser";
import { PhaseName, STATES_AND_TERRITORIES } from "../constants";
import { generateDemonstration } from "./application/demonstration/generateDemonstration";
import { generateAmendmentOnDemonstration } from "./application/modification/generateAmendmentOnDemonstration";
import { generateExtensionOnDemonstration } from "./application/modification/generateExtensionOnDemonstration";
import { generateDeliverableOnDemonstration } from "./deliverable/generateDeliverableOnDemonstration";
import { progressApplicationThroughApproval } from "./application/progressApplicationThroughApproval";
import { generateSampleDateData } from "./generationData/generateSampleDateData";
import { generateSampleDocumentData } from "./generationData/generateSampleDocumentData";
import { updateRequiredFieldsForDemonstrationApproval } from "./application/updateRequiredFields/updateRequiredFieldsForDemonstration";
import { applyDemonstrationTypes } from "./application/demonstration/applyDemonstrationTypes";
import { updateRequiredFieldsForAmendmentApproval } from "./application/updateRequiredFields/updateRequiredFieldsForAmendment";
import { updateRequiredFieldsForExtensionApproval } from "./application/updateRequiredFields/updateRequiredFieldsForExtension";
import { State } from "../types";
import { config } from "dotenv";

type ModificationSeederConfiguration = {
  name: string;
  description: string;
  effectiveDate: Date;
  yearsActive: number;
};

type DeliverableSeederConfiguration = {
  name: string;
  deliverableType: string;
  dueDate: Date;
};

type DemonstrationSeederConfiguration = {
  projectOfficerUserId: string;
  name: string;
  description: string;
  stateId: State["id"];
  effectiveDate: Date;
  expirationDate: Date;
  completedThroughPhase: PhaseName | null;
  amendments: ModificationSeederConfiguration[];
  extensions: ModificationSeederConfiguration[];
  deliverables: DeliverableSeederConfiguration[];
};

export const seedDemonstration = async (config: DemonstrationSeederConfiguration) => {
  const demonstration = await generateDemonstration({
    name: config.name,
    description: config.description,
    projectOfficerUserId: config.projectOfficerUserId,
    stateId: config.stateId,
  });

  if (!config.completedThroughPhase) {
    return;
  }
  progressApplicationThroughPhase(demonstration.id);

  if (config.amendments.length > 0) {
    
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
