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
