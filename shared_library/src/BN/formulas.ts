import { strFromU8, unzipSync } from "fflate";
import { Parser } from "saxen";

export const FORMULA_SHEETS = ["Summary", "Program Spending Limits"] as const;
export const MAX_UNCOMPRESSED_BYTES = 256 * 1024 * 1024;
export type FormulaInfo = { formulaCells: Map<string, Set<string>>; fullCalcOnLoad: boolean };

export class FormulaReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaReadError";
  }
}

type OpenTagHandler = (name: string, attrs: () => Record<string, string>, decode: (text: string) => string) => void;

function parseXml(bytes: Uint8Array, open: OpenTagHandler, close?: (name: string) => void): void {
  const parser = new Parser();
  const fail = (error: Error) => { throw new FormulaReadError(error.message); };
  parser.on("error", fail);
  parser.on("warn", fail);
  parser.on("openTag", open);
  if (close) parser.on("closeTag", close);
  parser.parse(strFromU8(bytes));
}

function sheetPart(target: string): string {
  const parts: string[] = [];
  for (const part of (target.startsWith("/") ? target.slice(1) : `xl/${target}`).split("/")) {
    if (part === "..") {
      if (!parts.length) throw new FormulaReadError("Invalid worksheet relationship target.");
      parts.pop();
    } else if (part !== "." && part !== "") {
      parts.push(part);
    }
  }
  return parts.join("/");
}

export function readFormulaInfo(bytes: Uint8Array): FormulaInfo {
  try {
    let size = 0;
    const readParts = (names: Set<string>) => {
      const entries = unzipSync(bytes, {
        filter: (entry) => {
          if (!names.has(entry.name)) return false;
          size += entry.originalSize;
          if (size > MAX_UNCOMPRESSED_BYTES) {
            throw new FormulaReadError("Selected workbook parts exceed the uncompressed size limit.");
          }
          return true;
        },
      });
      for (const name of names) {
        if (!entries[name]) throw new FormulaReadError(`Missing workbook part "${name}".`);
      }
      return entries;
    };
    const workbookPart = "xl/workbook.xml";
    const relsPart = "xl/_rels/workbook.xml.rels";
    const metadata = readParts(new Set([workbookPart, relsPart]));
    const sheets = new Map<string, string>();
    let fullCalcOnLoad = false;
    parseXml(metadata[workbookPart]!, (name, attrs, decode) => {
      const tag = name.split(":").at(-1);
      if (tag === "sheet") {
        const attributes = attrs();
        const sheet = decode(attributes.name ?? "");
        if (FORMULA_SHEETS.some((wanted) => wanted === sheet)) {
          if (!attributes["r:id"] || sheets.has(sheet)) throw new FormulaReadError(`Invalid sheet "${sheet}".`);
          sheets.set(sheet, decode(attributes["r:id"]));
        }
      } else if (tag === "calcPr") {
        const flag = attrs().fullCalcOnLoad;
        fullCalcOnLoad = flag === "1" || flag === "true";
      }
    });
    const relationships = new Map<string, string>();
    parseXml(metadata[relsPart]!, (name, attrs, decode) => {
      if (name.split(":").at(-1) !== "Relationship") return;
      const attributes = attrs();
      if (!attributes.Id || !attributes.Target || attributes.TargetMode === "External") return;
      relationships.set(decode(attributes.Id), sheetPart(decode(attributes.Target)));
    });
    const paths = new Map<string, string>();
    for (const [sheet, id] of sheets) {
      const part = relationships.get(id);
      if (!part) throw new FormulaReadError(`Missing relationship for sheet "${sheet}".`);
      paths.set(sheet, part);
    }
    const worksheets = readParts(new Set(paths.values()));
    const formulaCells = new Map<string, Set<string>>();
    for (const [sheet, part] of paths) {
      const cells = new Set<string>();
      let address: string | undefined;
      let cellDepth: number | undefined;
      let depth = 0;
      parseXml(worksheets[part]!, (name, attrs) => {
        const tag = name.split(":").at(-1);
        if (tag === "c") {
          address = attrs().r;
          if (!address || !/^[A-Z]+[1-9]\d*$/.test(address)) {
            throw new FormulaReadError(`Cell without a valid address in sheet "${sheet}".`);
          }
          cellDepth = depth;
        } else if (tag === "f" && address) {
          if (depth !== cellDepth! + 1) {
            throw new FormulaReadError(`Formula is not a direct child of a cell in sheet "${sheet}".`);
          }
          cells.add(address);
        }
        depth++;
      }, (name) => {
        depth--;
        if (name.split(":").at(-1) === "c") {
          address = undefined;
          cellDepth = undefined;
        }
      });
      formulaCells.set(sheet, cells);
    }
    return { formulaCells, fullCalcOnLoad };
  } catch (error) {
    if (error instanceof FormulaReadError) throw error;
    throw new FormulaReadError(`Unable to read workbook formulas: ${error instanceof Error ? error.message : String(error)}`);
  }
}