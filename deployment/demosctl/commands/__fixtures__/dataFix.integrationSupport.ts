import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { escapeLiteral, type Client, type ClientConfig } from "pg";

const SETUP_COMMAND = "From 03-runner, run `cd server && npm run migrate:deploy`.";

const OWNED_TABLES = [
  "application",
  "application_date",
  "application_phase",
  "demonstration",
  "demonstration_role_assignment",
  "person",
  "person_state",
  "primary_demonstration_role_assignment",
];

const HISTORY_TABLES = [
  "application_date_history",
  "application_history",
  "application_phase_history",
  "demonstration_history",
  "demonstration_role_assignment_history",
  "person_history",
  "person_state_history",
  "primary_demonstration_role_assignment_history",
];

const REQUIRED_TABLES = [
  ...OWNED_TABLES,
  ...HISTORY_TABLES,
  "_prisma_migrations",
  "application_status",
  "application_type",
  "data_fix_log",
  "date_type",
  "demonstration_application_type_limit",
  "demonstration_grant_level_limit",
  "grant_level",
  "phase",
  "phase_phase_status",
  "person_type",
  "role",
  "role_person_type",
  "signature_level",
  "state",
];

const HISTORY_TRIGGERS = [
  ["application", "log_changes_application"],
  ["application_date", "log_changes_application_date"],
  ["application_phase", "log_changes_application_phase"],
  ["demonstration", "log_changes_demonstration"],
  ["demonstration_role_assignment", "log_changes_demonstration_role_assignment"],
  ["person", "log_changes_person"],
  ["person_state", "log_changes_person_state"],
  ["primary_demonstration_role_assignment", "log_changes_primary_demonstration_role_assignment"],
];

const SEED_TRIGGERS = [
  ["application", "create_phases_and_dates_for_new_application"],
  ["person", "assign_cms_user_to_all_states"],
];

const GUARD_TRIGGERS = [
  ["demonstration", "check_demonstration_primary_project_officer", true],
  ["primary_demonstration_role_assignment", "check_demonstration_retains_primary_project_officer", true],
  ["demonstration", "check_that_main_record_deleted_from_application", false],
] as const;

const LOGIN_PRIVILEGES = [
  ...OWNED_TABLES.flatMap((table) => [
    [table, "SELECT"],
    [table, "INSERT"],
    [table, "DELETE"],
  ]),
  ...HISTORY_TABLES.flatMap((table) => [[table, "SELECT"], [table, "INSERT"], [table, "DELETE"]]),
  ["data_fix_log", "SELECT"],
  ["data_fix_log", "DELETE"],
  ["_prisma_migrations", "SELECT"],
  ["application_type", "SELECT"],
  ["application_status", "SELECT"],
  ["date_type", "SELECT"],
  ["demonstration_application_type_limit", "SELECT"],
  ["demonstration_grant_level_limit", "SELECT"],
  ["grant_level", "SELECT"],
  ["phase", "SELECT"],
  ["phase_phase_status", "SELECT"],
  ["person_type", "SELECT"],
  ["role", "SELECT"],
  ["role_person_type", "SELECT"],
  ["signature_level", "SELECT"],
  ["state", "SELECT"],
].map(([table, privilege]) => [String(table), String(privilege)]);

const FIX_ROLE_PRIVILEGES = [
  ["application", "SELECT"],
  ["application", "UPDATE"],
  ["application_history", "INSERT"],
  ["application_type", "SELECT"],
  ["demonstration", "SELECT"],
  ["primary_demonstration_role_assignment", "DELETE"],
  ["primary_demonstration_role_assignment", "SELECT"],
  ["primary_demonstration_role_assignment_history", "INSERT"],
  ["role", "SELECT"],
].map(([table, privilege]) => [String(table), String(privilege)]);

const HISTORY_SEQUENCES = [
  "application_date_history_revision_id_seq",
  "application_history_revision_id_seq",
  "application_phase_history_revision_id_seq",
  "demonstration_history_revision_id_seq",
  "demonstration_role_assignment_history_revision_id_seq",
  "person_history_revision_id_seq",
  "person_state_history_revision_id_seq",
  "primary_demonstration_role_assignment_history_revision_id_seq",
];

const FIX_ROLE_HISTORY_SEQUENCES = [
  "application_history_revision_id_seq",
  "primary_demonstration_role_assignment_history_revision_id_seq",
];

export type RunScope = {
  applicationId: string;
  personId: string;
  email: string;
  suffix: string;
  fileNames: [string, string];
  forwardFileName: string;
  reverseFileName: string;
};

type OwnedSnapshot = {
  application: unknown[];
  applicationDate: unknown[];
  applicationPhase: unknown[];
  demonstration: unknown[];
  demonstrationRoleAssignment: unknown[];
  person: unknown[];
  personState: unknown[];
  primaryDemonstrationRoleAssignment: unknown[];
  history: Record<string, unknown[]>;
  ledger: unknown[];
};

function missingPrerequisite(message: string): Error {
  return new Error(`Missing integration prerequisite: ${message}. ${SETUP_COMMAND}`);
}

export function quoteFixtureUuid(value: string): string {
  if (
    value.length !== 36 ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new Error("Fixture UUID must be a complete 36-character hyphenated hexadecimal UUID.");
  }

  return escapeLiteral(value);
}

export function localDatabaseConfig(env: NodeJS.ProcessEnv): ClientConfig {
  if (env.CURRENT_ENV !== "local") {
    throw new Error("Data-fix integration requires CURRENT_ENV=local; no database connection was opened.");
  }
  const connectionString = env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Data-fix integration requires DATABASE_URL from server/.env; no database connection was opened.");
  }

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("Data-fix integration requires a valid local DATABASE_URL; no database connection was opened.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    url.hostname.toLowerCase() !== "db" ||
    url.pathname.slice(1) !== "demos" ||
    url.searchParams.getAll("schema").length !== 1 ||
    url.searchParams.get("schema") !== "demos_app" ||
    !url.username ||
    !url.password
  ) {
    throw new Error("Data-fix integration only connects to the configured devcontainer db/demos/demos_app target; no database connection was opened.");
  }

  return {
    connectionString,
    options: "-c search_path=demos_app,public",
    connectionTimeoutMillis: 5_000,
  };
}

export function createRunScope(now = new Date()): RunScope {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const prefix = `${date}_DEMOS-99999_integration`;
  const forwardFileName = `${prefix}_forward_${suffix}.sql`;
  const reverseFileName = `${prefix}_reverse_${suffix}.sql`;
  return {
    applicationId: randomUUID(),
    personId: randomUUID(),
    email: `data-fix-integration+${suffix}@example.invalid`,
    suffix,
    fileNames: [forwardFileName, reverseFileName],
    forwardFileName,
    reverseFileName,
  };
}

export async function writeOwnershipManifest(directory: string, scope: RunScope): Promise<string> {
  await mkdir(directory, { recursive: true });
  const manifestPath = join(directory, `${scope.suffix}.json`);
  await writeFile(manifestPath, `${JSON.stringify({
    applicationId: scope.applicationId,
    personId: scope.personId,
    email: scope.email,
    fileNames: scope.fileNames,
  }, null, 2)}\n`);
  return manifestPath;
}

export async function assertIntegrationPrerequisites(client: Client, requiredMigration: string): Promise<void> {
  const migration = await client.query(
    `SELECT 1 FROM demos_app._prisma_migrations
     WHERE migration_name = $1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL`,
    [requiredMigration],
  );
  if (migration.rowCount !== 1) {
    throw missingPrerequisite(`completed migration ${requiredMigration} is not recorded`);
  }

  const missingTables = await client.query<{ table_name: string }>(
    `SELECT requested.table_name
     FROM unnest($1::text[]) AS requested(table_name)
     WHERE to_regclass(format('demos_app.%I', requested.table_name)) IS NULL`,
    [REQUIRED_TABLES],
  );
  if (missingTables.rows.length > 0) {
    throw missingPrerequisite(`required table ${missingTables.rows[0].table_name} is missing`);
  }

  const references = await client.query<{ missing_reference: string }>(`
    SELECT missing_reference FROM (
      SELECT 'application type Demonstration' AS missing_reference WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.application_type WHERE id = 'Demonstration'
      )
      UNION ALL SELECT 'demonstration application type Demonstration' WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.demonstration_application_type_limit WHERE id = 'Demonstration'
      )
      UNION ALL SELECT 'application status Pre-Submission' WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.application_status WHERE id = 'Pre-Submission'
      )
      UNION ALL SELECT 'date type Concept Start Date' WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.date_type WHERE id = 'Concept Start Date'
      )
      UNION ALL SELECT 'demonstration grant level Demonstration' WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.demonstration_grant_level_limit WHERE id = 'Demonstration'
      )
      UNION ALL SELECT 'grant level Demonstration' WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.grant_level WHERE id = 'Demonstration'
      )
      UNION ALL SELECT 'phase Concept' WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.phase WHERE id = 'Concept' AND phase_number = 1
      )
      UNION ALL SELECT 'phase/status Concept/Started' WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.phase_phase_status WHERE phase_id = 'Concept' AND phase_status_id = 'Started'
      )
      UNION ALL SELECT 'application phase/status mapping' WHERE EXISTS (
        SELECT 1 FROM demos_app.phase AS phase
        WHERE phase.phase_number > 0 AND NOT EXISTS (
          SELECT 1 FROM demos_app.phase_phase_status AS status
          WHERE status.phase_id = phase.id
            AND status.phase_status_id = CASE WHEN phase.phase_number = 1 THEN 'Started' ELSE 'Not Started' END
        )
      )
      UNION ALL SELECT 'person type demos-cms-user' WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.person_type WHERE id = 'demos-cms-user'
      )
      UNION ALL SELECT 'role Project Officer/Demonstration' WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.role WHERE id = 'Project Officer' AND grant_level_id = 'Demonstration'
      )
      UNION ALL SELECT 'role/person type Project Officer/demos-cms-user' WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.role_person_type WHERE role_id = 'Project Officer' AND person_type_id = 'demos-cms-user'
      )
      UNION ALL SELECT 'signature level OA' WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.signature_level WHERE id = 'OA'
      )
      UNION ALL SELECT 'state AL' WHERE NOT EXISTS (
        SELECT 1 FROM demos_app.state WHERE id = 'AL'
      )
    ) AS reference_checks WHERE missing_reference IS NOT NULL
    LIMIT 1
  `);
  if (references.rows.length > 0) {
    throw missingPrerequisite(`reference data ${references.rows[0].missing_reference} is missing`);
  }

  const missingHistoryTriggers = await client.query<{ trigger_name: string }>(
    `SELECT expected.trigger_name
     FROM unnest($1::text[], $2::text[]) AS expected(table_name, trigger_name)
     WHERE NOT EXISTS (
       SELECT 1 FROM pg_trigger AS trigger
       JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
       JOIN pg_namespace AS schema ON schema.oid = relation.relnamespace
       WHERE schema.nspname = 'demos_app' AND relation.relname = expected.table_name
         AND trigger.tgname = expected.trigger_name AND NOT trigger.tgisinternal
     )`,
    [HISTORY_TRIGGERS.map(([table]) => table), HISTORY_TRIGGERS.map(([, trigger]) => trigger)],
  );
  if (missingHistoryTriggers.rows.length > 0) {
    throw missingPrerequisite(`history trigger ${missingHistoryTriggers.rows[0].trigger_name} is missing`);
  }

  const missingSeedTriggers = await client.query<{ trigger_name: string }>(
    `SELECT expected.trigger_name
     FROM unnest($1::text[], $2::text[]) AS expected(table_name, trigger_name)
     WHERE NOT EXISTS (
       SELECT 1 FROM pg_trigger AS trigger
       JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
       JOIN pg_namespace AS schema ON schema.oid = relation.relnamespace
       WHERE schema.nspname = 'demos_app' AND relation.relname = expected.table_name
         AND trigger.tgname = expected.trigger_name AND NOT trigger.tgisinternal
     )`,
    [SEED_TRIGGERS.map(([table]) => table), SEED_TRIGGERS.map(([, trigger]) => trigger)],
  );
  if (missingSeedTriggers.rows.length > 0) {
    throw missingPrerequisite(`seed trigger ${missingSeedTriggers.rows[0].trigger_name} is missing`);
  }

  const missingGuards = await client.query<{ trigger_name: string }>(
    `SELECT expected.trigger_name
     FROM unnest($1::text[], $2::text[], $3::boolean[]) AS expected(table_name, trigger_name, deferred)
     WHERE NOT EXISTS (
       SELECT 1 FROM pg_trigger AS trigger
       JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
       JOIN pg_namespace AS schema ON schema.oid = relation.relnamespace
       WHERE schema.nspname = 'demos_app' AND relation.relname = expected.table_name
         AND trigger.tgname = expected.trigger_name AND NOT trigger.tgisinternal
         AND (NOT expected.deferred OR (trigger.tgdeferrable AND trigger.tginitdeferred))
     )`,
    [GUARD_TRIGGERS.map(([table]) => table), GUARD_TRIGGERS.map(([, trigger]) => trigger), GUARD_TRIGGERS.map(([, , deferred]) => deferred)],
  );
  if (missingGuards.rows.length > 0) {
    throw missingPrerequisite(`required guard trigger ${missingGuards.rows[0].trigger_name} is missing or not initially deferred`);
  }

  const deferredForeignKey = await client.query(
    `SELECT 1 FROM pg_constraint
     WHERE conrelid = 'demos_app.demonstration'::regclass
       AND confrelid = 'demos_app.application'::regclass
       AND contype = 'f' AND condeferrable AND condeferred`,
  );
  if (deferredForeignKey.rowCount !== 1) {
    throw missingPrerequisite("deferred demonstration-to-application foreign key is missing");
  }

  const roles = await client.query<{
    rolcanlogin: boolean;
    rolsuper: boolean;
    rolcreatedb: boolean;
    rolcreaterole: boolean;
    can_set_role: boolean;
  }>(
    `SELECT role.rolcanlogin, role.rolsuper, role.rolcreatedb, role.rolcreaterole,
            pg_has_role(current_user, role.oid, 'SET') AS can_set_role
     FROM pg_roles AS role WHERE role.rolname = 'demos_data_fix'`,
  );
  const fixRole = roles.rows.at(0);
  if (
    !fixRole || fixRole.rolcanlogin || fixRole.rolsuper || fixRole.rolcreatedb || fixRole.rolcreaterole || !fixRole.can_set_role
  ) {
    throw missingPrerequisite("demos_data_fix must exist as a non-login, non-superuser role that the local login can SET");
  }
  await assertLedgerAccessPolicy(client);

  const schemaUsage = await client.query<{ login_allowed: boolean; fix_role_allowed: boolean; temp_allowed: boolean }>(
    `SELECT has_schema_privilege(current_user, 'demos_app', 'USAGE') AS login_allowed,
            has_schema_privilege('demos_data_fix', 'demos_app', 'USAGE') AS fix_role_allowed,
            has_database_privilege('demos_data_fix', current_database(), 'TEMP') AS temp_allowed`,
  );
  if (!schemaUsage.rows[0]?.login_allowed || !schemaUsage.rows[0]?.fix_role_allowed || !schemaUsage.rows[0]?.temp_allowed) {
    throw missingPrerequisite("schema usage and temporary-table privileges for the local login and demos_data_fix are required");
  }

  const loginPrivileges = await client.query<{ table_name: string; privilege: string }>(
    `SELECT expected.table_name, expected.privilege
     FROM unnest($1::text[], $2::text[]) AS expected(table_name, privilege)
     WHERE NOT has_table_privilege(current_user, format('demos_app.%I', expected.table_name), expected.privilege)`,
    [LOGIN_PRIVILEGES.map(([table]) => table), LOGIN_PRIVILEGES.map(([, privilege]) => privilege)],
  );
  if (loginPrivileges.rows.length > 0) {
    const missing = loginPrivileges.rows[0];
    throw missingPrerequisite(`local login needs ${missing.privilege} on demos_app.${missing.table_name} for seeding and cleanup`);
  }

  const fixRolePrivileges = await client.query<{ table_name: string; privilege: string }>(
    `SELECT expected.table_name, expected.privilege
     FROM unnest($1::text[], $2::text[]) AS expected(table_name, privilege)
     WHERE NOT has_table_privilege('demos_data_fix', format('demos_app.%I', expected.table_name), expected.privilege)`,
    [FIX_ROLE_PRIVILEGES.map(([table]) => table), FIX_ROLE_PRIVILEGES.map(([, privilege]) => privilege)],
  );
  if (fixRolePrivileges.rows.length > 0) {
    const missing = fixRolePrivileges.rows[0];
    throw missingPrerequisite(`demos_data_fix needs ${missing.privilege} on demos_app.${missing.table_name} for the dry-run fix`);
  }

  const missingSequences = await client.query<{ sequence_name: string }>(
    `SELECT expected.sequence_name
     FROM unnest($1::text[]) AS expected(sequence_name)
     WHERE to_regclass(format('demos_app.%I', expected.sequence_name)) IS NULL`,
    [HISTORY_SEQUENCES],
  );
  if (missingSequences.rows.length > 0) {
    throw missingPrerequisite(`history sequence ${missingSequences.rows[0].sequence_name} is missing`);
  }

  const sequences = await client.query<{ sequence_name: string }>(
    `SELECT expected.sequence_name
     FROM unnest($1::text[]) AS expected(sequence_name)
     WHERE NOT has_sequence_privilege(current_user, format('demos_app.%I', expected.sequence_name), 'USAGE')
        OR (expected.sequence_name = ANY($2::text[])
            AND NOT has_sequence_privilege('demos_data_fix', format('demos_app.%I', expected.sequence_name), 'USAGE'))`,
    [HISTORY_SEQUENCES, FIX_ROLE_HISTORY_SEQUENCES],
  );
  if (sequences.rows.length > 0) {
    throw missingPrerequisite(`history sequence ${sequences.rows[0].sequence_name} is inaccessible`);
  }

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE demos_data_fix");
    const roleProbe = await client.query<{ current_user: string }>("SELECT current_user");
    if (roleProbe.rows[0]?.current_user !== "demos_data_fix") {
      throw missingPrerequisite("the local login cannot switch to demos_data_fix");
    }
  } catch {
    throw missingPrerequisite("the local login cannot switch to demos_data_fix");
  } finally {
    await client.query("ROLLBACK");
  }
}

export async function assertLedgerAccessPolicy(client: Client): Promise<void> {
  const expectedRoles = ["demos_write", "demos_delete"];
  const roles = await client.query<{ rolname: string }>(
    "SELECT rolname FROM pg_roles WHERE rolname = ANY($1::text[])",
    [expectedRoles],
  );
  const presentRoles = new Set(roles.rows.map((role) => role.rolname));
  const missingRole = expectedRoles.find((role) => !presentRoles.has(role));
  if (missingRole) {
    throw missingPrerequisite(`role ${missingRole} is missing for the ledger access checks`);
  }

  const policy = await client.query<{
    write_insert: boolean;
    write_update: boolean;
    write_delete: boolean;
    write_truncate: boolean;
    write_schema_usage: boolean;
    delete_insert: boolean;
    delete_update: boolean;
    delete_delete: boolean;
    delete_truncate: boolean;
    delete_schema_usage: boolean;
    fix_select: boolean;
    fix_insert: boolean;
    fix_update: boolean;
    fix_delete: boolean;
    fix_truncate: boolean;
    fix_schema_usage: boolean;
    fix_schema_create: boolean;
    fix_can_truncate: boolean;
  }>(`
    SELECT
      has_table_privilege('demos_write', 'demos_app.data_fix_log', 'INSERT') AS write_insert,
      has_table_privilege('demos_write', 'demos_app.data_fix_log', 'UPDATE') AS write_update,
      has_table_privilege('demos_write', 'demos_app.data_fix_log', 'DELETE') AS write_delete,
      has_table_privilege('demos_write', 'demos_app.data_fix_log', 'TRUNCATE') AS write_truncate,
      has_schema_privilege('demos_write', 'demos_app', 'USAGE') AS write_schema_usage,
      has_table_privilege('demos_delete', 'demos_app.data_fix_log', 'INSERT') AS delete_insert,
      has_table_privilege('demos_delete', 'demos_app.data_fix_log', 'UPDATE') AS delete_update,
      has_table_privilege('demos_delete', 'demos_app.data_fix_log', 'DELETE') AS delete_delete,
      has_table_privilege('demos_delete', 'demos_app.data_fix_log', 'TRUNCATE') AS delete_truncate,
      has_schema_privilege('demos_delete', 'demos_app', 'USAGE') AS delete_schema_usage,
      has_table_privilege('demos_data_fix', 'demos_app.data_fix_log', 'SELECT') AS fix_select,
      has_table_privilege('demos_data_fix', 'demos_app.data_fix_log', 'INSERT') AS fix_insert,
      has_table_privilege('demos_data_fix', 'demos_app.data_fix_log', 'UPDATE') AS fix_update,
      has_table_privilege('demos_data_fix', 'demos_app.data_fix_log', 'DELETE') AS fix_delete,
      has_table_privilege('demos_data_fix', 'demos_app.data_fix_log', 'TRUNCATE') AS fix_truncate,
      has_schema_privilege('demos_data_fix', 'demos_app', 'USAGE') AS fix_schema_usage,
      has_schema_privilege('demos_data_fix', 'demos_app', 'CREATE') AS fix_schema_create,
      COALESCE((
        SELECT bool_or(has_table_privilege('demos_data_fix', format('demos_app.%I', expected.table_name), 'TRUNCATE'))
        FROM unnest($1::text[]) AS expected(table_name)
      ), false) AS fix_can_truncate
  `, [[...OWNED_TABLES, ...HISTORY_TABLES, "data_fix_log"]]);
  const actual = policy.rows[0];
  if (
    !actual.write_insert || actual.write_update || actual.write_delete || actual.write_truncate ||
    !actual.write_schema_usage || actual.delete_insert || actual.delete_update || actual.delete_delete ||
    actual.delete_truncate || !actual.delete_schema_usage || !actual.fix_select || actual.fix_insert ||
    actual.fix_update || actual.fix_delete || actual.fix_truncate || !actual.fix_schema_usage || actual.fix_schema_create ||
    actual.fix_can_truncate
  ) {
    throw missingPrerequisite("the data-fix ledger must remain append-only for demos_write and read-only for demos_delete and demos_data_fix");
  }

  const ownership = await client.query<{ schema_not_owned_by_fix: boolean; tables_not_owned_by_fix: boolean }>(`
    SELECT bool_and(schema.nspowner <> fix_role.oid) AS schema_not_owned_by_fix,
           bool_and(relation.relowner <> fix_role.oid) AS tables_not_owned_by_fix
    FROM pg_namespace AS schema
    JOIN pg_roles AS fix_role ON fix_role.rolname = 'demos_data_fix'
    JOIN pg_class AS relation ON relation.relnamespace = schema.oid
    WHERE schema.nspname = 'demos_app' AND relation.relname::text = ANY($1::text[])
  `, [[...OWNED_TABLES, ...HISTORY_TABLES, "data_fix_log"]]);
  if (!ownership.rows[0]?.schema_not_owned_by_fix || !ownership.rows[0]?.tables_not_owned_by_fix) {
    throw missingPrerequisite("demos_data_fix must not own the application schema or critical tables");
  }
}

export async function assertRunScopeAvailable(client: Client, scope: RunScope): Promise<void> {
  const result = await client.query(
    `SELECT
       EXISTS (SELECT 1 FROM demos_app.application WHERE id = $1) AS application_exists,
       EXISTS (SELECT 1 FROM demos_app.demonstration WHERE id = $1) AS demonstration_exists,
       EXISTS (SELECT 1 FROM demos_app.person WHERE id = $2 OR email = $3) AS person_exists,
       EXISTS (SELECT 1 FROM demos_app.data_fix_log WHERE file_name = ANY($4::text[])) AS ledger_exists`,
    [scope.applicationId, scope.personId, scope.email, scope.fileNames],
  );
  const row = result.rows[0];
  if (row.application_exists || row.demonstration_exists || row.person_exists || row.ledger_exists) {
    throw new Error("Generated data-fix integration ownership identifiers already exist; start a fresh run.");
  }
}

export async function seedOwnedGraph(client: Client, scope: RunScope): Promise<void> {
  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO demos_app.application (id, application_type_id, is_migrated_from_pmda)
       VALUES ($1, 'Demonstration', false)`,
      [scope.applicationId],
    );
    await client.query(
      `INSERT INTO demos_app.demonstration
         (id, application_type_id, signature_level_id, name, status_id, current_phase_id, state_id, updated_at)
       VALUES ($1, 'Demonstration', 'OA', 'Synthetic data-fix integration demonstration',
               'Pre-Submission', 'Concept', 'AL', CURRENT_TIMESTAMP)`,
      [scope.applicationId],
    );
    await client.query(
      `INSERT INTO demos_app.person (id, person_type_id, email, first_name, last_name, updated_at)
       VALUES ($1, 'demos-cms-user', $2, 'Synthetic', 'Integration', CURRENT_TIMESTAMP)`,
      [scope.personId, scope.email],
    );
    await client.query(
      `INSERT INTO demos_app.demonstration_role_assignment
         (person_id, demonstration_id, role_id, state_id, person_type_id, grant_level_id)
       VALUES ($1, $2, 'Project Officer', 'AL', 'demos-cms-user', 'Demonstration')`,
      [scope.personId, scope.applicationId],
    );
    await client.query(
      `INSERT INTO demos_app.primary_demonstration_role_assignment (person_id, demonstration_id, role_id)
       VALUES ($1, $2, 'Project Officer')`,
      [scope.personId, scope.applicationId],
    );
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // The caller still attempts exact owned cleanup after a failed seed transaction.
    }
    throw error;
  }
}

export async function ownedSnapshot(client: Client, scope: RunScope): Promise<OwnedSnapshot> {
  const [application, applicationDate, applicationPhase, demonstration, demonstrationRoleAssignment,
    person, personState, primaryDemonstrationRoleAssignment, ...history] = await Promise.all([
    client.query("SELECT * FROM demos_app.application WHERE id = $1", [scope.applicationId]),
    client.query("SELECT * FROM demos_app.application_date WHERE application_id = $1 ORDER BY date_type_id", [scope.applicationId]),
    client.query("SELECT * FROM demos_app.application_phase WHERE application_id = $1 ORDER BY phase_id", [scope.applicationId]),
    client.query("SELECT * FROM demos_app.demonstration WHERE id = $1", [scope.applicationId]),
    client.query(
      "SELECT * FROM demos_app.demonstration_role_assignment WHERE demonstration_id = $1 AND person_id = $2 ORDER BY role_id",
      [scope.applicationId, scope.personId],
    ),
    client.query("SELECT * FROM demos_app.person WHERE id = $1 AND email = $2", [scope.personId, scope.email]),
    client.query("SELECT * FROM demos_app.person_state WHERE person_id = $1 ORDER BY state_id", [scope.personId]),
    client.query(
      "SELECT * FROM demos_app.primary_demonstration_role_assignment WHERE demonstration_id = $1 AND person_id = $2 ORDER BY role_id",
      [scope.applicationId, scope.personId],
    ),
    client.query("SELECT * FROM demos_app.application_date_history WHERE application_id = $1 ORDER BY revision_id", [scope.applicationId]),
    client.query("SELECT * FROM demos_app.application_history WHERE id = $1 ORDER BY revision_id", [scope.applicationId]),
    client.query("SELECT * FROM demos_app.application_phase_history WHERE application_id = $1 ORDER BY revision_id", [scope.applicationId]),
    client.query("SELECT * FROM demos_app.demonstration_history WHERE id = $1 ORDER BY revision_id", [scope.applicationId]),
    client.query(
      "SELECT * FROM demos_app.demonstration_role_assignment_history WHERE demonstration_id = $1 AND person_id = $2 ORDER BY revision_id",
      [scope.applicationId, scope.personId],
    ),
    client.query("SELECT * FROM demos_app.person_history WHERE id = $1 ORDER BY revision_id", [scope.personId]),
    client.query("SELECT * FROM demos_app.person_state_history WHERE person_id = $1 ORDER BY revision_id", [scope.personId]),
    client.query(
      "SELECT * FROM demos_app.primary_demonstration_role_assignment_history WHERE demonstration_id = $1 AND person_id = $2 ORDER BY revision_id",
      [scope.applicationId, scope.personId],
    ),
  ]);
  const ledger = await client.query("SELECT * FROM demos_app.data_fix_log WHERE file_name = ANY($1::text[]) ORDER BY file_name", [scope.fileNames]);
  return {
    application: application.rows,
    applicationDate: applicationDate.rows,
    applicationPhase: applicationPhase.rows,
    demonstration: demonstration.rows,
    demonstrationRoleAssignment: demonstrationRoleAssignment.rows,
    person: person.rows,
    personState: personState.rows,
    primaryDemonstrationRoleAssignment: primaryDemonstrationRoleAssignment.rows,
    history: {
      applicationDate: history[0].rows,
      application: history[1].rows,
      applicationPhase: history[2].rows,
      demonstration: history[3].rows,
      demonstrationRoleAssignment: history[4].rows,
      person: history[5].rows,
      personState: history[6].rows,
      primaryDemonstrationRoleAssignment: history[7].rows,
    },
    ledger: ledger.rows,
  };
}

export async function cleanupOwnedGraph(client: Client, scope: RunScope): Promise<void> {
  await client.query("BEGIN");
  try {
    await client.query(
      "DELETE FROM demos_app.primary_demonstration_role_assignment WHERE demonstration_id = $1 AND person_id = $2",
      [scope.applicationId, scope.personId],
    );
    await client.query(
      "DELETE FROM demos_app.demonstration_role_assignment WHERE demonstration_id = $1 AND person_id = $2",
      [scope.applicationId, scope.personId],
    );
    await client.query("DELETE FROM demos_app.application_phase WHERE application_id = $1", [scope.applicationId]);
    await client.query("DELETE FROM demos_app.application_date WHERE application_id = $1", [scope.applicationId]);
    await client.query("DELETE FROM demos_app.application WHERE id = $1", [scope.applicationId]);
    await client.query("DELETE FROM demos_app.demonstration WHERE id = $1", [scope.applicationId]);
    await client.query("DELETE FROM demos_app.person_state WHERE person_id = $1", [scope.personId]);
    await client.query("DELETE FROM demos_app.person WHERE id = $1 AND email = $2", [scope.personId, scope.email]);

    await client.query("DELETE FROM demos_app.application_date_history WHERE application_id = $1", [scope.applicationId]);
    await client.query("DELETE FROM demos_app.application_history WHERE id = $1", [scope.applicationId]);
    await client.query("DELETE FROM demos_app.application_phase_history WHERE application_id = $1", [scope.applicationId]);
    await client.query("DELETE FROM demos_app.demonstration_history WHERE id = $1", [scope.applicationId]);
    await client.query(
      "DELETE FROM demos_app.demonstration_role_assignment_history WHERE demonstration_id = $1 AND person_id = $2",
      [scope.applicationId, scope.personId],
    );
    await client.query("DELETE FROM demos_app.person_history WHERE id = $1", [scope.personId]);
    await client.query("DELETE FROM demos_app.person_state_history WHERE person_id = $1", [scope.personId]);
    await client.query(
      "DELETE FROM demos_app.primary_demonstration_role_assignment_history WHERE demonstration_id = $1 AND person_id = $2",
      [scope.applicationId, scope.personId],
    );
    await client.query("DELETE FROM demos_app.data_fix_log WHERE file_name = ANY($1::text[])", [scope.fileNames]);
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the initial cleanup failure for the caller's recovery report.
    }
    throw error;
  }

  const remaining = await ownedSnapshot(client, scope);
  if (Object.values(remaining).some((value) => Array.isArray(value) ? value.length > 0 : Object.values(value).some((rows) => rows.length > 0))) {
    throw new Error("Owned data-fix integration records remain after cleanup.");
  }
}

export async function withOwnedCleanup<T>(
  run: () => Promise<T>,
  cleanup: () => Promise<void>,
  reportCleanupFailure: (error: unknown) => void,
): Promise<T> {
  let result: T;
  let runError: unknown;
  let runFailed = false;
  try {
    result = await run();
  } catch (error) {
    runError = error;
    runFailed = true;
  }

  try {
    await cleanup();
  } catch (error) {
    reportCleanupFailure(error);
    if (!runFailed) {
      throw error;
    }
  }

  if (runFailed) {
    throw runError;
  }
  return result!;
}
