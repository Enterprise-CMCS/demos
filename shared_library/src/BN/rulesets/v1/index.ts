import {
  type ExcelData,
  excelColumnToNumber,
  excelColumnRow,
  numberToExcelColumn,
} from "../../index.js";
import type { ValidationFunction } from "../../validation.js";

export const validations: ValidationFunction[] = [
  function error1(data: ExcelData) {
    const A100 = excelColumnRow("A100", "C Report", data);
    const A300 = excelColumnRow("A300", "C Report", data);
    const A500 = excelColumnRow("A500", "C Report", data);
    const A700 = excelColumnRow("A700", "C Report", data);

    if (
      A100 !== "Waiver Name" ||
      A300 !== "Waiver Name" ||
      A500 !== "Waiver Name" ||
      A700 !== "Waiver Name"
    ) {
      return {
        code: "1",
        message:
          "Error: C Report Tab - Waiver data from MBES Schedule C Report is not pasted correctly.\n\nPlease review the following:\n- Paste all data from MBES Schedule C Report from Waiver Name column through Total Less Non Adds column\n- Ensure the totals line is included when data is reported",
      };
    }
    return null;
  },

  function error2(data: ExcelData) {
    const f2 = excelColumnRow("F2", "C Report", data);
    if (isNaN(Number(f2)) || f2 === "" || f2 === null) {
      return {
        code: "2",
        message:
          "Error: C Report Tab - The 'Reporting Year' value is missing.\n\nPlease enter Reporting DY in cell F2.",
      };
    }
    return null;
  },

  function error3(data: ExcelData) {
    const f3 = excelColumnRow("F3", "C Report", data);
    if (isNaN(Number(f3)) || f3 === "" || f3 === null) {
      return {
        code: "3",
        message:
          "Error: C Report Tab - The 'Reporting Quarter' value is missing.\n\nPlease enter Reporting Quarter in cell F3.",
      };
    }
    return null;
  },

  function error4(data: ExcelData) {
    const maxYear = Number(excelColumnRow("F2", "C Report", data));
    const columnStart = numberToExcelColumn(maxYear + 2);
    const columnEnd = "AP";
    const endRow = 1000;
    const skiprows = [300, 500, 700];
    let row = 101;

    while (row <= endRow) {
      if (skiprows.includes(row)) {
        row += 1;
        continue;
      }
      for (let colNumber =  excelColumnToNumber(columnStart); colNumber <= excelColumnToNumber(columnEnd); colNumber++) {
        const col = numberToExcelColumn(colNumber);
        const cellValue = excelColumnRow(`${col}${row}`, "C Report", data);
        if (cellValue !== "" && cellValue !== null) {
          return {
            code: "4",
            message:
              "Error: C Report - Expenditure data is present for DY(s) that extend beyond the Reporting DY.\n\nPlease only enter data through the current Reporting DY.",
          };
        }
      }
      row += 1;
    }
    return null;
  },

  function error5(data: ExcelData) {
    const D2 = excelColumnRow("D2", "C Report", data);
    if (D2 === "" || D2 === null) {
      return {
        code: "5",
        message:
          "Error: C Report - 'Data Pulled On' field is blank.\n\nPlease enter the date the data was pulled in cell D2.",
      };
    }
    return null;
  },

  function error6(data: ExcelData) {
    const D3 = excelColumnRow("D3", "C Report", data);
    if (D3 === "" || D3 === null) {
      return {
        code: "6",
        message:
          "Error: C Report - 'For the Time Period Through' field is blank.\n\nPlease enter the time period in cell D3.",
      };
    }
    return null;
  },

  function error7(data: ExcelData) {
    const k3 = Number(excelColumnRow("K3", "C Report", data));
    if (isNaN(k3) || k3 < 1 || k3 > 4) {
      return {
        code: "7",
        message:
          "Error: C Report - The 'Reporting Quarter' value is non-numerical, or beyond the range from 1 to 4.\n\nPlease enter a numerical value within the range 1-4 in cell F3.",
      };
    }
    return null;
  },

  function error8(data: ExcelData) {
    const rowStart = 47;
    const rowEnd = 500;
    const columnStart = "D";
    const columnEnd = "AH";

    for (let row = rowStart; row <= rowEnd; row++) {
      for (let colNumber = excelColumnToNumber(columnStart); colNumber <= excelColumnToNumber(columnEnd); colNumber++) {
        const col = numberToExcelColumn(colNumber);
        const cellValue = excelColumnRow(`${col}${row}`, "MemMon Actual", data);
        if (
          cellValue !== "" &&
          cellValue !== null &&
          isNaN(Number(cellValue))
        ) {
          return {
            code: "8",
            message:
              "Error: MemMon Actual - Data entry field(s) contains a non-numerical value.\n\nPlease only enter numerical values.",
          };
        }
      }
    }

    return null;
  },

  function error9(data: ExcelData) {
    const rowStart = 47;
    const rowEnd = 500;
    const columnStart = "D";
    const columnEnd = "AH";

    for (let row = rowStart; row <= rowEnd; row++) {
      for (let colNumber = excelColumnToNumber(columnStart); colNumber <= excelColumnToNumber(columnEnd); colNumber++) {
        const col = numberToExcelColumn(colNumber);
        const cellValue = excelColumnRow(
          `${col}${row}`,
          "MemMon Projected",
          data,
        );
        if (
          cellValue !== "" &&
          cellValue !== null &&
          isNaN(Number(cellValue))
        ) {
          return {
            code: "9",
            message:
              "Error: MemMon Projected - Data entry field(s) contains a non-numerical value.\n\nPlease only enter numerical values.",
          };
        }
      }
    }

    return null;
  },

  function error10(data: ExcelData) {
    const rowStart = 68;
    const rowEnd = 500;
    const columnStart = "D";
    const columnEnd = "BX";
    const skipColumns = ["AR", "AS"];

    for (let row = rowStart; row <= rowEnd; row++) {
      for (let colNumber = excelColumnToNumber(columnStart); colNumber <= excelColumnToNumber(columnEnd); colNumber++) {
        const col = numberToExcelColumn(colNumber);
        if (skipColumns.includes(col)) {
          continue;
        }
        const cellValue = excelColumnRow(
          `${col}${row}`,
          "Total Adjustments",
          data,
        );
        if (
          cellValue !== "" &&
          cellValue !== null &&
          isNaN(Number(cellValue))
        ) {
          return {
            code: "10",
            message:
              "Error: Total Adjustments - Data entry field(s) contains a non-numerical value.\n\nPlease only enter numerical values.",
          };
        }
      }
    }

    return null;
  },

  function error11(data: ExcelData) {
    const rowStart = 68;
    const rowEnd = 467;
    const columnStart = "D";
    const columnEnd = "BV";  

    for (let row = rowStart; row <= rowEnd; row++) {
      for (let colNumber = excelColumnToNumber(columnStart); colNumber <= excelColumnToNumber(columnEnd); colNumber++) {
        const col = numberToExcelColumn(colNumber);
        const cellValue = excelColumnRow(
          `${col}${row}`,
          "WW Spending Projected",
          data,
        );
        if (
          cellValue !== "" &&
          cellValue !== null &&
          isNaN(Number(cellValue))
        ) {
          return {
            code: "11",
            message:
              "Error: WW Spending Projected - Data entry field(s) contains a non-numerical value.\n\nPlease only enter numerical values.",
          };
        }
      }
    }

    return null;
  },

  function error12(data: ExcelData) {
    //TODO: Awaiting Requirements on how version will be stored on the workbook to implement this error.
    // return {
    //     code: "12",
    //     message:
    //       "Error: You are attempting to upload an old version of the workbook.\n\nPlease download and populate the most recent version of the template available on DEMOS.",
    //   };
    return null;
  },
];
