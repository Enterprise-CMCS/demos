import fs from "fs";

export function readOutputs(fileName: string) {
  try {
    const coreOutputs = fs.readFileSync(fileName, "utf8");
    const coreOutputData = JSON.parse(coreOutputs);
    return coreOutputData;
  } catch (err) {
    console.log(err);
    process.exit(60);
  }
}
