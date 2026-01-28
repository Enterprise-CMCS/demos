import fs from "fs";
import path from "path";

const DEFAULT_LOG_PATH = "uipath.log";

function ensureParentDir(logPath) {
  const dir = path.dirname(logPath);
  if (dir && dir !== ".") {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function createLogFile(logPath = DEFAULT_LOG_PATH, { overwrite = false } = {}) {
  ensureParentDir(logPath);
  if (overwrite || !fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, "");
  }
  return logPath;
}

export function appendToLog(message, logPath = DEFAULT_LOG_PATH) {
  ensureParentDir(logPath);
  const output = typeof message === "string" ? message : JSON.stringify(message);
  fs.appendFileSync(logPath, output + "\n");
}

export function log(message, logPath = DEFAULT_LOG_PATH) {
  console.log(message);
  appendToLog(message, logPath);
}
