/* global console, process, URL */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import pg from "pg";

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

const { Client } = pg;

function getConnectionString() {
  return process.env.DATABASE_URL ?? SEED_CONFIG.fallbackDatabaseUrl;
}

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

async function requireIds(client, tableName, ids) {
  const result = await client.query(
    `
      select id
      from demos_app.${tableName}
      where id = any($1::text[])
    `,
    [ids]
  );

  const foundIds = new Set(result.rows.map((row) => row.id));
  const missingIds = ids.filter((id) => !foundIds.has(id));
  if (missingIds.length) {
    throw new Error(`Missing required ${tableName} rows: ${missingIds.join(", ")}.`);
  }
}

async function requireRole(client, roleId, grantLevelId) {
  const result = await client.query(
    `
      select 1
      from demos_app.role
      where id = $1
      and grant_level_id = $2
    `,
    [roleId, grantLevelId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Missing required role ${roleId} with grant level ${grantLevelId}.`);
  }
}

async function requireRolePersonType(client, roleId, personTypeId) {
  const result = await client.query(
    `
      select 1
      from demos_app.role_person_type
      where role_id = $1
      and person_type_id = $2
    `,
    [roleId, personTypeId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Role ${roleId} is not available for person type ${personTypeId}.`);
  }
}

async function requirePhaseStatusPairs(client) {
  const result = await client.query(
    `
      select required_phase.id
      from unnest($1::text[]) as required_phase(id)
      where not exists (
        select 1
        from demos_app.phase_phase_status
        where phase_id = required_phase.id
        and phase_status_id = 'Completed'
      )
    `,
    [PHASES]
  );

  if (result.rows.length) {
    const missingPhases = result.rows.map((row) => row.id);
    throw new Error(
      `Missing required phase/status pairs for Completed phases: ${missingPhases.join(", ")}.`
    );
  }
}

async function requirePhaseDocumentTypes(client) {
  const result = await client.query(
    `
      select required_document.phase_id, required_document.document_type_id
      from unnest($1::text[], $2::text[]) as required_document(phase_id, document_type_id)
      where not exists (
        select 1
        from demos_app.phase_document_type
        where phase_id = required_document.phase_id
        and document_type_id = required_document.document_type_id
      )
    `,
    [
      REQUIRED_PHASE_DOCUMENTS.map((document) => document.phaseId),
      REQUIRED_PHASE_DOCUMENTS.map((document) => document.documentTypeId),
    ]
  );

  if (result.rows.length) {
    const missingPairs = result.rows.map((row) => `${row.phase_id}/${row.document_type_id}`);
    throw new Error(`Missing required phase_document_type rows: ${missingPairs.join(", ")}.`);
  }
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
  await requirePhaseStatusPairs(client);
  await requirePhaseDocumentTypes(client);
}

async function getSeedState(client) {
  const result = await client.query(
    `
      select id, name
      from demos_app.state
      where id = $1
    `,
    [SEED_CONFIG.stateId]
  );

  if (result.rows.length !== 1) {
    throw new Error(`Expected one state with id ${SEED_CONFIG.stateId}, found ${result.rows.length}.`);
  }

  return result.rows[0];
}

async function getOrCreateProjectOfficer(client) {
  const existingCmsUser = await client.query(
    `
      select users.id, users.person_type_id
      from demos_app.users
      where users.person_type_id = $1
      order by random()
      limit 1
    `,
    [PERSON_TYPE_ID]
  );

  if (existingCmsUser.rows.length === 1) {
    const user = existingCmsUser.rows[0];
    return { id: user.id, personTypeId: user.person_type_id };
  }

  const personId = randomUUID();
  const cognitoSubject = randomUUID();

  await client.query(
    `
      insert into demos_app.person (
        id,
        person_type_id,
        email,
        first_name,
        last_name,
        created_at,
        updated_at
      ) values (
        $1,
        $2,
        $3,
        $4,
        $5,
        current_timestamp,
        current_timestamp
      )
    `,
    [
      personId,
      PERSON_TYPE_ID,
      SEED_CONFIG.fallbackProjectOfficerEmail,
      SEED_CONFIG.fallbackProjectOfficerFirstName,
      SEED_CONFIG.fallbackProjectOfficerLastName,
    ]
  );

  await client.query(
    `
      insert into demos_app.users (
        id,
        person_type_id,
        cognito_subject,
        username,
        is_migrated_from_pmda,
        has_logged_in,
        created_at,
        updated_at
      ) values (
        $1,
        $2,
        $3,
        $4,
        false,
        true,
        current_timestamp,
        current_timestamp
      )
    `,
    [personId, PERSON_TYPE_ID, cognitoSubject, SEED_CONFIG.fallbackProjectOfficerUsername]
  );

  return { id: personId, personTypeId: PERSON_TYPE_ID };
}

async function ensureProjectOfficerAccess(client, projectOfficer) {
  await client.query(
    `
      insert into demos_app.system_role_assignment (
        person_id,
        role_id,
        person_type_id,
        grant_level_id
      ) values (
        $1,
        $2,
        $3,
        $4
      )
      on conflict do nothing
    `,
    [projectOfficer.id, SYSTEM_ROLE_ID, projectOfficer.personTypeId, SYSTEM_GRANT_LEVEL_ID]
  );

  await client.query(
    `
      insert into demos_app.person_state (
        person_id,
        state_id
      ) values (
        $1,
        $2
      )
      on conflict do nothing
    `,
    [projectOfficer.id, SEED_CONFIG.stateId]
  );
}

async function createDemonstration(client, projectOfficer, demonstrationWindow, demoName) {
  const demonstrationId = randomUUID();

  await client.query(
    `
      insert into demos_app.application (
        id,
        application_type_id
      ) values (
        $1,
        $2
      )
    `,
    [demonstrationId, APPLICATION_TYPE_ID]
  );

  await client.query(
    `
      insert into demos_app.demonstration (
        id,
        application_type_id,
        name,
        description,
        effective_date,
        expiration_date,
        sdg_division_id,
        signature_level_id,
        status_id,
        status_updated_at,
        current_phase_id,
        state_id,
        clearance_level_id,
        created_at,
        updated_at
      ) values (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        current_timestamp,
        'Concept',
        $10,
        $11,
        current_timestamp,
        current_timestamp
      )
    `,
    [
      demonstrationId,
      APPLICATION_TYPE_ID,
      demoName,
      SEED_CONFIG.demoDescription,
      demonstrationWindow.effectiveDate,
      demonstrationWindow.expirationDate,
      SEED_CONFIG.sdgDivisionId,
      SIGNATURE_LEVEL_ID,
      INITIAL_STATUS_ID,
      SEED_CONFIG.stateId,
      CLEARANCE_LEVEL_ID,
    ]
  );

  await client.query(
    `
      insert into demos_app.demonstration_role_assignment (
        person_id,
        demonstration_id,
        role_id,
        state_id,
        person_type_id,
        grant_level_id
      ) values (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
    `,
    [
      projectOfficer.id,
      demonstrationId,
      PROJECT_OFFICER_ROLE_ID,
      SEED_CONFIG.stateId,
      projectOfficer.personTypeId,
      DEMONSTRATION_GRANT_LEVEL_ID,
    ]
  );

  await client.query(
    `
      insert into demos_app.primary_demonstration_role_assignment (
        person_id,
        demonstration_id,
        role_id
      ) values (
        $1,
        $2,
        $3
      )
    `,
    [projectOfficer.id, demonstrationId, PROJECT_OFFICER_ROLE_ID]
  );

  return demonstrationId;
}

async function applyDemonstrationType(client, demonstrationId, demonstrationWindow) {
  await client.query(
    `
      insert into demos_app.tag_name (
        id,
        created_at,
        updated_at
      ) values (
        $1,
        current_timestamp,
        current_timestamp
      )
      on conflict do nothing
    `,
    [SEED_CONFIG.demonstrationType]
  );

  for (const tagTypeId of [TAG_TYPE_APPLICATION, TAG_TYPE_DEMONSTRATION_TYPE]) {
    await client.query(
      `
        insert into demos_app.tag (
          tag_name_id,
          tag_type_id,
          source_id,
          status_id,
          created_at,
          updated_at
        ) values (
          $1,
          $2,
          $3,
          $4,
          current_timestamp,
          current_timestamp
        )
        on conflict do nothing
      `,
      [SEED_CONFIG.demonstrationType, tagTypeId, TAG_SOURCE_ID, TAG_STATUS_ID]
    );
  }

  await client.query(
    `
      insert into demos_app.demonstration_type_tag_assignment (
        demonstration_id,
        tag_name_id,
        tag_type_id,
        effective_date,
        expiration_date,
        created_at,
        updated_at
      ) values (
        $1,
        $2,
        $3,
        $4,
        $5,
        current_timestamp,
        current_timestamp
      )
    `,
    [
      demonstrationId,
      SEED_CONFIG.demonstrationType,
      TAG_TYPE_DEMONSTRATION_TYPE,
      demonstrationWindow.effectiveDate,
      demonstrationWindow.expirationDate,
    ]
  );
}

async function seedApplicationDates(client, demonstrationId, demonstrationWindow) {
  for (const { dateTypeId, dateValue } of buildApplicationDates(demonstrationWindow.effectiveDate)) {
    await client.query(
      `
        insert into demos_app.application_date (
          application_id,
          date_type_id,
          date_value,
          created_at,
          updated_at
        ) values (
          $1,
          $2,
          $3,
          current_timestamp,
          current_timestamp
        )
        on conflict (application_id, date_type_id)
        do update set
          date_value = excluded.date_value,
          updated_at = current_timestamp
      `,
      [demonstrationId, dateTypeId, dateValue]
    );
  }
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

    await client.query(
      `
        insert into demos_app.document (
          id,
          name,
          description,
          s3_path,
          owner_user_id,
          document_type_id,
          application_id,
          phase_id,
          created_at,
          updated_at
        ) values (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          current_timestamp,
          current_timestamp
        )
      `,
      [
        documentId,
        documentName,
        `Seeded ${documentToUpload.documentTypeId} document for ${demoName}.`,
        s3Path,
        ownerUserId,
        documentToUpload.documentTypeId,
        demonstrationId,
        documentToUpload.phaseId,
      ]
    );

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

async function completeApplicationPhases(client, demonstrationId) {
  for (const phase of PHASES) {
    const result = await client.query(
      `
        update demos_app.application_phase
        set
          phase_status_id = 'Completed',
          updated_at = current_timestamp
        where application_id = $1
        and phase_id = $2
      `,
      [demonstrationId, phase]
    );

    if (result.rowCount !== 1) {
      throw new Error(
        `Expected one application_phase row for demonstration ${demonstrationId} and phase ${phase}, updated ${result.rowCount}.`
      );
    }
  }
}

async function getSeededDemonstration(client, demonstrationId) {
  const result = await client.query(
    `
      select
        demonstration.id,
        demonstration.name,
        demonstration.effective_date,
        demonstration.expiration_date,
        demonstration.state_id,
        demonstration.status_id,
        demonstration.current_phase_id,
        demonstration_type_tag_assignment.tag_name_id as demonstration_type,
        primary_demonstration_role_assignment.person_id as project_officer_id,
        count(document.id)::int as document_count
      from demos_app.demonstration
      left join demos_app.demonstration_type_tag_assignment
        on demonstration_type_tag_assignment.demonstration_id = demonstration.id
      left join demos_app.primary_demonstration_role_assignment
        on primary_demonstration_role_assignment.demonstration_id = demonstration.id
        and primary_demonstration_role_assignment.role_id = $2
      left join demos_app.document
        on document.application_id = demonstration.id
      where demonstration.id = $1
      group by
        demonstration.id,
        demonstration.name,
        demonstration.effective_date,
        demonstration.expiration_date,
        demonstration.state_id,
        demonstration.status_id,
        demonstration.current_phase_id,
        demonstration_type_tag_assignment.tag_name_id,
        primary_demonstration_role_assignment.person_id
    `,
    [demonstrationId, PROJECT_OFFICER_ROLE_ID]
  );

  if (result.rows.length !== 1) {
    throw new Error(
      `Expected one seeded demonstration with id ${demonstrationId}, found ${result.rows.length}.`
    );
  }

  return result.rows[0];
}

async function createApprovedDemo() {
  const client = new Client({ connectionString: getConnectionString() });
  const cleanBucket = getCleanBucket();
  const s3Client = createS3Client();
  let connected = false;
  let caughtError;
  let endError;
  let seededDemonstration;

  try {
    await client.connect();
    connected = true;
    await client.query("begin");

    await validateStaticRows(client);
    const seedState = await getSeedState(client);
    const demoName = buildDemoName(seedState.name);
    const projectOfficer = await getOrCreateProjectOfficer(client);
    await ensureProjectOfficerAccess(client, projectOfficer);
    const demonstrationWindow = buildDemonstrationWindow();

    const demonstrationId = await createDemonstration(
      client,
      projectOfficer,
      demonstrationWindow,
      demoName
    );
    await applyDemonstrationType(client, demonstrationId, demonstrationWindow);
    await seedApplicationDates(client, demonstrationId, demonstrationWindow);
    await createAndUploadRequiredDocuments({
      client,
      s3Client,
      cleanBucket,
      demonstrationId,
      ownerUserId: projectOfficer.id,
      demoName,
    });
    await completeApplicationPhases(client, demonstrationId);

    const demonstration = await getSeededDemonstration(client, demonstrationId);
    if (demonstration.status_id !== EXPECTED_FINAL_STATUS_ID) {
      throw new Error(
        `Expected demonstration ${demonstrationId} to be ${EXPECTED_FINAL_STATUS_ID}, found ${demonstration.status_id}.`
      );
    }

    await client.query("commit");
    seededDemonstration = demonstration;
  } catch (error) {
    caughtError = error;
    if (connected) {
      try {
        await client.query("rollback");
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
    console.log(`  url: /demonstrations/${demonstration.id}`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
