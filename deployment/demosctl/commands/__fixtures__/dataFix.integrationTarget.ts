import { pathToFileURL } from "node:url";

const SETUP_COMMAND = "Run `bash .devcontainer/run-data-fix-integration.sh` from the repository root.";

type DisposableDatabaseConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  options: string;
  connectionTimeoutMillis: number;
};

export function disposableDatabaseConfig(env: NodeJS.ProcessEnv): DisposableDatabaseConfig {
  if (env.DEVCONTAINER !== "true") {
    throw new Error(`Data-fix integration requires DEVCONTAINER=true. ${SETUP_COMMAND} no database connection was opened.`);
  }
  if (env.CURRENT_ENV !== "local") {
    throw new Error(`Data-fix integration requires CURRENT_ENV=local. ${SETUP_COMMAND} no database connection was opened.`);
  }
  if (env.IS_TEST_MIGRATION !== "true") {
    throw new Error(`Data-fix integration requires IS_TEST_MIGRATION=true. ${SETUP_COMMAND} no database connection was opened.`);
  }

  const host = env.DATA_FIX_TEST_HOST;
  const port = env.DATA_FIX_TEST_PORT;
  const database = env.DATA_FIX_TEST_DATABASE;
  const user = env.DATA_FIX_TEST_USER;
  const password = env.DATA_FIX_TEST_PASSWORD;
  const databaseMatch = database?.match(/^data_fix_test_([a-f0-9]{16})$/);
  const expectedUser = databaseMatch ? `data_fix_user_${databaseMatch[1]}` : undefined;
  const expectedUrl = databaseMatch && user && password
    ? `postgresql://${user}:${password}@data-fix-postgres:5432/${database}?schema=demos_app&sslmode=disable&connect_timeout=5`
    : undefined;

  if (
    !host ||
    host !== "data-fix-postgres" ||
    !port ||
    port !== "5432" ||
    !database ||
    !databaseMatch ||
    !user ||
    user !== expectedUser ||
    !password ||
    !/^[a-f0-9]{64}$/.test(password) ||
    env.DATABASE_URL !== expectedUrl
  ) {
    throw new Error("Data-fix integration requires the complete per-run disposable PostgreSQL target; no database connection was opened.");
  }

  return {
    host,
    port: Number(port),
    database,
    user,
    password,
    options: "-c search_path=demos_app,public",
    connectionTimeoutMillis: 5_000,
  };
}

// @ts-expect-error Node runs this standalone preflight as ESM before deployment dependencies are installed.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    disposableDatabaseConfig(process.env);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Data-fix integration target validation failed.");
    process.exitCode = 1;
  }
}
