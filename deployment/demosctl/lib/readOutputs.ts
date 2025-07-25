import fs from "fs";

export function readOutputs(fileName: string) {
  const coreOutputs = fs.readFileSync(fileName, "utf8");
  const coreOutputData = JSON.parse(coreOutputs);
  return coreOutputData;
}
