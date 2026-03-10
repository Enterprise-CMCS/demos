import { definePDFJSModule, renderPageAsImage } from "unpdf";

const uipath = {
  Value: "SUD",
  TextType: "Text",
  Reference: {
    Tokens: [  // see: https://docs.uipath.com/activities/other/latest/document-understanding/results-value-tokens-class
      {
        Page: 11,
        Boxes: [[422.67, 72, 20.53, 16]], //double Top, double left, double Width,double Height, Yes, its YXWH and not XYWH see https://docs.uipath.com/activities/other/latest/document-understanding/box-class
        PageWidth: 612,
        PageHeight: 792,
        TextLength: 3,
        TextStartIndex: 30086,
      },
    ],
    TextLength: 3,
    TextStartIndex: 30086,
  },
  Components: [],
  Confidence: 0.539024,
  DerivedFields: [],
  OcrConfidence: 1,
  ValidatorNotes: "",
  UnformattedValue: "SUD",
  OperatorConfirmed: false,
  ValidatorNotesInfo: "",
};

// Use the official PDF.js legacy build for Node.js environments
// (the non-legacy build expects DOM APIs like DOMMatrix)
await definePDFJSModule(() => import("pdfjs-dist/legacy/build/pdf.mjs"));

// Node file helpers
import { readFile, writeFile } from "node:fs/promises";

let pdf = await readFile("./input.pdf");

const buffer = new Uint8Array(pdf);
const pageNumber = uipath.Reference.Tokens[0].Page + 1;

const result = await renderPageAsImage(buffer, pageNumber, {
  canvasImport: () => import("@napi-rs/canvas"),  
  width: uipath.Reference.Tokens[0].PageWidth,
  height: uipath.Reference.Tokens[0].PageHeight,
});

// Annotate the image by drawing red rectangles around the provided boxes
const { createCanvas, loadImage } = await import("@napi-rs/canvas");
const img = await loadImage(Buffer.from(result));
const canvas = createCanvas(uipath.Reference.Tokens[0].PageWidth, uipath.Reference.Tokens[0].PageHeight);
const ctx = canvas.getContext("2d");
ctx.drawImage(img, 0, 0);

for (const token of uipath.Reference.Tokens) {
  const boxes = token.Boxes ?? [];
  for (const b of boxes) {
    const [top, left, w, h] = b.map((v) => Number(v));
    ctx.strokeStyle = "red";
    ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) / 8));
    ctx.beginPath();
    ctx.rect(left, top, w, h);
    ctx.stroke();
  }
}

const annotated = canvas.toBuffer("image/png");
await writeFile("dummy-page-1-annotated.png", annotated);
