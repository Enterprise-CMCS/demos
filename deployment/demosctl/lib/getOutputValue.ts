export function getOutputValue(outputData:{[key: string]: {[key: string]: string}}, stack:string, key:string): string {
  if (outputData[stack] && outputData[stack][key]) return outputData[stack][key];
  console.log(`Missing output '${key}' in stack '${stack}' - validate stack name or check the outputs.json`);
  process.exit(1)
}
