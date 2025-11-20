import https from "https";

import { getSecret } from "../lib/getSecret";
import { Client } from "pg";
import { runMigration } from "./runMigration";

export function fetchCACert(url: string): Promise<string> {
  return new Promise((res, rej) => {
    https
      .get(url, (resp) => {
        if (resp.statusCode !== 200) {
          rej(new Error(`Failed to fetch: ${resp.statusCode}`));
          return;
        }

        let data = "";
        resp.on("data", (chunk) => (data += chunk));
        resp.on("end", () => res(data));
      })
      .on("error", rej);
  });
}

export async function testMigration(environment: string, dbname?: string) {
  if (!dbname) {
    console.error("you must specify a database name");
    return 1;
  }

  if (dbname == "demos") {
    console.error("testMigration cannot be run against 'demos' db");
    return 1;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
    console.error("invalid database name");
    return 1;
  }
  const safeName = dbname

  console.log("test-migration:", environment);
  const caCert = await fetchCACert("https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem");
  const secretDataRaw = await getSecret(`demos-${environment}-rds-admin`);
  if (!secretDataRaw) {
    console.error(`unable to retrieve secret data for demos-${environment}-rds-admin`);
    return 1;
  }

  console.log("secret retrieved successfully");

  const secretData = JSON.parse(secretDataRaw);

  // run migration
  let migrationStatus: number | null = -1;
  try {
    console.log("About to run the migrations....");
    migrationStatus = await runMigration(environment, safeName, secretData);
  } catch (err) {
    console.error("migrationStatus error", err);
    return 1;
  }

  // clean up
  const dbUrl = `postgresql://${secretData.username}:${secretData.password}@${secretData.host}:${secretData.port}/demos`;
  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: true,
      ca: caCert,
    },
  });

  try {
    await client.connect();
    const res = await client.query(`DROP DATABASE ${dbname};`); // NOSONAR - parameterization is not possible for this query
    console.log("command:", res.command);
    console.log(`database '${dbname} dropped successfully`);
  } catch (err) {
    console.error("failed to drop database:", err);
  } finally {
    await client.end();
  }
  if (migrationStatus != 0) {
    console.error("\n\n`prisma migration deploy` exited with a non-zero exit code");
    return migrationStatus;
  }

  return 0;
}
