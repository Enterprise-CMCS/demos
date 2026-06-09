import PDFDocument from "pdfkit";

export function generatePdf(content: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(12).text(content);
    doc.end();
  });
}
