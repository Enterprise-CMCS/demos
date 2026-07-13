export function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid email date value: ${value}`);
  }

  return date.toISOString().slice(0, 10);
}
