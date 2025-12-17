import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { Pool } from "pg";
import { log } from "./log";

const secrets = new SecretsManagerClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.AWS_ENDPOINT_URL,
});

let poolPromise: Promise<Pool> | null = null;

async function resolveDatabaseUrl(): Promise<string> {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const secretId = process.env.DATABASE_SECRET_ARN;
  if (!secretId) {
    throw new Error("DATABASE_URL or DATABASE_SECRET_ARN is required to connect to the database.");
  }

  const result = await secrets.send(new GetSecretValueCommand({ SecretId: secretId }));
  const secretString = result.SecretString;
  if (!secretString) {
    throw new Error(`Secret ${secretId} did not return a SecretString.`);
  }

  try {
    const parsed = JSON.parse(secretString) as { url?: string; connectionString?: string };
    const url = parsed.url ?? parsed.connectionString;
    if (!url) {
      throw new Error("Secret did not contain url or connectionString");
    }
    return url;
  } catch {
    return secretString;
  }
}

export interface QuestionPrompt {
  id: string;
  question: string;
  fieldType?: string;
  multiValued?: boolean;
}

export async function getDbPool(): Promise<Pool> {
  if (!poolPromise) {
    poolPromise = (async () => {
      const connectionString = await resolveDatabaseUrl();
      log.info("Connecting to database for UiPath questions");
      return new Pool({ connectionString, max: 2 });
    })();
  }
  return poolPromise;
}

export async function fetchQuestionPrompts(): Promise<QuestionPrompt[]> {
  const questionQuery =
    "select question->>'id' as id, question->>'question' as question, " +
    "question->>'fieldType' as field_type, " +
    "(question->>'multiValued')::boolean as multi_valued " +
    "from document_understanding_questions";

  const pool = await getDbPool();
  const client = await pool.connect();
  try {
    const result = await client.query(questionQuery);
    return result.rows
      .map((row, idx) => ({
        id: String(row.id ?? row.prompt_id ?? row.question_id ?? idx),
        question: String(row.question ?? row.prompt ?? row.text ?? ""),
        fieldType: row.field_type ?? row.type ?? "Text",
        multiValued: Boolean(row.multi_valued ?? row.multivalued ?? false),
      }))
      .filter((q) => q.question);
  } finally {
    client.release();
  }
}
