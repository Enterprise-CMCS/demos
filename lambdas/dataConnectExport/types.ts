export interface ColumnMeta {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  numericPrecision: number | null;
  numericScale: number | null;
}

export interface RelationColumn {
  name: string;
  duckdbType: string;
}

export interface RelationSchema {
  columns: RelationColumn[];
}

export interface WrittenFile {
  relation: string;
  localPath: string;
  rowCount: number;
}
