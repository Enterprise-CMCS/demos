import path from "path";

import { getSecret } from "../lib/getSecret";
import { runShell } from "../lib/runCommand";

interface DBData {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

export async function runMigration(environment: string, dbname: string = "demos", secretData?: DBData) {
  console.log(environment);
  if (!secretData) {
    const secretDataRaw = await getSecret(`demos-${environment}-rds-admin`);
    if (!secretDataRaw) {
      console.error(`unable to retrieve secret data for demos-${environment}-rds-admin`);
      process.exit(1);
    }
    console.log("secret retrieved successfully");
    secretData = { ...JSON.parse(secretDataRaw), dbname } as DBData;
    if (!["username", "password", "host", "port", "dbname"].every((key) => Object.hasOwn(secretData!, key))) {
      console.error("db secret data not found");
      process.exit(1);
    }
  }

  const dbUrl = `postgresql://${secretData.username}:${secretData.password}@${secretData.host}:${secretData.port}/${dbname}?schema=demos_app`;
  const serverPath = path.join("..", "server");
  return await runShell("server-build", "npm run migrate:deploy", {
    cwd: serverPath,
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
    },
  });
}
