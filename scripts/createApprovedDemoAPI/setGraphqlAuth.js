import fs from "node:fs/promises";
import path from "node:path";

const ENV_PATH = new URL("./.env", import.meta.url);

function parseArgs(argv) {
  const args = {
    cookieFile: null,
    cookieHeader: null,
    idToken: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cookie-file") {
      args.cookieFile = argv[i + 1] ?? null;
      i += 1;
      continue;
    }
    if (arg === "--cookie-header") {
      args.cookieHeader = argv[i + 1] ?? null;
      i += 1;
      continue;
    }
    if (arg === "--id-token") {
      args.idToken = argv[i + 1] ?? null;
      i += 1;
      continue;
    }
  }

  return args;
}

function looksLikeJwt(value) {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}

function normalizeCookieHeader(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase().startsWith("cookie:")) {
    return trimmed.slice("cookie:".length).trim();
  }
  return trimmed;
}

function parseNetscapeCookieFile(raw) {
  const pairs = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("\t");
    if (parts.length >= 7) {
      const name = parts[5]?.trim();
      const value = parts[6]?.trim();
      if (name && value) pairs.push(`${name}=${value}`);
    }
  }
  return pairs.length ? pairs.join("; ") : "";
}

function tryParseJsonCookieExport(raw) {
  const trimmed = raw.trim();
  if (!trimmed || (trimmed[0] !== "[" && trimmed[0] !== "{")) {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed);
    const items = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.cookies)
        ? parsed.cookies
        : [];

    const pairs = [];
    for (const item of items) {
      const name = item?.name?.toString?.().trim?.();
      const value = item?.value?.toString?.().trim?.();
      if (name && value) {
        pairs.push(`${name}=${value}`);
      }
    }

    return pairs.length ? pairs.join("; ") : "";
  } catch {
    return "";
  }
}

function inferCookieHeaderFromRaw(raw) {
  const jsonCookies = tryParseJsonCookieExport(raw);
  if (jsonCookies) return jsonCookies;

  const netscapeCookies = parseNetscapeCookieFile(raw);
  if (netscapeCookies) return netscapeCookies;

  const trimmed = raw.trim();
  if (!trimmed) return "";

  const cookieHeaderMatch = trimmed.match(/(?:^|\n)cookie\s*:\s*(.+)/i);
  if (cookieHeaderMatch?.[1]) {
    return normalizeCookieHeader(cookieHeaderMatch[1]);
  }

  if (trimmed.includes("id_token=") || trimmed.includes("access_token=")) {
    return normalizeCookieHeader(trimmed.replace(/\r?\n/g, " "));
  }

  return "";
}

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

async function resolveAuthInput(args) {
  if (args.cookieHeader?.trim()) {
    return {
      cookieHeader: normalizeCookieHeader(args.cookieHeader),
      idToken: "",
      source: "--cookie-header",
    };
  }

  if (args.idToken?.trim()) {
    return {
      cookieHeader: "",
      idToken: args.idToken.trim(),
      source: "--id-token",
    };
  }

  if (!args.cookieFile?.trim()) {
    throw new Error(
      "Provide --cookie-file <path>, --cookie-header <value>, or --id-token <jwt>."
    );
  }

  const cookieFilePath = path.resolve(process.cwd(), args.cookieFile);
  const raw = await fs.readFile(cookieFilePath, "utf8");
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error(`Cookie file is empty: ${cookieFilePath}`);
  }

  if (looksLikeJwt(trimmed)) {
    return {
      cookieHeader: "",
      idToken: trimmed,
      source: `--cookie-file ${cookieFilePath}`,
    };
  }

  const inferredCookieHeader = inferCookieHeaderFromRaw(raw);
  if (!inferredCookieHeader) {
    throw new Error(
      `Could not parse cookie data from ${cookieFilePath}. Expected cookie header text, Netscape cookie export, JSON cookie export, or raw JWT.`
    );
  }

  return {
    cookieHeader: inferredCookieHeader,
    idToken: "",
    source: `--cookie-file ${cookieFilePath}`,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const auth = await resolveAuthInput(args);
  const envText = await fs.readFile(ENV_PATH, "utf8");

  let nextEnv = envText;
  nextEnv = setEnvValue(nextEnv, "APPROVED_DEMO_GRAPHQL_COOKIE", auth.cookieHeader);
  nextEnv = setEnvValue(nextEnv, "APPROVED_DEMO_ID_TOKEN", auth.idToken);

  await fs.writeFile(ENV_PATH, nextEnv, "utf8");

  const mode = auth.cookieHeader ? "cookie header" : "id token";
  console.log(`Updated createApprovedDemoAPI/.env with ${mode} from ${auth.source}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
