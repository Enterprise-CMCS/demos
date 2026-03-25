import { getDbPool, getDbSchema } from "./db";

export type DocumentS3Location = {
  key: string;
  documentId: string;
  applicationId: string;
};

export type UipathMessage = {
  s3Key?: string;
  documentId?: string;
  applicationId?: string;
};

function decodeS3Key(key: string): string {
  return decodeURIComponent(key.replaceAll("+", " "));
}

export function parseUiPathMessage(body: string): UipathMessage {
  const parsed = JSON.parse(body) as Record<string, unknown>;
  const records = parsed?.Records as Array<any> | undefined;

  if (Array.isArray(records) && records[0]?.s3?.object?.key) {
    const record = records[0];
    return {
      s3Key: decodeS3Key(record.s3.object.key),
    };
  }

  const s3Key = parsed?.s3Key as string | undefined;
  const documentId = parsed?.documentId as string | undefined;
  const applicationId = parsed?.applicationId as string | undefined;

  const message: UipathMessage = {};
  if (s3Key) {
    message.s3Key = s3Key;
  }
  if (documentId) {
    message.documentId = documentId;
  }
  if (applicationId) {
    message.applicationId = applicationId;
  }
  return message;
}

function parseDocumentS3Path(s3Path: string): { key: string } {
  if (s3Path.startsWith("s3://")) {
    const pathWithoutScheme = s3Path.slice(5);
    const separatorIndex = pathWithoutScheme.indexOf("/");
    if (separatorIndex <= 0 || separatorIndex === pathWithoutScheme.length - 1) {
      throw new Error(`Invalid document s3_path value: ${s3Path}`);
    }

    return {
      key: pathWithoutScheme.slice(separatorIndex + 1),
    };
  }

  return { key: s3Path.replace(/^\/+/, "") };
}

function parseDocumentAndApplicationFromKey(s3Key: string): { documentId: string; applicationId: string } {
  const normalizedKey = s3Key.replace(/^\/+/, "");
  const keySegments = normalizedKey.split("/");
  if (keySegments.length !== 2 || !keySegments[0] || !keySegments[1]) {
    throw new Error(`Invalid S3 key format for document lookup: ${s3Key}`);
  }

  const [applicationId, documentId] = keySegments;

  return { documentId, applicationId };
}

type DocumentRow = {
  id: string;
  application_id: string;
  s3_path: string;
};

export async function parseDocumentFromId(
  documentId?: string,
  expectedApplicationId?: string
): Promise<DocumentS3Location> {
  if (!documentId) {
    throw new Error("documentId is required.");
  }

  const schema = getDbSchema();
  const pool = await getDbPool();
  const result = await pool.query<DocumentRow>(
    `select id, application_id, s3_path from ${schema}.document where id = $1 limit 1;`,
    [documentId]
  );
  const row = result.rows[0];
  if (!row?.s3_path) {
    throw new Error(`No document found for id ${documentId}.`);
  }

  if (expectedApplicationId && row.application_id !== expectedApplicationId) {
    throw new Error(
      `Document ${documentId} is associated with application ${row.application_id}, not ${expectedApplicationId}.`
    );
  }

  const location = parseDocumentS3Path(row.s3_path);
  return {
    key: location.key,
    documentId: row.id,
    applicationId: row.application_id,
  };
}

export async function parseDocumentFromS3Key(s3Key?: string): Promise<DocumentS3Location | null> {
  if (!s3Key) {
    return null;
  }

  const { documentId, applicationId } = parseDocumentAndApplicationFromKey(s3Key);
  return parseDocumentFromId(documentId, applicationId);
}
