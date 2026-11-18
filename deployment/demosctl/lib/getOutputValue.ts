export function getOutputValue(
  outputData: Record<string, string | Record<string, string>>,
  stack: string,
  key: string,
): string {
  const stackOutputs = outputData[stack];
  const value = typeof stackOutputs === "object" ? stackOutputs[key] : outputData[key];
  if (typeof value === "string" && value) return value;
  console.log(`Missing output '${key}' in stack '${stack}' - validate stack name or check the outputs.json`);
  return process.exit(1);
}
