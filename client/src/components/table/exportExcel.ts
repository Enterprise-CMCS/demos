import { Workbook, Worksheet, Row, type CellValue } from "documonster/excel";

export type ExcelColumn<T> = {
  header: string;
  value: (row: T) => CellValue;
};

export const downloadExcel = async <T>({
  filename,
  sheetName,
  rows,
  columns,
}: {
  filename: string;
  sheetName: string;
  rows: T[];
  columns: ExcelColumn<T>[];
}) => {
  const workbook = Workbook.create();
  const worksheet = Workbook.addWorksheet(workbook, sheetName);
  Worksheet.addRows(worksheet, [
    columns.map((column) => column.header),
    ...rows.map((row) => columns.map((column) => column.value(row))),
  ]);

  Row.setFont(worksheet, 1, { bold: true, size: 12 });
  Worksheet.autoFitColumns(worksheet);

  const buffer = await Workbook.toBuffer(workbook);
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};
