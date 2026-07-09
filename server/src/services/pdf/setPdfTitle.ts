import { PDFDocument } from "pdf-lib";

/** Returns the PDF bytes with the internal title set, overwriting any existing one. */
export async function setPdfTitle(pdfBytes: Uint8Array, title: string): Promise<Uint8Array> {
  const pdfDocument = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  pdfDocument.setTitle(title);
  return await pdfDocument.save();
}
