import { exec } from "child_process";

export function scanWithClamAV(scanPath, dbPath, binaryPath) {
  return new Promise((resolve, reject) => {
    exec(
      `${binaryPath} --database=${dbPath} ${scanPath}`,
      (err, stdout, stderr) => {
        if (err && !stdout.includes("FOUND")) {
          return reject(err);
        }
        resolve(stdout.includes("FOUND") ? "Infected" : "Clean");
      }
    );
  });
}
