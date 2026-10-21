import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

import { DATA_CONTRACT_METADATA } from "../dataContractMetadata";
import type { DataContractMetadata, ExportViewDefinition, FieldDocumentation, RelationColumn } from "../types";
import { EXPORT_VIEWS } from "../views";
import { generateDictionaryContract, serializeDictionaryContract } from "./generateDictionaryContract";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const temporaryDirectories: string[] = [];
const execute = promisify(execFile);
const tsxCli = createRequire(import.meta.url).resolve("tsx/cli");

type MutableDocumentation = Omit<FieldDocumentation, "items"> & {
  items?: { rowGrain: string; fields: Record<string, MutableDocumentation> };
};
type MutableSchema = { columns: RelationColumn[] };
type Fixture = {
  sourceTablePurposes: Record<string, string>;
  views: Record<string, Omit<ExportViewDefinition, "schema" | "collectionSchemas"> & {
    schema: MutableSchema;
    collectionSchemas: Record<string, MutableSchema>;
  }>;
  metadata: Record<string, Omit<DataContractMetadata, "fields" | "keyColumns"> & {
    keyColumns: string[];
    fields: Record<string, MutableDocumentation>;
  }>;
};

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })
  ));
});

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "dictionary-contract-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

function collection(): MutableDocumentation {
  return {
    description: "Report-shaped child rows; missing collections are [].",
    nullable: false,
    items: {
      rowGrain: "One row per child record.",
      fields: {
        label: { description: "Display label.", nullable: true },
        parent_id: { description: "Parent identifier.", nullable: false },
      },
    },
  };
}

function fixture(): Fixture {
  return {
    sourceTablePurposes: { private_table: "Fixture source context." },
    views: {
      sample: {
        query: "SELECT private_sql FROM private_table",
        orderBy: ["id"],
        baseTables: ["private_table"],
        schema: {
          columns: [
            { name: "id", duckdbType: "UUID" },
            { name: "children", duckdbType: "JSON" },
            { name: "amount", duckdbType: "DECIMAL(18,2)" },
          ],
        },
        collectionSchemas: {
          children: {
            columns: [
              { name: "parent_id", duckdbType: "UUID" },
              { name: "label", duckdbType: "VARCHAR" },
            ],
          },
        },
      },
    },
    metadata: {
      sample: {
        description: "Fixture report.",
        rowGrain: "One row per parent.",
        keyColumns: ["id"],
        fields: {
          amount: { description: "Reported amount.", nullable: true },
          children: collection(),
          id: {
            notes: "Stable identity.",
            format: "UUID",
            sourceReport: "Overview",
            nullable: false,
            description: "Parent identifier.",
          },
        },
      },
    },
  };
}

function serialize(definition: Fixture): string {
  return serializeDictionaryContract(definition.views, definition.metadata, definition.sourceTablePurposes);
}

describe("serializeDictionaryContract", () => {
  it("builds a sorted contract from views and docs", () => {
    const definition = fixture();
    definition.views.sample.baseTables = ["shared_source", "private_table", "shared_source"];
    definition.sourceTablePurposes.shared_source = "Shared source context.";
    const views = { zebra: definition.views.sample, alpha: definition.views.sample };
    const metadata = { zebra: definition.metadata.sample, alpha: definition.metadata.sample };
    const dataset = {
      description: "Fixture report.",
      rowGrain: "One row per parent.",
      keyColumns: ["id"],
      columns: [
        {
          name: "id", duckdbType: "UUID", description: "Parent identifier.", nullable: false,
          sourceReport: "Overview", format: "UUID", notes: "Stable identity.",
        },
        {
          name: "children", duckdbType: "JSON", description: collection().description, nullable: false,
          items: {
            rowGrain: "One row per child record.",
            columns: [
              { name: "parent_id", duckdbType: "UUID", description: "Parent identifier.", nullable: false },
              { name: "label", duckdbType: "VARCHAR", description: "Display label.", nullable: true },
            ],
          },
        },
        { name: "amount", duckdbType: "DECIMAL(18,2)", description: "Reported amount.", nullable: true },
      ],
      sourceTables: [
        { name: "private_table", purpose: "Fixture source context." },
        { name: "shared_source", purpose: "Shared source context." },
      ],
    };
    expect(JSON.parse(serializeDictionaryContract(views, metadata, definition.sourceTablePurposes))).toEqual({
      formatVersion: 2,
      datasets: [{ name: "alpha", ...dataset }, { name: "zebra", ...dataset }],
    });
  });

  it("is byte-stable when top-level and nested metadata insertion order changes", () => {
    const first = fixture();
    const second = fixture();
    second.metadata.sample.fields = Object.fromEntries(Object.entries(second.metadata.sample.fields).reverse());
    second.metadata.sample.fields.children.items!.fields = Object.fromEntries(
      Object.entries(second.metadata.sample.fields.children.items!.fields).reverse()
    );
    second.metadata.sample.fields.id = {
      description: "Parent identifier.", nullable: false, sourceReport: "Overview",
      format: "UUID", notes: "Stable identity.",
    };
    expect(serialize(first)).toBe(serialize(second));
  });

  it("serializes deeply frozen registries without mutating them", () => {
    const definition = fixture();
    function freeze(value: object): void {
      Object.values(value).forEach((child) => {
        if (child !== null && typeof child === "object") freeze(child);
      });
      Object.freeze(value);
    }
    freeze(definition);
    expect(() => serialize(definition)).not.toThrow();
  });

  it("rejects a contract without any datasets", () => {
    expect(() => serializeDictionaryContract({}, {}, {})).toThrow(/at least one dataset/);
  });

  const invalidFixtures: [string, (definition: Fixture) => void, RegExp][] = [
    ["metadata for a dataset without a view", (d) => { d.metadata.extra = d.metadata.sample; }, /Dataset metadata keys.*extra: extra/],
    ["field documentation that doesn't match the schema", (d) => {
      delete d.metadata.sample.fields.amount;
      d.metadata.sample.fields.extra = { description: "Extra.", nullable: true };
    }, /sample metadata keys.*missing: amount; extra: extra/],
    ["child documentation that doesn't match the collection schema", (d) => {
      delete d.metadata.sample.fields.children.items!.fields.label;
      d.metadata.sample.fields.children.items!.fields.extra = { description: "Extra.", nullable: true };
    }, /sample\.children\[] metadata keys.*missing: label; extra: extra/],
    ["duplicate columns", (d) => { d.views.sample.schema.columns.push(d.views.sample.schema.columns[0]); }, /duplicate column name: id/],
    ["an empty collection schema", (d) => { d.views.sample.collectionSchemas.children.columns = []; }, /children\[] schema must be a nonempty columns array/],
    ["a JSON column without items", (d) => { delete d.metadata.sample.fields.children.items; }, /sample\.children JSON column must have items/],
    ["a JSON column without a collection schema", (d) => { delete d.views.sample.collectionSchemas.children; }, /sample\.children JSON column must have a collection schema/],
    ["a scalar column with items", (d) => { d.metadata.sample.fields.id.items = collection().items; }, /sample\.id scalar column must not have items/],
    ["a scalar column with a collection schema", (d) => { d.views.sample.collectionSchemas.id = d.views.sample.collectionSchemas.children; }, /sample\.id scalar column must not have a collection schema/],
    ["a collection schema for an unknown column", (d) => { d.views.sample.collectionSchemas.unknown = d.views.sample.collectionSchemas.children; }, /sample\.unknown collection schema column does not exist/],
    ["a collection nested inside a collection", (d) => { d.views.sample.collectionSchemas.children.columns[1].duckdbType = "JSON"; }, /sample\.children\[]\.label nests a collection inside a collection/],
    ["empty key columns", (d) => { d.metadata.sample.keyColumns = []; }, /sample keyColumns must not be empty/],
    ["an unknown key column", (d) => { d.metadata.sample.keyColumns = ["unknown"]; }, /key column does not exist: unknown/],
    ["a duplicate key column", (d) => { d.metadata.sample.keyColumns = ["id", "id"]; }, /duplicate key column: id/],
    ["a nullable key column", (d) => { d.metadata.sample.keyColumns = ["amount"]; }, /key column must not be nullable: amount/],
    ["source purposes that don't match baseTables", (d) => { d.sourceTablePurposes = { extra_table: "Extra." }; }, /Source table purposes keys.*missing: private_table; extra: extra_table/],
    ["a blank field description", (d) => { d.metadata.sample.fields.children.items!.fields.parent_id.description = "\t"; }, /sample\.children\[]\.parent_id description must be a nonempty string/],
    ["a blank row grain", (d) => { d.metadata.sample.fields.children.items!.rowGrain = " "; }, /sample\.children items rowGrain must be a nonempty string/],
    ["a blank purpose", (d) => { d.sourceTablePurposes.private_table = ""; }, /private_table purpose must be a nonempty string/],
  ];

  it.each(invalidFixtures)("rejects %s", (_name, mutate, message) => {
    const definition = fixture();
    mutate(definition);
    expect(() => serialize(definition)).toThrow(message);
  });
});

describe("generateDictionaryContract", () => {
  it("keeps the committed contract fresh", async () => {
    await expect(generateDictionaryContract(EXPORT_VIEWS, DATA_CONTRACT_METADATA, { check: true })).resolves.not.toThrow();
  });

  it("writes the contract, creating missing directories", async () => {
    const outputPath = join(await temporaryDirectory(), "nested", "contract.json");
    const definition = fixture();
    await generateDictionaryContract(definition.views, definition.metadata, { outputPath, sourceTablePurposes: definition.sourceTablePurposes });
    expect(await readFile(outputPath, "utf8")).toBe(serialize(definition));
  });

  it("passes check on identical bytes without rewriting", async () => {
    const outputPath = join(await temporaryDirectory(), "contract.json");
    const definition = fixture();
    await writeFile(outputPath, serialize(definition));
    const before = await stat(outputPath);
    await generateDictionaryContract(definition.views, definition.metadata, { outputPath, check: true, sourceTablePurposes: definition.sourceTablePurposes });
    expect((await stat(outputPath)).mtimeMs).toBe(before.mtimeMs);
  });

  it("fails check on a stale file without rewriting it", async () => {
    const outputPath = join(await temporaryDirectory(), "contract.json");
    const definition = fixture();
    await writeFile(outputPath, "stale\n");
    await expect(generateDictionaryContract(definition.views, definition.metadata, {
      outputPath, check: true, sourceTablePurposes: definition.sourceTablePurposes,
    })).rejects.toThrow(/contract is stale/);
    expect(await readFile(outputPath, "utf8")).toBe("stale\n");
  });

  it("fails check on a missing file without creating it", async () => {
    const outputPath = join(await temporaryDirectory(), "missing", "contract.json");
    const definition = fixture();
    await expect(generateDictionaryContract(definition.views, definition.metadata, {
      outputPath, check: true, sourceTablePurposes: definition.sourceTablePurposes,
    })).rejects.toThrow(/contract is missing/);
    await expect(stat(dirname(outputPath))).rejects.toMatchObject({ code: "ENOENT" });
  });
});

describe("dictionary CLI", () => {
  it("exits 1 for --check on a stale file and leaves it untouched", async () => {
    const directory = await temporaryDirectory();
    const outputPath = join(directory, "contract.json");
    await writeFile(outputPath, "stale");
    await expect(execute(process.execPath, [
      tsxCli,
      join(scriptsDirectory, "generateDictionaryContract.ts"),
      "--check", "--output", outputPath,
    ], { cwd: directory })).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining("contract is stale") });
    expect(await readFile(outputPath, "utf8")).toBe("stale");
  });
});
