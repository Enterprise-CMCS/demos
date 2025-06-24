// (entry point for Lambda)
import path from "path";
import { fileURLToPath } from "url";

import { scanWithClamAV } from "./scanner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const scanFile = async (event) => {
  const filePath = event?.filePath;

  if (!filePath) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing filePath in request body" }),
    };
  }

  const binary = path.resolve(__dirname, "clamav/clamscan.linux-amd64");
  const db = path.resolve(__dirname, "clamav");
  const target = path.resolve(__dirname, filePath);

  try {
    const result = await scanWithClamAV(target, db, binary);
    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.toString() }),
    };
  }
};
