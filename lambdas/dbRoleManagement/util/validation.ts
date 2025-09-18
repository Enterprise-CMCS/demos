export function hasDuplicates(arr: any[]) {
  return new Set(arr).size !== arr.length;
}

export function isValidRoleName(str: string) {
  return /^[a-z_]+$/.test(str);
}
