import path from "node:path";

import { runShell } from "../lib/runCommand";

export async function buildServer(environment: string) {
  const serverPath = path.join("..", "server");
  return await runShell(
    "server-build",
    `npm ci && npm run build:ci -- --define:process.env.CURRENT_ENV='"${environment}"'`,
    {
      cwd: serverPath,
    }
  );
}
