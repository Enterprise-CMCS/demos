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

export interface ExportedRelation {
  relation: string;
  rowCount: number;
}
