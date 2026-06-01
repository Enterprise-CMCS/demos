import { generateDemonstration } from "./generateDemonstration";
import { generateUser } from "./generateUser";
import { generateExtension } from "./generateExtension";
import { progressThroughPhase } from "./completePhase/progressThroughPhase";
import { addDays } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { PHASE_NAMES } from "../constants";
import { generateAmendment } from "./generateAmendment";
import { prepareApplicationForCompletion } from "./completePhase/prepareApplicationForCompletion";
import { generateDeliverable } from "./generateDeliverable";
import { uploadDocumentToDeliverableCMSFiles } from "./uploadDocumentsToDeliverableCMSFiles";
import { uploadDocumentToDeliverableStateFiles } from "./uploadDocumentsToDeliverableStateFiles";

const generateDemonstrationWithAmendments = async ({ userId }: { userId: string }) => {
  const demonstrationWithAmendments = await generateDemonstration({
    name: "Demonstration with Amendment - " + new Date().toISOString(),
    state: "NY",
    projectOfficerUserId: userId,
  });
  await prepareApplicationForCompletion(
    demonstrationWithAmendments.id,
    "Demonstration",
    new TZDate()
  );
  await progressThroughPhase({
    applicationId: demonstrationWithAmendments.id,
    documentOwnerUserId: userId,
    phaseName: "Approval Summary",
    baseNow: addDays(new TZDate(), -90),
    applicationType: "Demonstration",
  });

  for (const phaseName of PHASE_NAMES) {
    const amendment = await generateAmendment({
      demonstrationId: demonstrationWithAmendments.id,
      name: `Amendment on ${demonstrationWithAmendments.id} - ${new Date().toISOString()}`,
    });
    await prepareApplicationForCompletion(amendment.id, "Amendment", new TZDate());

    await progressThroughPhase({
      applicationId: amendment.id,
      documentOwnerUserId: userId,
      phaseName,
      baseNow: addDays(new TZDate(), -90),
      applicationType: "Amendment",
    });
  }
};

const generateDemonstrationWithExtensions = async ({ userId }: { userId: string }) => {
  const demonstrationWithExtensions = await generateDemonstration({
    name: "Demonstration with Extension - " + new Date().toISOString(),
    state: "NY",
    projectOfficerUserId: userId,
  });
  await prepareApplicationForCompletion(
    demonstrationWithExtensions.id,
    "Demonstration",
    new TZDate()
  );
  await progressThroughPhase({
    applicationId: demonstrationWithExtensions.id,
    documentOwnerUserId: userId,
    phaseName: "Approval Summary",
    baseNow: addDays(new TZDate(), -90),
    applicationType: "Demonstration",
  });

  for (const phaseName of PHASE_NAMES) {
    const extension = await generateExtension({
      demonstrationId: demonstrationWithExtensions.id,
      name: `Extension on ${demonstrationWithExtensions.id} - ${new Date().toISOString()}`,
    });
    await prepareApplicationForCompletion(extension.id, "Extension", new TZDate());

    await progressThroughPhase({
      applicationId: extension.id,
      documentOwnerUserId: userId,
      phaseName,
      baseNow: addDays(new TZDate(), -90),
      applicationType: "Extension",
    });
  }
};

const generateDemonstrationsThroughAllPhases = async ({ userId }: { userId: string }) => {
  for (const phaseName of PHASE_NAMES) {
    const demonstration = await generateDemonstration({
      name: "Demonstration" + new Date().toISOString(),
      state: "NY",
      projectOfficerUserId: userId,
    });
    await prepareApplicationForCompletion(demonstration.id, "Demonstration", new TZDate());
    await progressThroughPhase({
      applicationId: demonstration.id,
      documentOwnerUserId: userId,
      phaseName,
      baseNow: addDays(new TZDate(), -90),
      applicationType: "Demonstration",
    });
  }
};

const generateApprovedDemonstration = async ({ userId }: { userId: string }) => {
  const approvedDemonstration = await generateDemonstration({
    name: "Approved Demonstration - " + new Date().toISOString(),
    state: "NY",
    projectOfficerUserId: userId,
  });
  await prepareApplicationForCompletion(approvedDemonstration.id, "Demonstration", new TZDate());
  await progressThroughPhase({
    applicationId: approvedDemonstration.id,
    documentOwnerUserId: userId,
    phaseName: "Approval Summary",
    baseNow: addDays(new TZDate(), -90),
    applicationType: "Demonstration",
  });
  return approvedDemonstration;
};

const generateDemonstrationWithDeliverbleAndDocuments = async ({ userId }: { userId: string }) => {
  const demonstration = await generateApprovedDemonstration({ userId });
  const deliverable = await generateDeliverable({
    demonstrationId: demonstration.id,
    cmsOwnerUserId: userId,
    deliverableType: "Close Out Report",
  });

  await uploadDocumentToDeliverableCMSFiles({
    demonstrationId: demonstration.id,
    deliverableId: deliverable.id,
    documentOwnerUserId: userId,
    documentType: "General File",
  });
  await uploadDocumentToDeliverableStateFiles({
    demonstrationId: demonstration.id,
    deliverableId: deliverable.id,
    documentOwnerUserId: userId,
    documentType: "Close Out Report",
  });
  return demonstration;
};

const generateCmsUser = async () =>
  generateUser({
    firstName: "CMS",
    lastName: "User",
    personTypeId: "demos-cms-user",
  });

const runSeeder = async () => {
  console.log("Starting seeding process...");
  const startTime = new Date();

  const cmsUser = await generateCmsUser();

  for (let i = 0; i < 10; i++) {
    await generateApprovedDemonstration({ userId: cmsUser.id });
    console.log(`Generating approved demonstration ${i + 1}/20.`);
  }
  for (let i = 0; i < 10; i++) {
    await generateDemonstrationsThroughAllPhases({ userId: cmsUser.id });
    console.log(`Generating demonstrations through all phases ${i + 1}/10.`);
  }
  for (let i = 0; i < 10; i++) {
    await generateDemonstrationWithAmendments({ userId: cmsUser.id });
    console.log(`Generating demonstration with amendments ${i + 1}/20.`);
  }
  for (let i = 0; i < 10; i++) {
    await generateDemonstrationWithExtensions({ userId: cmsUser.id });
    console.log(`Generating demonstration with extensions ${i + 1}/20.`);
  }
  for (let i = 0; i < 10; i++) {
    await generateDemonstrationWithDeliverbleAndDocuments({ userId: cmsUser.id });
    console.log(`Generating demonstration with deliverable and documents ${i + 1}/20.`);
  }

  const endTime = new Date();
  console.log(
    `Seeding process completed in ${(endTime.getTime() - startTime.getTime()) / 1000} seconds.`
  );
};

runSeeder();
