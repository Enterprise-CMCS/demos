import { STATES_AND_TERRITORIES } from "demos-server-constants";

/**
 * Mapping of state abbreviations to full names.
 */
const ABBREVIATION_MAP = new Map<string, string>();
STATES_AND_TERRITORIES.forEach((state) => {
  ABBREVIATION_MAP.set(state.id.toUpperCase(), state.name);
});

export function expandAbbreviation(input: string): string {
  const inputUpper = input.toUpperCase();
  const isAbbreviation = ABBREVIATION_MAP.has(inputUpper);
  if (!isAbbreviation) {
    return "";
  }

  return ABBREVIATION_MAP.get(inputUpper)!;
}
