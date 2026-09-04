export function partitionKey(relation: string, runDate: Date): string {
  const dt = runDate.toISOString().slice(0, 10);
  return `${relation}/dt=${dt}/part-000.parquet`;
}

export function successKey(runDate: Date): string {
  const dt = runDate.toISOString().slice(0, 10);
  return `_run/dt=${dt}/_SUCCESS`;
}
