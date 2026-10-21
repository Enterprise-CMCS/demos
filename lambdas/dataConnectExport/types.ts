export type DuckDBType =
  | "BIGINT"
  | "BOOLEAN"
  | "DATE"
  | "DOUBLE"
  | "FLOAT"
  | "INTEGER"
  | "JSON"
  | "SMALLINT"
  | "TIMESTAMP_MS"
  | "TIMESTAMPTZ"
  | "UUID"
  | "VARCHAR"
  | `DECIMAL(${number},${number})`;

export interface RelationColumn {
  name: string;
  duckdbType: DuckDBType;
}

export interface RelationSchema {
  columns: readonly RelationColumn[];
}

export interface ExportViewDefinition {
  /** Query is a reviewed SQL constant. Never build this from runtime input. */
  query: string;
  /** Output columns the exported rows are sorted by, applied to the outer COPY query. */
  orderBy: readonly string[];
  baseTables: string[];
  schema: RelationSchema;
  collectionSchemas?: Readonly<Record<string, RelationSchema>>;
}

export interface ExportedRelation {
  relation: string;
  rowCount: number;
}
