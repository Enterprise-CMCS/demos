import path from "path";

import { runShell } from "../lib/runCommand";

export async function buildServer() {
  const serverPath = path.join("..", "server");
  const out = await runShell("server-build", "npm run build:ci", {
    cwd: serverPath,
  });

  if (out != 0) {
    process.exit(30);
  }
}
