/**
Utility for CSV export.
My brain tells me to find a library, however. With as annoying as SNYK is, this is not a lot of code.
I figured CSV, probably okay to hand roll. but excel might be a library.

Thoght i'd just make both a then we can decide
*/

type CsvValue = boolean | number | string | null | undefined;

const escapeCsvValue = (value: CsvValue) => {
  const stringValue = value == null ? "" : String(value);
  const formulaSafeValue = /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;
  return `"${formulaSafeValue.replace(/"/g, '""')}"`;
};

export const downloadCsv = (filename: string, rows: CsvValue[][]) => {
  const csv = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
