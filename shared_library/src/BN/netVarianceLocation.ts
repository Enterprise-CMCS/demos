import { locateLabelRows } from "./extractors/labels.js";
import { excelColumnRow, isFormulaCell, type ExcelData } from "./index.js";
import type { ValidationError } from "./validation.js";

export const NET_VARIANCE_LOCATION = {
  sheet: "Summary",
  label: "NET VARIANCE",
  labelAddress: "B436",
  valueAddress: "AS436",
} as const;

const ERROR_CODE = "BN_NET_VARIANCE_LOCATION";

export function validateNetVarianceLocation(data: ExcelData): ValidationError | null {
  const expectedRow = Number(NET_VARIANCE_LOCATION.labelAddress.match(/\d+$/)?.[0]);
  const valueColumn = NET_VARIANCE_LOCATION.valueAddress.replace(/\d+$/, "");
  const expected = `Net variance location is invalid. Expected the literal label at ${NET_VARIANCE_LOCATION.sheet}!${NET_VARIANCE_LOCATION.labelAddress} and its numeric value at ${NET_VARIANCE_LOCATION.sheet}!${NET_VARIANCE_LOCATION.valueAddress}`;
  const summary = data.find((entry) => entry.sheet === NET_VARIANCE_LOCATION.sheet);
  if (!summary) {
    return {
      code: ERROR_CODE,
      message: `${expected}; detected that the Summary sheet is missing.`,
    };
  }

  const rows = locateLabelRows(data, NET_VARIANCE_LOCATION.sheet, NET_VARIANCE_LOCATION.label);
  if (rows.length === 1 && rows[0] === expectedRow) return null;

  const detected = rows.length > 0
    ? rows.map((row) => `${NET_VARIANCE_LOCATION.sheet}!${valueColumn}${row}`).join(", ")
    : (() => {
      const label = excelColumnRow(NET_VARIANCE_LOCATION.labelAddress, NET_VARIANCE_LOCATION.sheet, data);
      const formula = isFormulaCell(data, NET_VARIANCE_LOCATION.sheet, NET_VARIANCE_LOCATION.labelAddress);
      return label === null || label === undefined || label === ""
        ? "no literal NET VARIANCE label was found"
        : `${NET_VARIANCE_LOCATION.sheet}!${NET_VARIANCE_LOCATION.labelAddress} contains ${JSON.stringify(label)}${formula ? " (formula-derived; a literal label is required)" : ""}`;
    })();

  return {
    code: ERROR_CODE,
    message: `${expected}; detected ${detected}.`,
  };
}