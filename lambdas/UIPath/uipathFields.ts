import { ExtractionStatus } from "./fetchExtractResult";
import { log } from "./log";

export const DEMO_TYPE_FIELD_ID = "demo_type";

export interface UiPathFieldValue {
  Value?: string | string[];
  UnformattedValue?: string | string[];
  Confidence?: number;
  Reference?: {
    TextLength?: number;
    TextStartIndex?: number;
    TokenList?: unknown;
    Tokens?: unknown;
  };
  TokenList?: unknown;
  Tokens?: unknown;
  [key: string]: unknown;
}

interface UiPathField {
  FieldId?: string;
  FieldName?: string;
  FieldType?: string;
  IsMissing?: boolean;
  Values?: UiPathFieldValue[];
}

export type PersistableFieldValue = {
  FieldId: string;
  FieldName: string;
  FieldType: string;
  valueText: string;
  fieldValue: UiPathFieldValue;
};

export function getExtractedFields(status: ExtractionStatus): UiPathField[] {
  const payload = status as {
    Fields?: unknown;
    result?: {
      extractionResult?: {
        ResultsDocument?: {
          Fields?: unknown;
        };
      };
    };
  };

  const topLevelFields = payload.Fields;
  if (Array.isArray(topLevelFields)) {
    return topLevelFields as UiPathField[];
  }

  const nestedFields = payload.result?.extractionResult?.ResultsDocument?.Fields;
  if (Array.isArray(nestedFields)) {
    return nestedFields as UiPathField[];
  }

  return [];
}

export function getConfidence(value: UiPathFieldValue): number {
  return typeof value.Confidence === "number" ? value.Confidence : 0;
}

export function getTextStartIndex(value: UiPathFieldValue): number {
  const startIndex = value.Reference?.TextStartIndex;
  return typeof startIndex === "number" ? startIndex : 0;
}

export function getTokenList(value: UiPathFieldValue): unknown[] {
  const tokenList =
    value.Reference?.TokenList ?? value.Reference?.Tokens ?? value.TokenList ?? value.Tokens;
  return Array.isArray(tokenList) ? tokenList : [];
}

function coerceValueTexts(value: UiPathFieldValue): string[] {
  const text = value.UnformattedValue ?? value.Value;
  if (typeof text === "string") {
    return [text.trim()].filter(Boolean);
  }

  if (Array.isArray(text)) {
    return text
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeTagLookupKey(value: string): string {
  return value.trim().toUpperCase();
}

type CanonicalTagLookup = {
  exactNames: Map<string, string>;
  aliases: Map<string, string | null>;
};

function buildCanonicalTagLookup(
  tagNames: readonly string[],
): CanonicalTagLookup {
  const exactNames = new Map<string, string>();
  const aliasesByKey = new Map<string, Set<string>>();

  const addAlias = (key: string, tagName: string) => {
    const candidates = aliasesByKey.get(key) ?? new Set<string>();
    candidates.add(tagName);
    aliasesByKey.set(key, candidates);
  };

  for (const tagName of tagNames) {
    exactNames.set(normalizeTagLookupKey(tagName), tagName);

    for (const match of tagName.matchAll(/\(([^()]+)\)/g)) {
      const alias = match[1]?.trim();
      if (!alias) continue;
      addAlias(normalizeTagLookupKey(alias), tagName);
      addAlias(normalizeTagLookupKey(`(${alias})`), tagName);
    }
  }

  return {
    exactNames,
    aliases: new Map(
      Array.from(aliasesByKey, ([key, candidates]) => [
        key,
        candidates.size === 1
          ? (candidates.values().next().value ?? null)
          : null,
      ]),
    ),
  };
}

function resolveCanonicalTagName(
  lookup: CanonicalTagLookup,
  value: string,
): string | null {
  const key = normalizeTagLookupKey(value);
  return lookup.exactNames.get(key) ?? lookup.aliases.get(key) ?? null;
}

function toDemoTypeCandidates(value: UiPathFieldValue): string[] {
  return coerceValueTexts(value).flatMap((text) =>
    text
      .split(",")
      .map((candidate) => candidate.trim())
      .filter(Boolean),
  );
}

export function toPersistableFieldValues(
  field: UiPathField,
  canonicalTagNames: readonly string[] = [],
): PersistableFieldValue[] {
  if (field.IsMissing) return [];
  if (!field.FieldId || !field.FieldName) return [];
  const values = field.Values ?? [];
  const fieldType = field.FieldType || "Text";
  const isDemoType = field.FieldId === DEMO_TYPE_FIELD_ID;
  const canonicalTagLookup = isDemoType
    ? buildCanonicalTagLookup(canonicalTagNames)
    : null;

  const persistableValues: PersistableFieldValue[] = [];
  for (const fieldValue of values) {
    try {
      const valueTexts = isDemoType
        ? toDemoTypeCandidates(fieldValue)
        : coerceValueTexts(fieldValue);
      for (const valueText of valueTexts) {
        const canonicalValue = canonicalTagLookup
          ? resolveCanonicalTagName(canonicalTagLookup, valueText)
          : null;
        if (isDemoType && !canonicalValue) {
          log.warn(
            { fieldId: field.FieldId, value: valueText },
            "Skipping unknown or ambiguous UiPath tag suggestion",
          );
          continue;
        }

        persistableValues.push({
          FieldId: field.FieldId,
          FieldName: field.FieldName,
          FieldType: fieldType,
          valueText: canonicalValue ?? valueText,
          fieldValue,
        });
      }
    } catch (error) {
      log.warn(
        { error, fieldId: field.FieldId },
        "Skipping invalid UiPath field value",
      );
    }
  }

  if (!isDemoType || persistableValues.length <= 1) {
    return persistableValues;
  }

  const bestByValue = new Map<string, PersistableFieldValue>();
  for (const persistableValue of persistableValues) {
    const key = persistableValue.valueText.toUpperCase();
    const existing = bestByValue.get(key);
    if (
      !existing ||
      getConfidence(persistableValue.fieldValue) >
        getConfidence(existing.fieldValue)
    ) {
      bestByValue.set(key, persistableValue);
    }
  }

  return Array.from(bestByValue.values());
}
