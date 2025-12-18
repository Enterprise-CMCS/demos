import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { Pool } from "pg";
import { log } from "./log";

const dbSchema = process.env.DB_SCHEMA || "demos_app";

const secrets = new SecretsManagerClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.AWS_ENDPOINT_URL ?? undefined,
});

let poolPromise: Promise<Pool> | null = null;

let databaseUrlCache = "";
let cacheExpiration = 0;

export async function getDatabaseUrl() {
  const now = Date.now();
  if (databaseUrlCache && cacheExpiration > now) {
    return databaseUrlCache;
  }

  const secretArn = process.env.DATABASE_SECRET_ARN;
  if (!secretArn) {
    throw new Error("DATABASE_SECRET_ARN is required to fetch the database connection string.");
  }

  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await secrets.send(command);

  if (!response.SecretString) {
    throw new Error(`The SecretString value is undefined for secret: ${secretArn}`);
  }
  const secretData = JSON.parse(response.SecretString);
  databaseUrlCache = `postgresql://${secretData.username}:${secretData.password}@${secretData.host}:${secretData.port}/${secretData.dbname}?schema=${dbSchema}`;
  cacheExpiration = now + 60 * 60 * 1000;

  return databaseUrlCache;
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
      const connectionString = await getDatabaseUrl();
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
    "from demos_app.document_understanding_questions";

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
