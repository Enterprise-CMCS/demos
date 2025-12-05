import fs from "fs";
import path from "path";

const DEFAULT_LOG_PATH = "uipath.log";

function ensureParentDir(logPath: string) {
  const dir = path.dirname(logPath);
  if (dir && dir !== ".") {
    fs.mkdirSync(dir, { recursive: true });
  }
}

interface LogFileOptions {
  overwrite?: boolean;
}

export function createLogFile(logPath: string = DEFAULT_LOG_PATH, { overwrite = false }: LogFileOptions = {}) {
  ensureParentDir(logPath);
  if (overwrite || !fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, "");
  }
  return logPath;
}

export function appendToLog(message: unknown, logPath: string = DEFAULT_LOG_PATH) {
  ensureParentDir(logPath);
  const output = typeof message === "string" ? message : JSON.stringify(message);
  fs.appendFileSync(logPath, `${output}\n`);
}

export function logToFile(message: unknown, logPath: string = DEFAULT_LOG_PATH) {
  console.log(message);
  appendToLog(message, logPath);
}
