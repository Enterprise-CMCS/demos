import type { ParquetSchema } from "@dsnp/parquetjs";

export interface ColumnMeta {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  numericPrecision: number | null;
  numericScale: number | null;
}

export interface RelationSchema {
  parquetSchema: ParquetSchema;
  columns: ColumnMeta[];
}

export interface WrittenFile {
  relation: string;
  localPath: string;
  rowCount: number;
}
