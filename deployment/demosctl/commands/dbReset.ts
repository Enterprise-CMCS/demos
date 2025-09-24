import path from "path";
import fs from "fs";

import { getSecret } from "../lib/getSecret";
import { runShell } from "../lib/runCommand";

interface DBData {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

export async function dbReset(environment: string, absPath: string = "") {
  console.log(environment);
  const dbname = "demos";

  if (!["dev", "test"].includes(environment)) {
    console.error("db resets can only be run against the dev or test database");
    return 1;
  }

  const secretDataRaw = await getSecret(`demos-${environment}-rds-admin`);
  if (!secretDataRaw) {
    console.error(`unable to retrieve secret data for demos-${environment}-rds-admin`);
    return 1;
  }
  console.log("secret retrieved successfully");
  const secretData = { ...JSON.parse(secretDataRaw), dbname } as DBData;
  if (!["username", "password", "host", "port", "dbname"].every((key) => Object.hasOwn(secretData, key))) {
    console.error("db secret data not found");
    return 1;
  }

  const dbUrl = `postgresql://${secretData.username}:${secretData.password}@${secretData.host}:${secretData.port}/${dbname}?schema=demos_app`;
  let serverPath = path.join("..", "server");
  if (absPath != "") {
    serverPath = path.join(path.resolve(absPath), "server");
    if (!fs.existsSync(serverPath)) {
      console.error(`the specified path does not exist: ${serverPath}`);
      return 1;
    }
  }

  return await runShell("db-reset", "npm ci && npm run seed:reset", {
    cwd: serverPath,
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
      ALLOW_SEED: "true",
    },
  });
}
