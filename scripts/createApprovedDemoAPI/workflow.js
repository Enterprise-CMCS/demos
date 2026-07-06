/* global console */

import { randomUUID } from "node:crypto";
import {
  APPLICATION_TYPE_ID,
  CLEARANCE_LEVEL_ID,
  COMPLETED_PHASE_STATUS_ID,
  DEMONSTRATION_GRANT_LEVEL_ID,
  EXPECTED_FINAL_STATUS_ID,
  PERSON_TYPE_ID,
  PHASE_DOCUMENTS,
  PHASES,
  PROJECT_OFFICER_ROLE_ID,
  SEED_CONFIG,
} from "./config.js";
import {
  buildApplicationDates,
  buildDemonstrationWindow,
  selectApplicationDates,
} from "./dates.js";
import { readUploadPdf, uploadPhaseDocuments } from "./uploads.js";

async function requireRecord(description, getter) {
  const record = await getter();
  if (!record) {
    throw new Error(`Missing required ${description}.`);
  }
  return record;
}

async function requireStaticRows(db, requiredPhaseDocuments) {
  await requireRecord(`state ${SEED_CONFIG.stateId}`, () =>
    db.state.findUnique({ where: { id: SEED_CONFIG.stateId } })
  );
  await requireRecord(`SDG division ${SEED_CONFIG.sdgDivisionId}`, () =>
    db.sdgDivision.findUnique({ where: { id: SEED_CONFIG.sdgDivisionId } })
  );
  await requireRecord(`application type ${APPLICATION_TYPE_ID}`, () =>
    db.applicationType.findUnique({ where: { id: APPLICATION_TYPE_ID } })
  );
  await requireRecord(`clearance level ${CLEARANCE_LEVEL_ID}`, () =>
    db.clearanceLevel.findUnique({ where: { id: CLEARANCE_LEVEL_ID } })
  );
  await requireRecord(`person type ${PERSON_TYPE_ID}`, () =>
    db.personType.findUnique({ where: { id: PERSON_TYPE_ID } })
  );
  await requireRecord(
    `role ${PROJECT_OFFICER_ROLE_ID} with grant level ${DEMONSTRATION_GRANT_LEVEL_ID}`,
    () =>
      db.role.findUnique({
        where: {
          id_grantLevelId: {
            id: PROJECT_OFFICER_ROLE_ID,
            grantLevelId: DEMONSTRATION_GRANT_LEVEL_ID,
          },
        },
      })
  );
  await requireRecord(`role/person type ${PROJECT_OFFICER_ROLE_ID}/${PERSON_TYPE_ID}`, () =>
    db.rolePersonType.findUnique({
      where: {
        roleId_personTypeId: {
          roleId: PROJECT_OFFICER_ROLE_ID,
          personTypeId: PERSON_TYPE_ID,
        },
      },
    })
  );

  const missingPhaseStatuses = [];
  for (const phaseName of PHASES) {
    const phaseStatus = await db.phasePhaseStatus.findUnique({
      where: {
        phaseId_phaseStatusId: {
          phaseId: phaseName,
          phaseStatusId: COMPLETED_PHASE_STATUS_ID,
        },
      },
    });
    if (!phaseStatus) {
      missingPhaseStatuses.push(`${phaseName}/${COMPLETED_PHASE_STATUS_ID}`);
    }
  }
  if (missingPhaseStatuses.length > 0) {
    throw new Error(
      `Missing required phase/status rows: ${missingPhaseStatuses.join(", ")}.`
    );
  }

  const missingPhaseDocumentTypes = [];
  for (const { phaseName, documentType } of requiredPhaseDocuments) {
    const phaseDocumentType = await db.phaseDocumentType.findUnique({
      where: {
        phaseId_documentTypeId: {
          phaseId: phaseName,
          documentTypeId: documentType,
        },
      },
    });
    if (!phaseDocumentType) {
      missingPhaseDocumentTypes.push(`${phaseName}/${documentType}`);
    }
  }
  if (missingPhaseDocumentTypes.length > 0) {
    throw new Error(
      `Missing required phase/document type rows: ${missingPhaseDocumentTypes.join(", ")}.`
    );
  }
}

function getConfiguredProjectOfficer() {
  const id = SEED_CONFIG.projectOfficerUserId.trim();
  if (!id || id === "TODO_PROJECT_OFFICER_USER_ID") {
    throw new Error(
      "Set SEED_CONFIG.projectOfficerUserId on config.js " +
      "to an existing project officer id before running this script. Find one with: " +
      "query ProjectOfficers { people { id fullName personType roles { role isPrimary } } }"
    );
  }

  return { id, personTypeId: PERSON_TYPE_ID };
}

function makeContext(user) {
  return {
    user: {
      id: user.id,
      personTypeId: user.personTypeId,
    },
  };
}

function buildDemoName(stateName) {
  return `${stateName} ${SEED_CONFIG.demoNameSuffix} ${randomUUID().slice(0, 8)}`;
}

async function setApplicationDates(applicationDateResolvers, applicationId, applicationDates) {
  await applicationDateResolvers.Mutation.setApplicationDates(null, {
    input: {
      applicationId,
      applicationDates,
    },
  });
}

async function completePhase(applicationPhaseResolvers, applicationId, phaseName) {
  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: {
      applicationId,
      phaseName,
    },
  });
}

async function completeFederalCommentPhase(db, applicationId) {
  return await db.applicationPhase.update({
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
  });
}

async function getFinalDemonstration(db, demonstrationId) {
  const [demonstration, documentCount] = await Promise.all([
    db.demonstration.findUniqueOrThrow({
      where: { id: demonstrationId },
      select: {
        id: true,
        name: true,
        statusId: true,
        currentPhaseId: true,
        sdgDivisionId: true,
        state: { select: { id: true, name: true } },
        demonstrationTypeTagAssignments: {
          select: { tagNameId: true },
          orderBy: { tagNameId: "asc" },
        },
      },
    }),
    db.document.count({ where: { applicationId: demonstrationId } }),
  ]);

  return { ...demonstration, documentCount };
}

/**
 * Creates the approved demo
 *
 * @param db
 * @param step
 * @param approvalPackagePhaseDocuments
 * @param demonstrationResolvers
 * @param applicationDateResolvers
 * @param applicationPhaseResolvers
 * @param demonstrationTypeTagAssignmentResolvers
 * @param documentPendingUploadResolvers
 */
export async function createApprovedDemo({
  db,
  step,
  approvalPackagePhaseDocuments,
  demonstrationResolvers,
  applicationDateResolvers,
  applicationPhaseResolvers,
  demonstrationTypeTagAssignmentResolvers,
  documentPendingUploadResolvers,
}) {
  const pdfBytes = await step("Reading upload PDF", readUploadPdf);
  const demoWindow = buildDemonstrationWindow();
  const applicationDates = buildApplicationDates(demoWindow.effectiveDate);

  const requiredPhaseDocuments = [
    ...PHASE_DOCUMENTS.flatMap(({ phaseName, documentTypes }) =>
      documentTypes.map((documentType) => ({ phaseName, documentType }))
    ),
    ...approvalPackagePhaseDocuments.map((documentType) => ({
      phaseName: "Approval Package",
      documentType,
    })),
  ];

  await step("Validating static reference rows", () =>
    requireStaticRows(db, requiredPhaseDocuments)
  );

  const state = await db.state.findUniqueOrThrow({
    where: { id: SEED_CONFIG.stateId },
    select: { id: true, name: true },
  });
  const demoName = buildDemoName(state.name);

  const projectOfficer = getConfiguredProjectOfficer();
  const context = makeContext(projectOfficer);

  console.log(`Creating ${demoName}`);
  console.log(`Project officer id: ${projectOfficer.id}`);

  const demonstration = await step("Creating demonstration", () =>
    demonstrationResolvers.Mutation.createDemonstration(null, {
      input: {
        name: demoName,
        description: SEED_CONFIG.demoDescription,
        stateId: SEED_CONFIG.stateId,
        projectOfficerUserId: projectOfficer.id,
        sdgDivision: SEED_CONFIG.sdgDivisionId,
      },
    })
  );

  await step("Updating demonstration dates", () =>
    demonstrationResolvers.Mutation.updateDemonstration(null, {
      id: demonstration.id,
      input: {
        effectiveDate: demoWindow.effectiveDate,
        expirationDate: demoWindow.expirationDate,
      },
    })
  );

  await step("Applying demonstration type", () =>
    demonstrationTypeTagAssignmentResolvers.Mutation.setDemonstrationTypes(null, {
      input: {
        demonstrationId: demonstration.id,
        demonstrationTypes: [
          {
            demonstrationTypeName: SEED_CONFIG.demonstrationType,
            demonstrationTypeDates: {
              effectiveDate: demoWindow.effectiveDate,
              expirationDate: demoWindow.expirationDate,
            },
          },
        ],
      },
    })
  );

  await step("Completing Concept", async () => {
    await setApplicationDates(
      applicationDateResolvers,
      demonstration.id,
      selectApplicationDates(applicationDates, ["Concept Paper Submitted Date"])
    );
    await uploadPhaseDocuments({
      db,
      documentPendingUploadResolvers,
      applicationId: demonstration.id,
      phaseName: "Concept",
      documentTypes: ["Pre-Submission"],
      context,
      pdfBytes,
    });
    await completePhase(applicationPhaseResolvers, demonstration.id, "Concept");
  });

  await step("Completing Application Intake", async () => {
    await setApplicationDates(
      applicationDateResolvers,
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "State Application Submitted Date",
        "Completeness Review Due Date",
      ])
    );
    await uploadPhaseDocuments({
      db,
      documentPendingUploadResolvers,
      applicationId: demonstration.id,
      phaseName: "Application Intake",
      documentTypes: ["State Application"],
      context,
      pdfBytes,
    });
    await completePhase(applicationPhaseResolvers, demonstration.id, "Application Intake");
  });

  await step("Completing Completeness", async () => {
    await setApplicationDates(
      applicationDateResolvers,
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "State Application Deemed Complete",
        "Federal Comment Period Start Date",
        "Federal Comment Period End Date",
      ])
    );
    await uploadPhaseDocuments({
      db,
      documentPendingUploadResolvers,
      applicationId: demonstration.id,
      phaseName: "Completeness",
      documentTypes: ["Application Completeness Letter", "Internal Completeness Review Form"],
      context,
      pdfBytes,
    });
    await completePhase(applicationPhaseResolvers, demonstration.id, "Completeness");
  });

  await step("Completing Federal Comment for this application", async () => {
    const federalComment = await completeFederalCommentPhase(db, demonstration.id);
    if (federalComment.phaseStatusId !== "Completed") {
      throw new Error(
        `Federal Comment ended as ${federalComment.phaseStatusId}; expected Completed.`
      );
    }
  });

  await step("Completing SDG Preparation", async () => {
    await setApplicationDates(
      applicationDateResolvers,
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "Expected Approval Date",
        "SME Initial Review Date",
        "FRT Initial Meeting Date",
        "BNPMT Initial Meeting Date",
      ])
    );
    await completePhase(applicationPhaseResolvers, demonstration.id, "SDG Preparation");
  });

  await step("Completing Review", async () => {
    await setApplicationDates(
      applicationDateResolvers,
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "OGD Approval to Share with SMEs",
        "Draft Approval Package to Prep",
        "DDME Approval Received",
        "State Concurrence",
        "BN PMT Approval to Send to OMB",
        "Draft Approval Package Shared",
        "Receive OMB Concurrence",
        "Receive OGC Legal Clearance",
        "Submit Approval Package to OSORA",
        "OSORA R1 Comments Due",
        "OSORA R2 Comments Due",
        "CMS (OSORA) Clearance End",
      ])
    );
    await completePhase(applicationPhaseResolvers, demonstration.id, "Review");
  });

  await step("Completing Approval Package", async () => {
    await uploadPhaseDocuments({
      db,
      documentPendingUploadResolvers,
      applicationId: demonstration.id,
      phaseName: "Approval Package",
      documentTypes: approvalPackagePhaseDocuments,
      context,
      pdfBytes,
    });
    await completePhase(applicationPhaseResolvers, demonstration.id, "Approval Package");
  });

  await step("Completing Approval Summary", async () => {
    await setApplicationDates(
      applicationDateResolvers,
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "Application Details Marked Complete Date",
        "Application Demonstration Types Marked Complete Date",
        "Application Approval Date",
      ])
    );
    await completePhase(applicationPhaseResolvers, demonstration.id, "Approval Summary");
  });

  const finalDemonstration = await step("Loading final demonstration", () =>
    getFinalDemonstration(db, demonstration.id)
  );

  if (finalDemonstration.statusId !== EXPECTED_FINAL_STATUS_ID) {
    throw new Error(
      `Created demonstration ${finalDemonstration.id} but final status was ` +
        `${finalDemonstration.statusId}; expected ${EXPECTED_FINAL_STATUS_ID}.`
    );
  }

  console.log("");
  console.log("Approved demo created");
  console.log(`  id: ${finalDemonstration.id}`);
  console.log(`  name: ${finalDemonstration.name}`);
  console.log(`  state: ${finalDemonstration.state.name} (${finalDemonstration.state.id})`);
  console.log(`  status: ${finalDemonstration.statusId}`);
  console.log(`  currentPhase: ${finalDemonstration.currentPhaseId}`);
  console.log(`  sdgDivision: ${finalDemonstration.sdgDivisionId}`);
  console.log(
    `  demonstrationTypes: ${finalDemonstration.demonstrationTypeTagAssignments
      .map((assignment) => assignment.tagNameId)
      .join(", ")}`
  );
  console.log(`  uploadedDocuments: ${finalDemonstration.documentCount}`);
  console.log(`  url: /demonstrations/${finalDemonstration.id}`);
}
