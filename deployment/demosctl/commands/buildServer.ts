import path from "node:path";

import { runShell } from "../lib/runCommand";

export async function buildServer() {
  const serverPath = path.join("..", "server");
  return await runShell("server-build", "npm ci && npm run build:ci", {
    cwd: serverPath,
  });
}
