import fs from 'node:fs/promises';
import readXlsxFile from 'read-excel-file/universal'


const data = await fs.readFile('./input.xlsm');
const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//for browser, you can directly use the file input element to get the `Blob` from the selected file. see https://developer.mozilla.org/en-US/docs/Web/API/File


const rows = await readXlsxFile(blob, {sheet:'C Report'});


function excelColumnRow(excelColumnRow, rows) {
  const match = excelColumnRow.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error('Invalid Excel column-row format');
  }
  const columnLetters = match[1];
  const rowNumber = parseInt(match[2], 10) - 1;

  let columnNumber = 0;
  for (let i = 0; i < columnLetters.length; i++) {
    columnNumber *= 26;
    columnNumber += (columnLetters.charCodeAt(i) - 'A'.charCodeAt(0));
  }

  return rows[rowNumber][columnNumber];

  
}

console.log(excelColumnRow('C113', rows));  
console.log(excelColumnRow('Q106', rows));  
console.log(excelColumnRow('H2', rows));
console.log(excelColumnRow("A101",rows));
console.log(excelColumnRow("A100",rows));
