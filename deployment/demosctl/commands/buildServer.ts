import path from "path";

import { runShell } from "../lib/runCommand";

export async function buildServer() {
  const serverPath = path.join("..", "server");
  await runShell("server-build", "npm run build:ci", {
    cwd: serverPath,
  });
}
