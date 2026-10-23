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

export interface FieldDocumentation {
  description: string;
  nullable: boolean;
  sourceReport?: string;
  format?: string;
  notes?: string;
  items?: {
    rowGrain: string;
    fields: Readonly<Record<string, FieldDocumentation>>;
  };
}

export interface DataContractMetadata {
  description: string;
  rowGrain: string;
  keyColumns: readonly string[];
  fields: Readonly<Record<string, FieldDocumentation>>;
}

export type DictionaryColumn = RelationColumn & Omit<FieldDocumentation, "items"> & {
  items?: {
    rowGrain: string;
    columns: readonly DictionaryColumn[];
  };
};

export interface ExportedRelation {
  relation: string;
  rowCount: number;
}
