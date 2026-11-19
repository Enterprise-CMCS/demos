import { FlateErrorCode, strFromU8, unzipSync } from "fflate";
import { Parser } from "saxen";

export const FORMULA_SHEETS = ["Summary", "Program Spending Limits"] as const;
export const MAX_UNCOMPRESSED_BYTES = 256 * 1024 * 1024;
<<<<<<< HEAD
export type FormulaInfo = { formulaCells: Map<string, Set<string>>; fullCalcOnLoad: boolean };
=======
export type ArrayFormulaRange = {
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
};
export type FormulaInfo = {
  formulaCells: Map<string, Set<string>>;
  arrayFormulaRanges: Map<string, ArrayFormulaRange[]>;
  fullCalcOnLoad: boolean;
};
>>>>>>> 8d0d22562230370c1b466f00e3978f746428403b

const ARCHIVE_INPUT_ERROR_CODES = new Set<number>([
  FlateErrorCode.UnexpectedEOF,
  FlateErrorCode.InvalidBlockType,
  FlateErrorCode.InvalidLengthLiteral,
  FlateErrorCode.InvalidDistance,
  FlateErrorCode.InvalidHeader,
  FlateErrorCode.InvalidUTF8,
  FlateErrorCode.InvalidZipData,
  FlateErrorCode.UnknownCompressionMethod,
]);

export class FormulaReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaReadError";
  }
}

type OpenTagHandler = (name: string, attrs: () => Record<string, string>, decode: (text: string) => string) => void;

function localName(name: string): string {
  return name.split(":").at(-1)!;
}

function parseXml(bytes: Uint8Array, open: OpenTagHandler, close?: (name: string) => void): void {
  const parser = new Parser();
  const fail = (error: Error) => { throw new FormulaReadError(error.message); };
  parser.on("error", fail);
  parser.on("warn", fail);
  parser.on("openTag", (name, attrs, decode) => open(localName(name), attrs, decode));
  if (close) parser.on("closeTag", (name) => close(localName(name)));
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

<<<<<<< HEAD
function readFormulaCells(bytes: Uint8Array, sheet: string): Set<string> {
  const cells = new Set<string>();
=======
function parseCellAddress(address: string): { row: number; column: number } | undefined {
  const match = /^\$?([A-Z]{1,3})\$?([1-9]\d{0,6})$/.exec(address);
  if (!match) return undefined;
  let column = 0;
  for (const letter of match[1]!) {
    column = column * 26 + letter.charCodeAt(0) - 64;
  }
  const row = Number(match[2]);
  if (column > 16384 || row > 1048576) return undefined;
  return { row, column };
}

export function isCellInArrayFormulaRange(address: string, range: ArrayFormulaRange): boolean {
  const cell = parseCellAddress(address);
  return cell !== undefined
    && cell.row >= range.startRow && cell.row <= range.endRow
    && cell.column >= range.startColumn && cell.column <= range.endColumn;
}

function readArrayFormulaRange(ref: string | undefined, sheet: string, address: string): ArrayFormulaRange {
  const references = ref?.split(":") ?? [];
  const start = parseCellAddress(references[0] ?? "");
  const end = parseCellAddress(references[1] ?? references[0] ?? "");
  if (!start || !end || references.length > 2 || start.row > end.row || start.column > end.column) {
    throw new FormulaReadError(`Invalid array formula range in sheet "${sheet}" at ${address}.`);
  }
  const range = { startRow: start.row, startColumn: start.column, endRow: end.row, endColumn: end.column };
  if (!isCellInArrayFormulaRange(address, range)) {
    throw new FormulaReadError(`Array formula range does not contain its anchor in sheet "${sheet}" at ${address}.`);
  }
  return range;
}

function readFormulaCells(bytes: Uint8Array, sheet: string): { cells: Set<string>; arrayRanges: ArrayFormulaRange[] } {
  const cells = new Set<string>();
  const arrayRanges: ArrayFormulaRange[] = [];
>>>>>>> 8d0d22562230370c1b466f00e3978f746428403b
  let address: string | undefined;
  let cellDepth: number | undefined;
  let depth = 0;
  parseXml(bytes, (tag, attrs) => {
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
<<<<<<< HEAD
=======
      const attributes = attrs();
      if (attributes.t === "array") {
        arrayRanges.push(readArrayFormulaRange(attributes.ref, sheet, address));
      }
>>>>>>> 8d0d22562230370c1b466f00e3978f746428403b
    }
    depth++;
  }, (tag) => {
    depth--;
    if (tag === "c") {
      address = undefined;
      cellDepth = undefined;
    }
  });
<<<<<<< HEAD
  return cells;
=======
  return { cells, arrayRanges };
>>>>>>> 8d0d22562230370c1b466f00e3978f746428403b
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
    parseXml(metadata[workbookPart]!, (tag, attrs, decode) => {
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
    parseXml(metadata[relsPart]!, (tag, attrs, decode) => {
      if (tag !== "Relationship") return;
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
<<<<<<< HEAD
    for (const [sheet, part] of paths) {
      formulaCells.set(sheet, readFormulaCells(worksheets[part]!, sheet));
    }
    return { formulaCells, fullCalcOnLoad };
=======
    const arrayFormulaRanges = new Map<string, ArrayFormulaRange[]>();
    for (const [sheet, part] of paths) {
      const { cells, arrayRanges } = readFormulaCells(worksheets[part]!, sheet);
      formulaCells.set(sheet, cells);
      arrayFormulaRanges.set(sheet, arrayRanges);
    }
    return { formulaCells, arrayFormulaRanges, fullCalcOnLoad };
>>>>>>> 8d0d22562230370c1b466f00e3978f746428403b
  } catch (error) {
    if (error instanceof Error && "code" in error && typeof error.code === "number" && ARCHIVE_INPUT_ERROR_CODES.has(error.code)) {
      throw new FormulaReadError(`Unable to read workbook formulas: ${error.message}`);
    }
    throw error;
  }
}