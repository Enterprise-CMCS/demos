import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ENV_PATH = new URL("./.env", import.meta.url);
const COOKIE_PATH = new URL("./cookie.txt", import.meta.url);
const ENV_FILE = fileURLToPath(ENV_PATH);
const COOKIE_FILE = fileURLToPath(COOKIE_PATH);

function escapeEnvValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function setEnvValue(envText, key, value) {
  const line = `${key}="${escapeEnvValue(value)}"`;
  const matcher = new RegExp(`^${key}=.*$`, "m");
  if (matcher.test(envText)) {
    return envText.replace(matcher, line);
  }

  const suffix = envText.endsWith("\n") ? "" : "\n";
  return `${envText}${suffix}${line}\n`;
}

function getCookieHeader(raw) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  const cookieHeaderLine = lines.find((line) => /^cookie\s*:/i.test(line));
  if (cookieHeaderLine) {
    return cookieHeaderLine.replace(/^cookie\s*:\s*/i, "").trim();
  }

  return lines.join(" ");
}

function extractIdToken(cookieHeader) {
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const name = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (name === "id_token" && value) {
      return value;
    }
  }

  return "";
}

async function readRequiredFile(fileUrl, filePath, setupMessage) {
  try {
    return await fs.readFile(fileUrl, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`${filePath} does not exist. ${setupMessage}`);
    }

    throw error;
  }
}

async function main() {
  const cookieText = await readRequiredFile(
    COOKIE_PATH,
    COOKIE_FILE,
    "Create it with the full Cookie request header."
  );
  const cookieHeader = getCookieHeader(cookieText);
  const idToken = extractIdToken(cookieHeader);
  if (!idToken) {
    throw new Error(
      `Could not find an id_token cookie in ${COOKIE_FILE}. Paste a full Cookie request header into that file, then run npm run create:demo again.`
    );
  }

  const envText = await readRequiredFile(
    ENV_PATH,
    ENV_FILE,
    "Create it from scripts/createApprovedDemoAPI/.env.example."
  );

  const nextEnv = setEnvValue(envText, "APPROVED_DEMO_ID_TOKEN", idToken);

  await fs.writeFile(ENV_PATH, nextEnv, "utf8");
  console.log(`Updated createApprovedDemoAPI/.env with id_token from ${COOKIE_FILE}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
