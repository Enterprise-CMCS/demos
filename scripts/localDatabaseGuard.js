const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "db"]);
const LOCAL_DATABASE_NAMES = new Set(["demos"]);

export function getLocalDatabaseUrl(fallbackDatabaseUrl) {
  const databaseUrl = process.env.DATABASE_URL ?? fallbackDatabaseUrl;
  assertLocalDatabaseUrl(databaseUrl);
  return databaseUrl;
}

export function assertLocalDatabaseUrl(databaseUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL for local approved demo scripts.");
  }

  const hostname = parsedUrl.hostname.replace(/^\[|\]$/g, "");
  const databaseName = parsedUrl.pathname.replace(/^\//, "");

  if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol)) {
    throw new Error(
      `Approved demo scripts require a PostgreSQL DATABASE_URL; received ${parsedUrl.protocol}.`
    );
  }

  if (!LOCAL_DATABASE_HOSTS.has(hostname)) {
    throw new Error(
      `Refusing to run approved demo script against non-local database host ${hostname}. ` +
        `Allowed local hosts: ${Array.from(LOCAL_DATABASE_HOSTS).join(", ")}.`
    );
  }

  if (!LOCAL_DATABASE_NAMES.has(databaseName)) {
    throw new Error(
      `Refusing to run approved demo script against database ${databaseName}. ` +
        `Allowed local databases: ${Array.from(LOCAL_DATABASE_NAMES).join(", ")}.`
    );
  }
}
