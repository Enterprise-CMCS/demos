/* global console, process, URL */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import {
  applyDemonstrationType,
  beginTransaction,
  commitTransaction,
  completeApplicationPhases,
  createDbClient,
  createDemonstration,
  ensureProjectOfficerAccess,
  getOrCreateProjectOfficer,
  getSeedState,
  getSeededDemonstration,
  insertSeededDocument,
  requireIds,
  requirePhaseDocumentTypes,
  requirePhaseStatusPairs,
  requireRole,
  requireRolePersonType,
  rollbackTransaction,
  seedApplicationDates,
} from "./db.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

// This runs with plain node, so keep these local instead of importing TypeScript constants.
const SEED_CONFIG = {
  fallbackDatabaseUrl: "postgresql://localhost:5432/demos?schema=demos_app",
  demoNameSuffix: "Generated Approved Demonstration",
  demoDescription: "Approved demonstration created by createApprovedDemo.",
  stateId: "MD",
  sdgDivisionId: "Division of System Reform Demonstrations",
  demonstrationType: "Serious Mental Illness (SMI)",
  effectiveDateLookbackMonths: 6,
  demoWindowYears: 5,
  fallbackProjectOfficerUsername: "approved_demo_project_officer",
  fallbackProjectOfficerEmail: "approved_demo_project_officer@example.com",
  fallbackProjectOfficerFirstName: "Approved Demo",
  fallbackProjectOfficerLastName: "Project Officer",
};

const APPLICATION_TYPE_ID = "Demonstration";
const CLEARANCE_LEVEL_ID = "CMS (OSORA)";
const DEMONSTRATION_GRANT_LEVEL_ID = "Demonstration";
const INITIAL_STATUS_ID = "Pre-Submission";
const EXPECTED_FINAL_STATUS_ID = "Approved";
const PERSON_TYPE_ID = "demos-cms-user";
const PROJECT_OFFICER_ROLE_ID = "Project Officer";
const SIGNATURE_LEVEL_ID = "OA";
const SYSTEM_GRANT_LEVEL_ID = "System";
const SYSTEM_ROLE_ID = "CMS User";
const TAG_SOURCE_ID = "System";
const TAG_STATUS_ID = "Approved";
const TAG_TYPE_APPLICATION = "Application";
const TAG_TYPE_DEMONSTRATION_TYPE = "Demonstration Type";

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

const REQUIRED_PHASE_DOCUMENTS = [
  { phaseId: "Concept", documentTypeId: "Pre-Submission" },
  { phaseId: "Application Intake", documentTypeId: "State Application" },
  { phaseId: "Completeness", documentTypeId: "Application Completeness Letter" },
  { phaseId: "Completeness", documentTypeId: "Internal Completeness Review Form" },
  { phaseId: "Approval Package", documentTypeId: "Approval Letter" },
  { phaseId: "Approval Package", documentTypeId: "Final Budget Neutrality Formulation Workbook" },
  { phaseId: "Approval Package", documentTypeId: "Formal OMB Policy Concurrence Email" },
  { phaseId: "Approval Package", documentTypeId: "Special Terms & Conditions" },
  { phaseId: "Approval Package", documentTypeId: "Q&A" },
  { phaseId: "Approval Package", documentTypeId: "Signed Decision Memo" },
];

const APPLICATION_DATE_OFFSETS_FROM_EFFECTIVE_DATE = [
  ["Concept Start Date", 100],
  ["Concept Completion Date", 98],
  ["Application Intake Start Date", 98],
  ["State Application Submitted Date", 96],
  ["Completeness Review Due Date", 81, true],
  ["Application Intake Completion Date", 95],
  ["Completeness Start Date", 95],
  ["State Application Deemed Complete", 86],
  ["Federal Comment Period Start Date", 85],
  ["Federal Comment Period End Date", 55, true],
  ["Completeness Completion Date", 85],
  ["SDG Preparation Start Date", 85],
  ["Expected Approval Date", 80],
  ["SME Initial Review Date", 79],
  ["FRT Initial Meeting Date", 78],
  ["BNPMT Initial Meeting Date", 77],
  ["SDG Preparation Completion Date", 76],
  ["Review Start Date", 76],
  ["OGD Approval to Share with SMEs", 75],
  ["Draft Approval Package to Prep", 74],
  ["DDME Approval Received", 73],
  ["State Concurrence", 72],
  ["BN PMT Approval to Send to OMB", 71],
  ["Draft Approval Package Shared", 70],
  ["Receive OMB Concurrence", 69],
  ["Receive OGC Legal Clearance", 68],
  ["Submit Approval Package to OSORA", 67],
  ["OSORA R1 Comments Due", 66, true],
  ["OSORA R2 Comments Due", 65, true],
  ["CMS (OSORA) Clearance End", 64, true],
  ["Review Completion Date", 63],
  ["Approval Package Start Date", 63],
  ["Approval Package Completion Date", 62],
  ["Approval Summary Start Date", 62],
  ["Application Details Marked Complete Date", 61],
  ["Application Demonstration Types Marked Complete Date", 61],
  ["Application Approval Date", 60],
  ["Approval Summary Completion Date", 60],
];

function getCleanBucket() {
  if (!process.env.CLEAN_BUCKET) {
    throw new Error("CLEAN_BUCKET environment variable is required to upload seeded documents.");
  }
  return process.env.CLEAN_BUCKET;
}

function createS3Client() {
  if (!process.env.S3_ENDPOINT_LOCAL) {
    return new S3Client({});
  }

  return new S3Client({
    region: "us-east-1",
    endpoint: process.env.S3_ENDPOINT_LOCAL,
    forcePathStyle: true,
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test", // pragma: allowlist secret
    },
  });
}

function setUtcDayBoundary(date, endOfDay = false) {
  const boundedDate = new Date(date);
  boundedDate.setUTCHours(
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
  return boundedDate;
}

function addUtcYears(date, years, endOfDay = false) {
  const newDate = new Date(date);
  newDate.setUTCFullYear(newDate.getUTCFullYear() + years);
  return setUtcDayBoundary(newDate, endOfDay);
}

function buildDateBefore(baseDate, daysBeforeBaseDate, endOfDay = false) {
  const date = new Date(baseDate);
  date.setUTCDate(date.getUTCDate() - daysBeforeBaseDate);
  return setUtcDayBoundary(date, endOfDay);
}

function buildDemonstrationWindow() {
  const latestEffectiveDate = setUtcDayBoundary(new Date());
  const earliestEffectiveDate = new Date(latestEffectiveDate);
  earliestEffectiveDate.setUTCMonth(
    earliestEffectiveDate.getUTCMonth() - SEED_CONFIG.effectiveDateLookbackMonths
  );

  const effectiveTime =
    earliestEffectiveDate.getTime() +
    Math.floor(Math.random() * (latestEffectiveDate.getTime() - earliestEffectiveDate.getTime()));
  const effectiveDate = setUtcDayBoundary(new Date(effectiveTime));

  return {
    effectiveDate,
    expirationDate: addUtcYears(effectiveDate, SEED_CONFIG.demoWindowYears, true),
  };
}

function buildApplicationDates(effectiveDate) {
  return APPLICATION_DATE_OFFSETS_FROM_EFFECTIVE_DATE.map(
    ([dateTypeId, daysBeforeApproval, endOfDay]) => ({
      dateTypeId,
      dateValue: buildDateBefore(effectiveDate, daysBeforeApproval, endOfDay),
    })
  );
}

function buildDemoName(stateName) {
  return `${stateName} ${SEED_CONFIG.demoNameSuffix}`;
}

async function validateStaticRows(client) {
  await requireIds(client, "application_type", [APPLICATION_TYPE_ID]);
  await requireIds(client, "application_status", [INITIAL_STATUS_ID, EXPECTED_FINAL_STATUS_ID]);
  await requireIds(client, "clearance_level", [CLEARANCE_LEVEL_ID]);
  await requireIds(
    client,
    "date_type",
    APPLICATION_DATE_OFFSETS_FROM_EFFECTIVE_DATE.map(([dateTypeId]) => dateTypeId)
  );
  await requireIds(client, "demonstration_application_type_limit", [APPLICATION_TYPE_ID]);
  await requireIds(client, "demonstration_grant_level_limit", [DEMONSTRATION_GRANT_LEVEL_ID]);
  await requireIds(client, "demonstration_type_tag_type_limit", [TAG_TYPE_DEMONSTRATION_TYPE]);
  await requireIds(
    client,
    "document_type",
    REQUIRED_PHASE_DOCUMENTS.map((document) => document.documentTypeId)
  );
  await requireIds(client, "grant_level", [SYSTEM_GRANT_LEVEL_ID, DEMONSTRATION_GRANT_LEVEL_ID]);
  await requireIds(client, "person_type", [PERSON_TYPE_ID]);
  await requireIds(client, "phase", PHASES);
  await requireIds(client, "sdg_division", [SEED_CONFIG.sdgDivisionId]);
  await requireIds(client, "signature_level", [SIGNATURE_LEVEL_ID]);
  await requireIds(client, "state", [SEED_CONFIG.stateId]);
  await requireIds(client, "system_grant_level_limit", [SYSTEM_GRANT_LEVEL_ID]);
  await requireIds(client, "tag_source", [TAG_SOURCE_ID]);
  await requireIds(client, "tag_status", [TAG_STATUS_ID]);
  await requireIds(client, "tag_type", [TAG_TYPE_APPLICATION, TAG_TYPE_DEMONSTRATION_TYPE]);
  await requireIds(client, "user_person_type_limit", [PERSON_TYPE_ID]);
  await requireRole(client, PROJECT_OFFICER_ROLE_ID, DEMONSTRATION_GRANT_LEVEL_ID);
  await requireRole(client, SYSTEM_ROLE_ID, SYSTEM_GRANT_LEVEL_ID);
  await requireRolePersonType(client, PROJECT_OFFICER_ROLE_ID, PERSON_TYPE_ID);
  await requireRolePersonType(client, SYSTEM_ROLE_ID, PERSON_TYPE_ID);
  await requirePhaseStatusPairs(client, PHASES);
  await requirePhaseDocumentTypes(client, REQUIRED_PHASE_DOCUMENTS);
}

async function createAndUploadRequiredDocuments({
  client,
  s3Client,
  cleanBucket,
  demonstrationId,
  ownerUserId,
  demoName,
}) {
  for (const documentToUpload of REQUIRED_PHASE_DOCUMENTS) {
    const documentId = randomUUID();
    const s3Path = `${demonstrationId}/${documentId}`;
    const documentName = `${documentToUpload.documentTypeId} Seed File`;

    await insertSeededDocument(client, {
      documentId,
      documentName,
      description: `Seeded ${documentToUpload.documentTypeId} document for ${demoName}.`,
      s3Path,
      ownerUserId,
      documentTypeId: documentToUpload.documentTypeId,
      applicationId: demonstrationId,
      phaseId: documentToUpload.phaseId,
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: cleanBucket,
        Key: s3Path,
        Body: Buffer.from(
          [
            `Seeded document: ${documentName}`,
            `Demonstration ID: ${demonstrationId}`,
            `Phase: ${documentToUpload.phaseId}`,
            `Document Type: ${documentToUpload.documentTypeId}`,
          ].join("\n")
        ),
        ContentType: "text/plain",
      })
    );
  }
}

async function createApprovedDemo() {
  const client = createDbClient(SEED_CONFIG.fallbackDatabaseUrl);
  const cleanBucket = getCleanBucket();
  const s3Client = createS3Client();
  let connected = false;
  let caughtError;
  let endError;
  let seededDemonstration;

  try {
    await client.connect();
    connected = true;
    await beginTransaction(client);

    await validateStaticRows(client);
    const seedState = await getSeedState(client, SEED_CONFIG.stateId);
    const demoName = buildDemoName(seedState.name);
    const projectOfficer = await getOrCreateProjectOfficer(client, {
      personTypeId: PERSON_TYPE_ID,
      fallbackProjectOfficerEmail: SEED_CONFIG.fallbackProjectOfficerEmail,
      fallbackProjectOfficerFirstName: SEED_CONFIG.fallbackProjectOfficerFirstName,
      fallbackProjectOfficerLastName: SEED_CONFIG.fallbackProjectOfficerLastName,
      fallbackProjectOfficerUsername: SEED_CONFIG.fallbackProjectOfficerUsername,
    });
    await ensureProjectOfficerAccess(client, {
      projectOfficer,
      systemRoleId: SYSTEM_ROLE_ID,
      systemGrantLevelId: SYSTEM_GRANT_LEVEL_ID,
      stateId: SEED_CONFIG.stateId,
    });
    const demonstrationWindow = buildDemonstrationWindow();

    const demonstrationId = await createDemonstration(client, {
      projectOfficer,
      demonstrationWindow,
      demoName,
      applicationTypeId: APPLICATION_TYPE_ID,
      demoDescription: SEED_CONFIG.demoDescription,
      sdgDivisionId: SEED_CONFIG.sdgDivisionId,
      signatureLevelId: SIGNATURE_LEVEL_ID,
      initialStatusId: INITIAL_STATUS_ID,
      stateId: SEED_CONFIG.stateId,
      clearanceLevelId: CLEARANCE_LEVEL_ID,
      projectOfficerRoleId: PROJECT_OFFICER_ROLE_ID,
      demonstrationGrantLevelId: DEMONSTRATION_GRANT_LEVEL_ID,
    });
    await applyDemonstrationType(client, {
      demonstrationId,
      demonstrationWindow,
      demonstrationType: SEED_CONFIG.demonstrationType,
      tagTypeApplication: TAG_TYPE_APPLICATION,
      tagTypeDemonstrationType: TAG_TYPE_DEMONSTRATION_TYPE,
      tagSourceId: TAG_SOURCE_ID,
      tagStatusId: TAG_STATUS_ID,
    });
    await seedApplicationDates(
      client,
      demonstrationId,
      buildApplicationDates(demonstrationWindow.effectiveDate)
    );
    await createAndUploadRequiredDocuments({
      client,
      s3Client,
      cleanBucket,
      demonstrationId,
      ownerUserId: projectOfficer.id,
      demoName,
    });
    await completeApplicationPhases(client, demonstrationId, PHASES);

    const demonstration = await getSeededDemonstration(
      client,
      demonstrationId,
      PROJECT_OFFICER_ROLE_ID
    );
    if (demonstration.status_id !== EXPECTED_FINAL_STATUS_ID) {
      throw new Error(
        `Expected demonstration ${demonstrationId} to be ${EXPECTED_FINAL_STATUS_ID}, ` +
          `found ${demonstration.status_id}.`
      );
    }

    await commitTransaction(client);
    seededDemonstration = demonstration;
  } catch (error) {
    caughtError = error;
    if (connected) {
      try {
        await rollbackTransaction(client);
      } catch {
        // Preserve the original error.
      }
    }
    throw error;
  } finally {
    try {
      await client.end();
    } catch (error) {
      endError = error;
    }
  }

  if (caughtError) {
    throw caughtError;
  }
  if (endError) {
    throw endError;
  }
  return seededDemonstration;
}

createApprovedDemo()
  .then((demonstration) => {
    console.log("Created approved demonstration:");
    console.log(`  id: ${demonstration.id}`);
    console.log(`  name: ${demonstration.name}`);
    console.log(`  state: ${demonstration.state_id}`);
    console.log(`  effectiveDate: ${demonstration.effective_date.toISOString()}`);
    console.log(`  expirationDate: ${demonstration.expiration_date.toISOString()}`);
    console.log(`  status: ${demonstration.status_id}`);
    console.log(`  currentPhase: ${demonstration.current_phase_id}`);
    console.log(`  demonstrationType: ${demonstration.demonstration_type}`);
    console.log(`  projectOfficerId: ${demonstration.project_officer_id}`);
    console.log(`  uploadedDocuments: ${demonstration.document_count}`);
    console.log(`  http://localhost:3000/demonstrations/${demonstration.id}`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
