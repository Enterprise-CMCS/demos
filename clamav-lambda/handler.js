// (entry point for Lambda)
import path from "path";
import { fileURLToPath } from "url";

import { scanWithClamAV } from "./scanner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const scanFile = async () => {
  const binary = path.resolve(__dirname, "clamav/clamscan.linux-amd64");
  const db = path.resolve(__dirname, "clamav");
  const target = path.resolve(__dirname, "scan-test/hello.txt");

  const result = await scanWithClamAV(target, db, binary);
  return {
    statusCode: 200,
    body: JSON.stringify({ result }),
  };
};
