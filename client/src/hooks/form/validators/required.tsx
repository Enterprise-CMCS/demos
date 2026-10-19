export const required = (label: string) => (value: unknown) => {
  if (typeof value === "string" && !value.trim()) {
    return `${label} is required.`;
  }

  if (value === null || value === undefined || value === "") {
    return `${label} is required.`;
  }

  return undefined;
};
