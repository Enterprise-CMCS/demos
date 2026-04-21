import type { Option } from "components/input/select/Select";

export const toUniqueSortedOptions = (values: string[]): Option[] =>
  Array.from(new Set(values))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }));
