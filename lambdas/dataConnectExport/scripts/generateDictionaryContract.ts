import { realpathSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DATA_CONTRACT_METADATA } from "../dataContractMetadata";
import { SOURCE_TABLE_PURPOSES } from "../sourceTablePurposes";
import type { DataContractMetadata, DictionaryColumn, ExportViewDefinition, FieldDocumentation, RelationColumn, RelationSchema } from "../types";
import { EXPORT_VIEWS } from "../views";

export const DEFAULT_OUTPUT_PATH = fileURLToPath(
  new URL("../../../data/docs/dataconnect_reporting_contract.json", import.meta.url)
);

export interface GenerateDictionaryContractOptions {
  outputPath?: string;
  check?: boolean;
  sourceTablePurposes?: Readonly<Record<string, string>>;
}

// Shapes, keys and DuckDB types are enforced by the typed registries (npm run lint); these checks
// cover only what the types cannot express.
function requireText(value: string, context: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${context} must be a nonempty string`);
  }
}

function columnNames(columns: readonly RelationColumn[], context: string): Set<string> {
  if (columns.length === 0) {
    throw new Error(`${context} must be a nonempty columns array`);
  }
  const names = new Set<string>();
  for (const column of columns) {
    requireText(column.name, `${context} column name`);
    if (names.has(column.name)) {
      throw new Error(`${context} has duplicate column name: ${column.name}`);
    }
    names.add(column.name);
  }
  return names;
}

function requireCoverage(names: ReadonlySet<string>, fields: object, context: string): void {
  const missing = [...names].filter((field) => !Object.hasOwn(fields, field));
  const extra = Object.keys(fields).filter((field) => !names.has(field));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `${context}; missing: ${missing.sort().join(", ")}; extra: ${extra.sort().join(", ")}`
    );
  }
}

function documentedColumns(
  schema: RelationSchema,
  fields: Readonly<Record<string, FieldDocumentation>>,
  context: string,
  collectionSchemas: Readonly<Record<string, RelationSchema>> = {},
  nested = false
): DictionaryColumn[] {
  const names = columnNames(schema.columns, `${context} schema`);
  requireCoverage(names, fields, `${context} metadata keys must exactly match schema columns`);
  for (const name of Object.keys(collectionSchemas)) {
    if (!names.has(name)) throw new Error(`${context}.${name} collection schema column does not exist`);
    if (schema.columns.find((column) => column.name === name)!.duckdbType !== "JSON") {
      throw new Error(`${context}.${name} scalar column must not have a collection schema`);
    }
  }
  return schema.columns.map((column) => documentedColumn(
    column, fields[column.name], `${context}.${column.name}`,
    Object.hasOwn(collectionSchemas, column.name) ? collectionSchemas[column.name] : undefined,
    nested
  ));
}

function documentedColumn(
  column: RelationColumn,
  documentation: FieldDocumentation,
  context: string,
  schema: RelationSchema | undefined,
  nested: boolean
): DictionaryColumn {
  requireText(documentation.description, `${context} description`);

  const result: DictionaryColumn = {
    name: column.name,
    duckdbType: column.duckdbType,
    description: documentation.description,
    nullable: documentation.nullable,
  };
  for (const key of ["sourceReport", "format", "notes"] as const) {
    if (documentation[key] !== undefined) result[key] = documentation[key];
  }

  if (column.duckdbType === "JSON" && nested) {
    throw new Error(`${context} nests a collection inside a collection`);
  }
  if (column.duckdbType === "JSON") {
    if (documentation.items === undefined) throw new Error(`${context} JSON column must have items`);
    if (schema === undefined) throw new Error(`${context} JSON column must have a collection schema`);
    requireText(documentation.items.rowGrain, `${context} items rowGrain`);
    result.items = {
      rowGrain: documentation.items.rowGrain,
      columns: documentedColumns(schema, documentation.items.fields, `${context}[]`, {}, true),
    };
  } else if (documentation.items !== undefined) {
    throw new Error(`${context} scalar column must not have items`);
  }
  return result;
}

export function serializeDictionaryContract(
  views: Readonly<Record<string, ExportViewDefinition>>,
  metadata: Readonly<Record<string, DataContractMetadata>>,
  sourceTablePurposes: Readonly<Record<string, string>>
): string {
  requireCoverage(new Set(Object.keys(views)), metadata, "Dataset metadata keys must exactly match export datasets");
  if (Object.keys(views).length === 0) {
    throw new Error("Export views must declare at least one dataset");
  }
  for (const [name, purpose] of Object.entries(sourceTablePurposes)) {
    requireText(purpose, `${name} purpose`);
  }
  const sourceNames = new Set<string>();
  const datasets = Object.keys(views).sort().map((name) => {
    const definition = views[name];
    for (const table of definition.baseTables) sourceNames.add(table);
    const sourceTables = [...new Set(definition.baseTables)].sort().map((table) => ({
      name: table,
      purpose: sourceTablePurposes[table],
    }));
    const names = columnNames(definition.schema.columns, `${name} schema`);
    const dictionary = metadata[name];
    requireText(dictionary.description, `${name} description`);
    requireText(dictionary.rowGrain, `${name} rowGrain`);
    if (dictionary.keyColumns.length === 0) {
      throw new Error(`${name} keyColumns must not be empty`);
    }
    const keys = new Set<string>();
    for (const key of dictionary.keyColumns) {
      if (!names.has(key)) throw new Error(`${name} key column does not exist: ${key}`);
      if (keys.has(key)) throw new Error(`${name} has duplicate key column: ${key}`);
      keys.add(key);
    }
    const columns = documentedColumns(definition.schema, dictionary.fields, name, definition.collectionSchemas);
    for (const column of columns) {
      if (keys.has(column.name) && column.nullable) {
        throw new Error(`${name} key column must not be nullable: ${column.name}`);
      }
    }
    return {
      name,
      description: dictionary.description,
      rowGrain: dictionary.rowGrain,
      keyColumns: [...dictionary.keyColumns],
      columns,
      sourceTables,
    };
  });
  requireCoverage(sourceNames, sourceTablePurposes, "Source table purposes keys must exactly match declared source tables");
  return `${JSON.stringify({ formatVersion: 2, datasets }, null, 2)}\n`;
}

export async function generateDictionaryContract(
  views: Readonly<Record<string, ExportViewDefinition>> = EXPORT_VIEWS,
  metadata: Readonly<Record<string, DataContractMetadata>> = DATA_CONTRACT_METADATA,
  { outputPath = DEFAULT_OUTPUT_PATH, check = false, sourceTablePurposes = SOURCE_TABLE_PURPOSES }: GenerateDictionaryContractOptions = {}
): Promise<void> {
  const expected = Buffer.from(serializeDictionaryContract(views, metadata, sourceTablePurposes), "utf8");
  if (check) {
    let actual: Buffer;
    try {
      actual = await readFile(outputPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(`Dictionary contract is missing: ${outputPath}. Run npm run dictionary:contract.`);
      }
      throw error;
    }
    if (!actual.equals(expected)) {
      throw new Error(`Dictionary contract is stale: ${outputPath}. Run npm run dictionary:contract.`);
    }
    return;
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, expected);
}

async function main(args: string[]): Promise<void> {
  const options: GenerateDictionaryContractOptions = {};
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--check") {
      options.check = true;
    } else if (argument === "--output") {
      const output = args[++index];
      if (!output || output.startsWith("--")) throw new Error("--output requires a path");
      options.outputPath = resolve(output);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  await generateDictionaryContract(EXPORT_VIEWS, DATA_CONTRACT_METADATA, options);
}

// import.meta.url is the module's real path, so resolve symlinks in argv[1] too; otherwise a symlinked
// checkout skips main() and exits 0 without checking anything.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}