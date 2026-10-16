import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "pg";

const serverSource = fileURLToPath(new URL("../../../../server/src/", import.meta.url));

export type DisposableDemosSchema = {
  client: Client;
  // Drops demos_app (only if this run created it) and disconnects.
  close(): Promise<void>;
};

// Setup creates and later drops demos_app, so it refuses anything that might be a real database. The URL is
// checked before connecting. The server address is not checked: behind Docker port forwarding it is the
// container's address.
async function connectToDisposableDatabase(databaseUrl: string): Promise<Client> {
  const url = new URL(databaseUrl);
  const database = decodeURIComponent(url.pathname.slice(1));
  // 1. The URL points at this machine.
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
    throw new Error(`Refusing fixture setup: ${url.hostname} is not localhost`);
  }
  // 2. The database is named as a throwaway test database, never like the app's `demos`.
  if (!/^dataconnect_[a-z0-9_]+_test$/.test(database)) {
    throw new Error(`Refusing fixture setup: ${database} is not named dataconnect_*_test`);
  }
  const client = new Client({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    const check = await client.query("SELECT current_database() AS database, to_regnamespace('demos_app') AS existing_schema");
    // 3. The connection really reached that database.
    if (check.rows[0].database !== database) {
      throw new Error(`Refusing fixture setup: connected to ${check.rows[0].database}, not ${database}`);
    }
    // 4. There is no demos_app schema yet, so setup never writes into (or later drops) existing data.
    if (check.rows[0].existing_schema !== null) {
      throw new Error(`Refusing fixture setup: ${database} already has a demos_app schema`);
    }
  } catch (error) {
    await client.end();
    throw error;
  }
  return client;
}

// What `npm run migrate:deploy` applies: every Prisma migration, then the dbrefresh files from
// server/src/refreshDbObjects.ts. permissions.sql is skipped because it grants to the cluster-wide
// demos_* roles, utility_views.sql because it writes to public, and cron_schedules.sql (needs
// pg_cron) as IS_TEST_MIGRATION does.
function demosSchemaSql(): string[] {
  const migrations = join(serverSource, "model/migrations");
  const files = readdirSync(migrations, { withFileTypes: true })
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
    .map((name) => join(migrations, name, "migration.sql"));
  return [...files, join(serverSource, "sql/history_triggers.sql"), join(serverSource, "sql/functions.sql")]
    .map((file) => readFileSync(file, "utf8"));
}

// One transaction, so a failed migration or seed leaves no partial schema behind.
async function createDemosSchema(client: Client, seed: (client: Client) => Promise<void>): Promise<void> {
  await client.query("BEGIN");
  try {
    await client.query("CREATE SCHEMA demos_app");
    // Prisma sets the search path from ?schema=demos_app; later migrations rely on it.
    await client.query("SET LOCAL search_path TO demos_app");
    for (const sql of demosSchemaSql()) await client.query(sql);
    await seed(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

// Connects to the disposable database and builds a seeded demos_app from the server's real schema.
export async function openDisposableDemosSchema(
  databaseUrl: string,
  seed: (client: Client) => Promise<void>,
): Promise<DisposableDemosSchema> {
  const client = await connectToDisposableDatabase(databaseUrl);
  let ownsSchema = false;
  const close = async () => {
    try {
      if (ownsSchema) await client.query("DROP SCHEMA demos_app CASCADE");
    } finally {
      await client.end();
    }
  };
  try {
    await client.query("SET statement_timeout = '15s'");
    await client.query("SET TIME ZONE 'UTC'");
    await createDemosSchema(client, seed);
    ownsSchema = true;
    // The first migration sets a session search path; the export and reports must not depend on it.
    await client.query("RESET search_path");
  } catch (error) {
    await close();
    throw error;
  }
  return { client, close };
}
