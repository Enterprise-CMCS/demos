import { getDbPool, getDbSchema } from "./db";

export type DocumentS3Location = {
  key: string;
};

export type UipathMessage = {
  s3Key?: string;
  documentId?: string;
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

  const message: UipathMessage = {};
  if (s3Key) {
    message.s3Key = s3Key;
  }
  if (documentId) {
    message.documentId = documentId;
  }
  return message;
}

function parseDocumentS3Path(s3Path: string): DocumentS3Location {
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

export async function parseDocumentFromId(documentId?: string): Promise<DocumentS3Location | null> {
  if (!documentId) {
    return null;
  }

  const schema = getDbSchema();
  const pool = await getDbPool();
  const result = await pool.query<{ s3_path: string }>(
    `select s3_path from ${schema}.document where id = $1 limit 1;`,
    [documentId]
  );
  const s3Path = result.rows[0]?.s3_path;
  if (!s3Path) {
    throw new Error(`No document found for id ${documentId}.`);
  }

  return parseDocumentS3Path(s3Path);
}
