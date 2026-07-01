/* global process */

import { randomUUID } from "node:crypto";
import pg from "pg";

const { Client } = pg;

export function createDbClient(fallbackDatabaseUrl) {
  return new Client({
    connectionString: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
  });
}

export async function beginTransaction(client) {
  await client.query("begin");
}

export async function commitTransaction(client) {
  await client.query("commit");
}

export async function rollbackTransaction(client) {
  await client.query("rollback");
}

export async function requireIds(client, tableName, ids) {
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

export async function requireRole(client, roleId, grantLevelId) {
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

export async function requireRolePersonType(client, roleId, personTypeId) {
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

export async function requirePhaseStatusPairs(client, phases) {
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
    [phases]
  );

  if (result.rows.length) {
    const missingPhases = result.rows.map((row) => row.id);
    throw new Error(
      `Missing required phase/status pairs for Completed phases: ${missingPhases.join(", ")}.`
    );
  }
}

export async function requirePhaseDocumentTypes(client, requiredPhaseDocuments) {
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
      requiredPhaseDocuments.map((document) => document.phaseId),
      requiredPhaseDocuments.map((document) => document.documentTypeId),
    ]
  );

  if (result.rows.length) {
    const missingPairs = result.rows.map((row) => `${row.phase_id}/${row.document_type_id}`);
    throw new Error(`Missing required phase_document_type rows: ${missingPairs.join(", ")}.`);
  }
}

export async function getSeedState(client, stateId) {
  const result = await client.query(
    `
      select id, name
      from demos_app.state
      where id = $1
    `,
    [stateId]
  );

  if (result.rows.length !== 1) {
    throw new Error(`Expected one state with id ${stateId}, found ${result.rows.length}.`);
  }

  return result.rows[0];
}

export async function getOrCreateProjectOfficer(
  client,
  {
    personTypeId,
    fallbackProjectOfficerEmail,
    fallbackProjectOfficerFirstName,
    fallbackProjectOfficerLastName,
    fallbackProjectOfficerUsername,
    createdAt,
    updatedAt,
  }
) {
  const existingCmsUser = await client.query(
    `
      select users.id, users.person_type_id
      from demos_app.users
      where users.person_type_id = $1
      order by random()
      limit 1
    `,
    [personTypeId]
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
        $6,
        $7
      )
    `,
    [
      personId,
      personTypeId,
      fallbackProjectOfficerEmail,
      fallbackProjectOfficerFirstName,
      fallbackProjectOfficerLastName,
      createdAt,
      updatedAt,
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
        $5,
        $6
      )
    `,
    [personId, personTypeId, cognitoSubject, fallbackProjectOfficerUsername, createdAt, updatedAt]
  );

  return { id: personId, personTypeId };
}

export async function ensureProjectOfficerAccess(
  client,
  { projectOfficer, systemRoleId, systemGrantLevelId, stateId }
) {
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
    [projectOfficer.id, systemRoleId, projectOfficer.personTypeId, systemGrantLevelId]
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
    [projectOfficer.id, stateId]
  );
}

export async function createDemonstration(
  client,
  {
    projectOfficer,
    demonstrationWindow,
    demoName,
    applicationTypeId,
    demoDescription,
    sdgDivisionId,
    signatureLevelId,
    initialStatusId,
    stateId,
    clearanceLevelId,
    projectOfficerRoleId,
    demonstrationGrantLevelId,
    createdAt,
    updatedAt,
    statusUpdatedAt,
  }
) {
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
    [demonstrationId, applicationTypeId]
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
        $10,
        'Concept',
        $11,
        $12,
        $13,
        $14
      )
    `,
    [
      demonstrationId,
      applicationTypeId,
      demoName,
      demoDescription,
      demonstrationWindow.effectiveDate,
      demonstrationWindow.expirationDate,
      sdgDivisionId,
      signatureLevelId,
      initialStatusId,
      statusUpdatedAt,
      stateId,
      clearanceLevelId,
      createdAt,
      updatedAt,
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
      projectOfficerRoleId,
      stateId,
      projectOfficer.personTypeId,
      demonstrationGrantLevelId,
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
    [projectOfficer.id, demonstrationId, projectOfficerRoleId]
  );

  return demonstrationId;
}

export async function applyDemonstrationType(
  client,
  {
    demonstrationId,
    demonstrationWindow,
    demonstrationType,
    tagTypeApplication,
    tagTypeDemonstrationType,
    tagSourceId,
    tagStatusId,
    createdAt,
    updatedAt,
  }
) {
  await client.query(
    `
      insert into demos_app.tag_name (
        id,
        created_at,
        updated_at
      ) values (
        $1,
        $2,
        $3
      )
      on conflict do nothing
    `,
    [demonstrationType, createdAt, updatedAt]
  );

  for (const tagTypeId of [tagTypeApplication, tagTypeDemonstrationType]) {
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
          $5,
          $6
        )
        on conflict do nothing
      `,
      [demonstrationType, tagTypeId, tagSourceId, tagStatusId, createdAt, updatedAt]
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
        $6,
        $7
      )
    `,
    [
      demonstrationId,
      demonstrationType,
      tagTypeDemonstrationType,
      demonstrationWindow.effectiveDate,
      demonstrationWindow.expirationDate,
      createdAt,
      updatedAt,
    ]
  );
}

export async function seedApplicationDates(client, demonstrationId, applicationDates) {
  for (const { dateTypeId, dateValue } of applicationDates) {
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
          $4,
          $5
        )
        on conflict (application_id, date_type_id)
        do update set
          date_value = excluded.date_value,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `,
      [demonstrationId, dateTypeId, dateValue, dateValue, dateValue]
    );
  }
}

export async function insertSeededDocument(
  client,
  {
    documentId,
    documentName,
    description,
    s3Path,
    ownerUserId,
    documentTypeId,
    applicationId,
    phaseId,
    createdAt,
    updatedAt,
  }
) {
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
        $9,
        $10
      )
    `,
    [
      documentId,
      documentName,
      description,
      s3Path,
      ownerUserId,
      documentTypeId,
      applicationId,
      phaseId,
      createdAt,
      updatedAt,
    ]
  );
}

export async function completeApplicationPhases(client, demonstrationId, phaseAuditDates) {
  for (const [phase, auditDates] of Object.entries(phaseAuditDates)) {
    const result = await client.query(
      `
        update demos_app.application_phase
        set
          phase_status_id = 'Completed',
          created_at = $3,
          updated_at = $4
        where application_id = $1
        and phase_id = $2
      `,
      [demonstrationId, phase, auditDates.createdAt, auditDates.updatedAt]
    );

    if (result.rowCount !== 1) {
      throw new Error(
        `Expected one application_phase row for demonstration ${demonstrationId} and ` +
          `phase ${phase}, updated ${result.rowCount}.`
      );
    }
  }
}

export async function setSeededDemonstrationAuditDates(
  client,
  demonstrationId,
  { createdAt, updatedAt, statusUpdatedAt }
) {
  const result = await client.query(
    `
      update demos_app.demonstration
      set
        created_at = $2,
        updated_at = $3,
        status_updated_at = $4
      where id = $1
    `,
    [demonstrationId, createdAt, updatedAt, statusUpdatedAt]
  );

  if (result.rowCount !== 1) {
    throw new Error(
      `Expected one demonstration row to update audit timestamps for ${demonstrationId}, ` +
        `updated ${result.rowCount}.`
    );
  }
}

export async function getSeededDemonstration(client, demonstrationId, projectOfficerRoleId) {
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
    [demonstrationId, projectOfficerRoleId]
  );

  if (result.rows.length !== 1) {
    throw new Error(
      `Expected one seeded demonstration with id ${demonstrationId}, found ${result.rows.length}.`
    );
  }

  return result.rows[0];
}
