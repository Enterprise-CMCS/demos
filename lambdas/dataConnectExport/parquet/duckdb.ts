import { DuckDBInstance, type DuckDBConnection } from "@duckdb/node-api";

export async function withDuckDBConnection<T>(
  callback: (connection: DuckDBConnection) => Promise<T>
): Promise<T> {
  const instance = await DuckDBInstance.create(":memory:");
  let connection: DuckDBConnection | undefined;

  try {
    connection = await instance.connect();
    return await callback(connection);
  } finally {
    try {
      connection?.closeSync();
    } finally {
      instance.closeSync();
    }
  }
}
