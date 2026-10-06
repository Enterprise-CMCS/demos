import { STATES_AND_TERRITORIES } from "demos-server-constants";

/**
 * Mapping of state abbreviations to full names.
 */
const ABBREVIATION_MAP = new Map<string, string>();
STATES_AND_TERRITORIES.forEach((state) => {
  ABBREVIATION_MAP.set(state.id.toUpperCase(), state.name);
});

export function expandAbbreviation(inputToken: string): string[] {
  const expanded = ABBREVIATION_MAP.get(inputToken.toUpperCase());
  if (!expanded) {
    return [inputToken];
  }

  return [inputToken, expanded];
}
