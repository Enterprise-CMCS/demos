import path from "node:path";

import { runShell } from "../lib/runCommand";

export async function buildServer(environment: string) {
  const serverPath = path.join("..", "server");

  if (!(/^[a-z]+$/.test(environment))) {
    throw new Error("invalid environment name");
  }

  return await runShell(
    "server-build",
    `npm ci && npm run build:ci -- --define:process.env.CURRENT_ENV='"${environment}"'`,
    {
      cwd: serverPath,
    },
  );
}
