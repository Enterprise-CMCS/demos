export function getOutputValue(outputData: Record<string, string>, stack: string, key: string): string {
  if (outputData[key]) return outputData[key];
  console.log(`Missing output '${key}' in stack '${stack}' - validate stack name or check the outputs.json`);
  return process.exit(1);
}
