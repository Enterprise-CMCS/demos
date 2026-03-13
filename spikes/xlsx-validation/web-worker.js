// Import from '/web-worker' subpackage.
import readXlsxFile from 'read-excel-file/web-worker'

onmessage = function(event) {
  readXlsxFile(event.data).then((rows) => {
    // `rows` is an array of "rows".
    // Each "row" is an array of "cells".
    // Each "cell" is a value: string, number, Date, boolean.
    postMessage(rows)
  })
}