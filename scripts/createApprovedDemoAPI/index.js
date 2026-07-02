/* global console, fetch, process, setTimeout, URL */

import { access, readFile } from "node:fs/promises";
import { basename } from "node:path";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { getLocalDatabaseUrl } from "../localDatabaseGuard.js";

dotenv.config({ path: new URL("../../server/.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

const SEED_CONFIG = {
  fallbackDatabaseUrl: "postgresql://localhost:5432/demos?schema=demos_app",
  demoNameSuffix: "Generated Approved Demonstration",
  demoDescription: "Approved demonstration created by createApprovedDemoAPI.",
  stateId: process.env.APPROVED_DEMO_STATE_ID ?? "MD",
  sdgDivisionId:
    process.env.APPROVED_DEMO_SDG_DIVISION ??
    "Division of System Reform Demonstrations",
  demonstrationType:
    process.env.APPROVED_DEMO_TYPE ?? "Serious Mental Illness (SMI)",
  documentPath:
    process.env.APPROVED_DEMO_DOCUMENT_PATH ??
    "/workspaces/demos/junk_drawer/DEMOS DOCS/AAA_nothing_doc.pdf",
  defaultLocalSimpleUpload: true,
  effectiveDateLookbackMonths: 6,
  demoWindowYears: 5,
  processedUploadTimeoutMs: 30_000,
  processedUploadPollMs: 500,
  fallbackProjectOfficerUsername: "approved_demo_project_officer",
  fallbackProjectOfficerEmail: "approved_demo_project_officer@example.com",
  fallbackProjectOfficerFirstName: "Approved Demo",
  fallbackProjectOfficerLastName: "Project Officer",
};

const APPLICATION_TYPE_ID = "Demonstration";
const CLEARANCE_LEVEL_ID = "CMS (OSORA)";
const COMPLETED_PHASE_STATUS_ID = "Completed";
const DEMONSTRATION_GRANT_LEVEL_ID = "Demonstration";
const EXPECTED_FINAL_STATUS_ID = "Approved";
const PERSON_TYPE_ID = "demos-cms-user";
const PROJECT_OFFICER_ROLE_ID = "Project Officer";
const SYSTEM_GRANT_LEVEL_ID = "System";
const SYSTEM_ROLE_ID = "CMS User";

const PHASES = [
  "Concept",
  "Application Intake",
  "Completeness",
  "Federal Comment",
  "SDG Preparation",
  "Review",
  "Approval Package",
  "Approval Summary",
];

const PHASE_DOCUMENTS = [
  { phaseName: "Concept", documentTypes: ["Pre-Submission"] },
  { phaseName: "Application Intake", documentTypes: ["State Application"] },
  {
    phaseName: "Completeness",
    documentTypes: ["Application Completeness Letter", "Internal Completeness Review Form"],
  },
];

const APPLICATION_DATE_OFFSETS_FROM_EFFECTIVE_DATE = [
  ["Concept Paper Submitted Date", 100],
  ["State Application Submitted Date", 96],
  ["Completeness Review Due Date", 81],
  ["State Application Deemed Complete", 86],
  ["Federal Comment Period Start Date", 85],
  ["Federal Comment Period End Date", 55],
  ["Expected Approval Date", 80],
  ["SME Initial Review Date", 79],
  ["FRT Initial Meeting Date", 78],
  ["BNPMT Initial Meeting Date", 77],
  ["OGD Approval to Share with SMEs", 75],
  ["Draft Approval Package to Prep", 74],
  ["DDME Approval Received", 73],
  ["State Concurrence", 72],
  ["BN PMT Approval to Send to OMB", 71],
  ["Draft Approval Package Shared", 70],
  ["Receive OMB Concurrence", 69],
  ["Receive OGC Legal Clearance", 68],
  ["Submit Approval Package to OSORA", 67],
  ["OSORA R1 Comments Due", 66],
  ["OSORA R2 Comments Due", 65],
  ["CMS (OSORA) Clearance End", 64],
  ["Application Details Marked Complete Date", 61],
  ["Application Demonstration Types Marked Complete Date", 61],
  ["Application Approval Date", 60],
];

process.env.DATABASE_URL = getLocalDatabaseUrl(SEED_CONFIG.fallbackDatabaseUrl);
if (
  SEED_CONFIG.defaultLocalSimpleUpload &&
  process.env.LOCAL_SIMPLE_UPLOAD === undefined
) {
  process.env.LOCAL_SIMPLE_UPLOAD = "true";
}

const serverPackageJsonUrl = new URL("../../server/package.json", import.meta.url);
const serverRequire = createRequire(serverPackageJsonUrl);
const { require: tsxRequire } = serverRequire("tsx/cjs/api");
const requireServerTs = (specifier) =>
  tsxRequire(
    fileURLToPath(new URL(`../../server/src/${specifier}`, import.meta.url)),
    import.meta.url
  );

const { APPROVAL_PACKAGE_PHASE_DOCUMENTS } = requireServerTs("constants.ts");
const { prisma } = requireServerTs("prismaClient.ts");
const { demonstrationResolvers } = requireServerTs(
  "model/demonstration/demonstrationResolvers.ts"
);
const { applicationDateResolvers } = requireServerTs(
  "model/applicationDate/applicationDateResolvers.ts"
);
const { applicationPhaseResolvers } = requireServerTs(
  "model/applicationPhase/applicationPhaseResolvers.ts"
);
const { demonstrationTypeTagAssignmentResolvers } = requireServerTs(
  "model/demonstrationTypeTagAssignment/demonstrationTypeTagAssignmentResolvers.ts"
);
const { documentPendingUploadResolvers } = requireServerTs(
  "model/documentPendingUpload/documentPendingUploadResolvers.ts"
);

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

function toLocalDateString(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function fromLocalDateString(localDateString) {
  const [year, month, day] = localDateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(localDateString, days) {
  const date = fromLocalDateString(localDateString);
  date.setUTCDate(date.getUTCDate() + days);
  return toLocalDateString(date);
}

function addYears(localDateString, years) {
  const date = fromLocalDateString(localDateString);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return toLocalDateString(date);
}

function addMonths(date, months) {
  const nextDate = new Date(date);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + months);
  return nextDate;
}

function randomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildDemonstrationWindow() {
  const latestEffectiveDate = new Date();
  latestEffectiveDate.setUTCHours(0, 0, 0, 0);

  const earliestEffectiveDate = addMonths(
    latestEffectiveDate,
    -SEED_CONFIG.effectiveDateLookbackMonths
  );
  const daysInWindow = Math.floor(
    (latestEffectiveDate.getTime() - earliestEffectiveDate.getTime()) / 86_400_000
  );
  const effectiveDate = new Date(earliestEffectiveDate);
  effectiveDate.setUTCDate(
    effectiveDate.getUTCDate() + randomIntInclusive(0, daysInWindow)
  );

  const effectiveDateString = toLocalDateString(effectiveDate);
  return {
    effectiveDate: effectiveDateString,
    expirationDate: addYears(effectiveDateString, SEED_CONFIG.demoWindowYears),
  };
}

function buildApplicationDates(effectiveDate) {
  return APPLICATION_DATE_OFFSETS_FROM_EFFECTIVE_DATE.map(
    ([dateType, daysBeforeEffectiveDate]) => ({
      dateType,
      dateValue: addDays(effectiveDate, -daysBeforeEffectiveDate),
    })
  );
}

function selectApplicationDates(applicationDates, dateTypes) {
  return dateTypes.map((dateType) => {
    const applicationDate = applicationDates.find((date) => date.dateType === dateType);
    if (!applicationDate) {
      throw new Error(`No generated application date found for ${dateType}.`);
    }
    return applicationDate;
  });
}

async function requireRecord(description, getter) {
  const record = await getter();
  if (!record) {
    throw new Error(`Missing required ${description}.`);
  }
  return record;
}

async function requireStaticRows(requiredPhaseDocuments) {
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
  await requireRecord(
    `role ${SYSTEM_ROLE_ID} with grant level ${SYSTEM_GRANT_LEVEL_ID}`,
    () =>
      db.role.findUnique({
        where: {
          id_grantLevelId: {
            id: SYSTEM_ROLE_ID,
            grantLevelId: SYSTEM_GRANT_LEVEL_ID,
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
  await requireRecord(`role/person type ${SYSTEM_ROLE_ID}/${PERSON_TYPE_ID}`, () =>
    db.rolePersonType.findUnique({
      where: {
        roleId_personTypeId: {
          roleId: SYSTEM_ROLE_ID,
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

async function getOrCreateProjectOfficer() {
  const cmsUserCount = await db.user.count({
    where: { personTypeId: PERSON_TYPE_ID },
  });

  if (cmsUserCount > 0) {
    return await db.user.findFirstOrThrow({
      where: { personTypeId: PERSON_TYPE_ID },
      orderBy: { id: "asc" },
      skip: randomIntInclusive(0, cmsUserCount - 1),
      select: {
        id: true,
        personTypeId: true,
        username: true,
        person: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  const personId = randomUUID();
  const createdUser = await db.$transaction(async (tx) => {
    await tx.person.create({
      data: {
        id: personId,
        personTypeId: PERSON_TYPE_ID,
        email: SEED_CONFIG.fallbackProjectOfficerEmail,
        firstName: SEED_CONFIG.fallbackProjectOfficerFirstName,
        lastName: SEED_CONFIG.fallbackProjectOfficerLastName,
      },
    });
    return await tx.user.create({
      data: {
        id: personId,
        personTypeId: PERSON_TYPE_ID,
        cognitoSubject: randomUUID(),
        username: SEED_CONFIG.fallbackProjectOfficerUsername,
        isMigratedFromPmda: false,
        hasLoggedIn: true,
      },
      select: {
        id: true,
        personTypeId: true,
        username: true,
        person: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  });

  return createdUser;
}

async function ensureProjectOfficerAccess(projectOfficer) {
  await db.$transaction(async (tx) => {
    await tx.systemRoleAssignment.upsert({
      where: {
        personId_roleId: {
          personId: projectOfficer.id,
          roleId: SYSTEM_ROLE_ID,
        },
      },
      update: {},
      create: {
        personId: projectOfficer.id,
        personTypeId: PERSON_TYPE_ID,
        roleId: SYSTEM_ROLE_ID,
        grantLevelId: SYSTEM_GRANT_LEVEL_ID,
      },
    });
    await tx.personState.upsert({
      where: {
        personId_stateId: {
          personId: projectOfficer.id,
          stateId: SEED_CONFIG.stateId,
        },
      },
      update: {},
      create: {
        personId: projectOfficer.id,
        stateId: SEED_CONFIG.stateId,
      },
    });
  });
}

function makeContext(user) {
  return {
    user: {
      id: user.id,
      personTypeId: user.personTypeId,
    },
  };
}

async function setApplicationDates(applicationId, applicationDates) {
  await applicationDateResolvers.Mutation.setApplicationDates(null, {
    input: {
      applicationId,
      applicationDates,
    },
  });
}

async function completePhase(applicationId, phaseName) {
  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: {
      applicationId,
      phaseName,
    },
  });
}

async function wait(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForProcessedDocument(documentId, documentType) {
  const startedAt = Date.now();
  while (true) {
    const document = await db.document.findUnique({ where: { id: documentId } });
    if (document) {
      return document;
    }

    if (Date.now() - startedAt >= SEED_CONFIG.processedUploadTimeoutMs) {
      throw new Error(
        `Timed out waiting for uploaded ${documentType} document ${documentId} to be processed.`
      );
    }
    await wait(SEED_CONFIG.processedUploadPollMs);
  }
}

async function putPdfToPresignedUrl(uploadUrl, documentType, pdfBytes) {
  if (!uploadUrl.startsWith("http://") && !uploadUrl.startsWith("https://")) {
    throw new Error(`Upload URL for ${documentType} is not an HTTP URL: ${uploadUrl}`);
  }

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": "application/pdf" },
    body: pdfBytes,
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `Upload PUT for ${documentType} failed with ${response.status} ${response.statusText}: ` +
        responseBody.slice(0, 500)
    );
  }
}

async function uploadPhaseDocument({
  applicationId,
  phaseName,
  documentType,
  context,
  pdfBytes,
}) {
  const pendingUpload =
    await documentPendingUploadResolvers.Mutation.uploadDocumentToPhase(
      null,
      {
        input: {
          name: `${documentType} - ${basename(SEED_CONFIG.documentPath)}`,
          description: SEED_CONFIG.demoDescription,
          documentType,
          applicationId,
          phaseName,
        },
      },
      context
    );

  const uploadUrl =
    await documentPendingUploadResolvers.DocumentPendingUpload.presignedUploadUrl(pendingUpload);

  if (process.env.LOCAL_SIMPLE_UPLOAD !== "true") {
    await putPdfToPresignedUrl(uploadUrl, documentType, pdfBytes);
  }

  await waitForProcessedDocument(pendingUpload.id, documentType);
  return pendingUpload;
}

async function uploadPhaseDocuments(applicationId, phaseName, documentTypes, context, pdfBytes) {
  for (const documentType of documentTypes) {
    await uploadPhaseDocument({
      applicationId,
      phaseName,
      documentType,
      context,
      pdfBytes,
    });
  }
}

async function callFederalCommentStatusProcedure() {
  await db.$executeRawUnsafe("CALL demos_app.update_federal_comment_phase_status();");
}

async function readUploadPdf() {
  try {
    await access(SEED_CONFIG.documentPath);
    return await readFile(SEED_CONFIG.documentPath);
  } catch (error) {
    throw new Error(
      `Cannot read configured upload PDF at ${SEED_CONFIG.documentPath}: ${toMessage(error)}`
    );
  }
}

async function getFinalDemonstration(demonstrationId) {
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

async function main() {
  const pdfBytes = await step("Reading upload PDF", readUploadPdf);
  const demoWindow = buildDemonstrationWindow();
  const applicationDates = buildApplicationDates(demoWindow.effectiveDate);

  const requiredPhaseDocuments = [
    ...PHASE_DOCUMENTS.flatMap(({ phaseName, documentTypes }) =>
      documentTypes.map((documentType) => ({ phaseName, documentType }))
    ),
    ...APPROVAL_PACKAGE_PHASE_DOCUMENTS.map((documentType) => ({
      phaseName: "Approval Package",
      documentType,
    })),
  ];

  await step("Validating static reference rows", () =>
    requireStaticRows(requiredPhaseDocuments)
  );

  const state = await db.state.findUniqueOrThrow({
    where: { id: SEED_CONFIG.stateId },
    select: { id: true, name: true },
  });
  const demoName = `${state.name} ${SEED_CONFIG.demoNameSuffix}`;

  const projectOfficer = await step("Selecting project officer", getOrCreateProjectOfficer);
  await step("Ensuring project officer access", () =>
    ensureProjectOfficerAccess(projectOfficer)
  );
  const context = makeContext(projectOfficer);

  console.log(`Creating ${demoName}`);
  console.log(
    `Project officer: ${projectOfficer.person.firstName} ${projectOfficer.person.lastName} (${projectOfficer.person.email})`
  );

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
      demonstration.id,
      selectApplicationDates(applicationDates, ["Concept Paper Submitted Date"])
    );
    await uploadPhaseDocuments(
      demonstration.id,
      "Concept",
      ["Pre-Submission"],
      context,
      pdfBytes
    );
    await completePhase(demonstration.id, "Concept");
  });

  await step("Completing Application Intake", async () => {
    await setApplicationDates(
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "State Application Submitted Date",
        "Completeness Review Due Date",
      ])
    );
    await uploadPhaseDocuments(
      demonstration.id,
      "Application Intake",
      ["State Application"],
      context,
      pdfBytes
    );
    await completePhase(demonstration.id, "Application Intake");
  });

  await step("Completing Completeness", async () => {
    await setApplicationDates(
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "State Application Deemed Complete",
        "Federal Comment Period Start Date",
        "Federal Comment Period End Date",
      ])
    );
    await uploadPhaseDocuments(
      demonstration.id,
      "Completeness",
      ["Application Completeness Letter", "Internal Completeness Review Form"],
      context,
      pdfBytes
    );
    await completePhase(demonstration.id, "Completeness");
  });

  await step("Completing Federal Comment via backend status procedure", async () => {
    await callFederalCommentStatusProcedure();
    const federalComment = await db.applicationPhase.findUniqueOrThrow({
      where: {
        applicationId_phaseId: {
          applicationId: demonstration.id,
          phaseId: "Federal Comment",
        },
      },
      select: { phaseStatusId: true },
    });
    if (federalComment.phaseStatusId !== "Completed") {
      throw new Error(
        `Federal Comment ended as ${federalComment.phaseStatusId}; expected Completed.`
      );
    }
  });

  await step("Completing SDG Preparation", async () => {
    await setApplicationDates(
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "Expected Approval Date",
        "SME Initial Review Date",
        "FRT Initial Meeting Date",
        "BNPMT Initial Meeting Date",
      ])
    );
    await completePhase(demonstration.id, "SDG Preparation");
  });

  await step("Completing Review", async () => {
    await setApplicationDates(
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
    await completePhase(demonstration.id, "Review");
  });

  await step("Completing Approval Package", async () => {
    await uploadPhaseDocuments(
      demonstration.id,
      "Approval Package",
      APPROVAL_PACKAGE_PHASE_DOCUMENTS,
      context,
      pdfBytes
    );
    await completePhase(demonstration.id, "Approval Package");
  });

  await step("Completing Approval Summary", async () => {
    await setApplicationDates(
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "Application Details Marked Complete Date",
        "Application Demonstration Types Marked Complete Date",
        "Application Approval Date",
      ])
    );
    await completePhase(demonstration.id, "Approval Summary");
  });

  const finalDemonstration = await step("Loading final demonstration", () =>
    getFinalDemonstration(demonstration.id)
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

try {
  await main();
} finally {
  await db.$disconnect();
}
