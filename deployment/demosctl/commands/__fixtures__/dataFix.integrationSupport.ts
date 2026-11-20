import { randomUUID } from "node:crypto";
import { escapeLiteral, type Client } from "pg";
export { disposableDatabaseConfig } from "./dataFix.integrationTarget.js";

const SETUP_COMMAND = "Run `bash .devcontainer/run-data-fix-integration.sh` from the repository root (it runs `npm run migrate:deploy`).";

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

export async function assertLedgerAccessPolicy(client: Client): Promise<void> {
  const policy = await client.query<{
    write_insert: boolean;
    write_update: boolean;
    write_delete: boolean;
    write_truncate: boolean;
    delete_insert: boolean;
    delete_update: boolean;
    delete_delete: boolean;
    delete_truncate: boolean;
    fix_select: boolean;
    fix_insert: boolean;
    fix_update: boolean;
    fix_delete: boolean;
    fix_truncate: boolean;
  }>(`
    SELECT
      has_table_privilege('demos_write', 'demos_app.data_fix_log', 'INSERT') AS write_insert,
      has_table_privilege('demos_write', 'demos_app.data_fix_log', 'UPDATE') AS write_update,
      has_table_privilege('demos_write', 'demos_app.data_fix_log', 'DELETE') AS write_delete,
      has_table_privilege('demos_write', 'demos_app.data_fix_log', 'TRUNCATE') AS write_truncate,
      has_table_privilege('demos_delete', 'demos_app.data_fix_log', 'INSERT') AS delete_insert,
      has_table_privilege('demos_delete', 'demos_app.data_fix_log', 'UPDATE') AS delete_update,
      has_table_privilege('demos_delete', 'demos_app.data_fix_log', 'DELETE') AS delete_delete,
      has_table_privilege('demos_delete', 'demos_app.data_fix_log', 'TRUNCATE') AS delete_truncate,
      has_table_privilege('demos_data_fix', 'demos_app.data_fix_log', 'SELECT') AS fix_select,
      has_table_privilege('demos_data_fix', 'demos_app.data_fix_log', 'INSERT') AS fix_insert,
      has_table_privilege('demos_data_fix', 'demos_app.data_fix_log', 'UPDATE') AS fix_update,
      has_table_privilege('demos_data_fix', 'demos_app.data_fix_log', 'DELETE') AS fix_delete,
      has_table_privilege('demos_data_fix', 'demos_app.data_fix_log', 'TRUNCATE') AS fix_truncate
  `);
  const actual = policy.rows[0];
  if (
    !actual.write_insert || actual.write_update || actual.write_delete || actual.write_truncate ||
    actual.delete_insert || actual.delete_update || actual.delete_delete || actual.delete_truncate ||
    !actual.fix_select || actual.fix_insert || actual.fix_update || actual.fix_delete || actual.fix_truncate
  ) {
    throw missingPrerequisite("the data-fix ledger must remain append-only for demos_write and read-only for demos_delete and demos_data_fix");
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
      // Preserve the original seed error if rollback also fails.
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
