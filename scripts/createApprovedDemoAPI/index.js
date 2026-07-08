/* global process, URL */

import dotenv from "dotenv";
import { tsImport } from "tsx/esm/api";
import { getLocalDatabaseUrl } from "../localDatabaseGuard.js";

dotenv.config({ path: new URL("./.env", import.meta.url), quiet: true });
dotenv.config({ path: new URL("../../server/.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

const { COMPLETED_PHASE_STATUS_ID, PERSON_TYPE_ID, SEED_CONFIG } = await import("./config.js");

process.env.DATABASE_URL = getLocalDatabaseUrl(SEED_CONFIG.fallbackDatabaseUrl);

const importServerTs = (specifier) =>
  tsImport(new URL(`../../server/src/${specifier}`, import.meta.url).href, import.meta.url);

const { APPROVAL_PACKAGE_PHASE_DOCUMENTS } = await importServerTs("constants.ts");
const { prisma } = await importServerTs("prismaClient.ts");
const { demonstrationResolvers } = await importServerTs(
  "model/demonstration/demonstrationResolvers.ts"
);
const { applicationDateResolvers } = await importServerTs(
  "model/applicationDate/applicationDateResolvers.ts"
);
const { applicationPhaseResolvers } = await importServerTs(
  "model/applicationPhase/applicationPhaseResolvers.ts"
);
const { demonstrationTypeTagAssignmentResolvers } = await importServerTs(
  "model/demonstrationTypeTagAssignment/demonstrationTypeTagAssignmentResolvers.ts"
);
const { documentPendingUploadResolvers } = await importServerTs(
  "model/documentPendingUpload/documentPendingUploadResolvers.ts"
);
const { documentResolvers } = await importServerTs("model/document/documentResolvers.ts");

const { createApprovedDemo } = await import("./workflow.js");
const db = prisma();

function toMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function step(label, action) {
  try {
    return await action();
  } catch (error) {
    throw new Error(`${label} failed: ${toMessage(error)}`, { cause: error });
  }
}

function makeContext() {
  return {
    user: {
      id: SEED_CONFIG.projectOfficerUserId.trim(),
      cognitoSubject: "create-approved-demo-script",
      personTypeId: PERSON_TYPE_ID,
      permissions: ["View All Demonstrations", "View All Documents"],
    },
  };
}

function makeApprovedDemoApi(context) {
  return {
    getState: (id) =>
      db.state.findUniqueOrThrow({
        where: { id },
        select: { id: true, name: true },
      }),

    createDemonstration: (input) =>
      demonstrationResolvers.Mutation.createDemonstration(null, { input }),

    updateDemonstration: (id, input) =>
      demonstrationResolvers.Mutation.updateDemonstration(null, { id, input }),

    setDemonstrationTypes: (input) =>
      demonstrationTypeTagAssignmentResolvers.Mutation.setDemonstrationTypes(null, { input }),

    setApplicationDates: (input) =>
      applicationDateResolvers.Mutation.setApplicationDates(null, { input }),

    completePhase: (input) =>
      applicationPhaseResolvers.Mutation.completePhase(null, { input }),

    completeFederalComment: (applicationId) =>
      db.applicationPhase.update({
        where: {
          applicationId_phaseId: {
            applicationId,
            phaseId: "Federal Comment",
          },
        },
        data: {
          phaseStatusId: COMPLETED_PHASE_STATUS_ID,
        },
        select: {
          phaseStatusId: true,
        },
      }),

    uploadDocumentToPhase: async (input) => {
      const pendingUpload =
        await documentPendingUploadResolvers.Mutation.uploadDocumentToPhase(
          null,
          { input },
          context
        );

      const presignedUploadUrl =
        await documentPendingUploadResolvers.DocumentPendingUpload.presignedUploadUrl(
          pendingUpload
        );

      return { ...pendingUpload, presignedUploadUrl };
    },

    documentExists: (documentId) =>
      documentResolvers.Query.documentExists(null, { documentId }, context),

    processUploadedDocument: async (documentId, applicationId) => {
      const rows = await db.$queryRawUnsafe(
        "SELECT demos_app.move_document_from_pending_to_clean($1::UUID, $2::TEXT) AS document_type_id;",
        documentId,
        `${applicationId}/${documentId}`
      );
      const documentTypeId = rows[0]?.document_type_id;
      if (!documentTypeId) {
        throw new Error(`No document type returned while processing ${documentId}.`);
      }
    },

    getDemonstration: async (id) => {
      const demonstration = await demonstrationResolvers.Query.demonstration(
        null,
        { id },
        context
      );
      const [state, documents, demonstrationTypes] = await Promise.all([
        demonstrationResolvers.Demonstration.state(demonstration),
        demonstrationResolvers.Demonstration.documents(demonstration, null, context),
        demonstrationResolvers.Demonstration.demonstrationTypes(demonstration),
      ]);

      return {
        ...demonstration,
        state,
        documents,
        demonstrationTypes,
        currentPhaseName:
          demonstrationResolvers.Demonstration.currentPhaseName(demonstration),
        sdgDivision: demonstrationResolvers.Demonstration.sdgDivision(demonstration),
        status: demonstrationResolvers.Demonstration.status(demonstration),
      };
    },
  };
}

try {
  await createApprovedDemo({
    step,
    api: makeApprovedDemoApi(makeContext()),
    approvalPackagePhaseDocuments: APPROVAL_PACKAGE_PHASE_DOCUMENTS,
  });
} finally {
  await db.$disconnect();
}
