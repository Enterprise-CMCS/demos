import { STATES_AND_TERRITORIES } from "demos-server-constants";

/**
 * Builds a bidirectional mapping of state abbreviations and full names.
 * Caches the result to avoid rebuilding on every lookup.
 */
let abbreviationMap: Map<string, string> | null = null;

function buildAbbreviationMap(): Map<string, string> {
  const map = new Map<string, string>();

  STATES_AND_TERRITORIES.forEach((state) => {
    // Add abbreviation → name mapping
    map.set(state.id.toUpperCase(), state.name);
    // Add name → abbreviation mapping (for reverse lookups)
    map.set(state.name.toUpperCase(), state.id);
  });

  return map;
}

function getAbbreviationMap(): Map<string, string> {
  if (!abbreviationMap) {
    abbreviationMap = buildAbbreviationMap();
  }
  return abbreviationMap;
}

/**
 * Checks if the input string is a valid state abbreviation.
 * Case-insensitive.
 *
 * @example
 * isStateAbbreviation("NC") // true
 * isStateAbbreviation("nc") // true
 * isStateAbbreviation("North Carolina") // false
 */
export function isStateAbbreviation(input: string): boolean {
  const map = getAbbreviationMap();
  return map.has(input.toUpperCase()) && input.length === 2;
}

/**
 * Expands a state abbreviation to its full name.
 * Returns the full name if input is a valid abbreviation, otherwise returns null.
 * Case-insensitive.
 *
 * @example
 * expandAbbreviation("NC") // "North Carolina"
 * expandAbbreviation("nc") // "North Carolina"
 * expandAbbreviation("North Carolina") // null
 */
export function expandAbbreviation(input: string): string | null {
  if (!isStateAbbreviation(input)) {
    return null;
  }

  const map = getAbbreviationMap();
  return map.get(input.toUpperCase()) || null;
}

/**
 * Gets the abbreviation for a full state name.
 * Returns the abbreviation if input is a valid state name, otherwise returns null.
 * Case-sensitive for the state name.
 *
 * @example
 * getAbbreviationForState("North Carolina") // "NC"
 * getAbbreviationForState("NC") // null
 */
export function getAbbreviationForState(stateName: string): string | null {
  const map = getAbbreviationMap();
  return map.get(stateName.toUpperCase()) || null;
}

/**
 * Gets all valid state abbreviations.
 *
 * @example
 * getAllStateAbbreviations() // ["AL", "AK", "AS", "AZ", ...]
 */
export function getAllStateAbbreviations(): string[] {
  return STATES_AND_TERRITORIES.map((state) => state.id);
}
