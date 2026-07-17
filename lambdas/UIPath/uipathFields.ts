import { ExtractionStatus } from "./fetchExtractResult";
import { log } from "./log";

const DEMO_TYPE_FIELD_ID = "demo_type";

export interface UiPathFieldValue {
  Value?: string;
  UnformattedValue?: string;
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

function coerceValueText(value: UiPathFieldValue): string | null {
  const text = value.UnformattedValue ?? value.Value;
  if (typeof text !== "string") {
    return null;
  }

  return text.trim();
}

export function toPersistableFieldValues(field: UiPathField): PersistableFieldValue[] {
  if (field.IsMissing) return [];
  if (!field.FieldId || !field.FieldName) return [];
  const values = field.Values ?? [];
  const fieldType = field.FieldType || "Text";

  const persistableValues: PersistableFieldValue[] = [];
  for (const fieldValue of values) {
    try {
      const valueText = coerceValueText(fieldValue);
      if (!valueText) continue;
      persistableValues.push({
        FieldId: field.FieldId,
        FieldName: field.FieldName,
        FieldType: fieldType,
        valueText,
        fieldValue,
      });
    } catch (error) {
      log.warn({ error, fieldId: field.FieldId }, "Skipping invalid UiPath field value");
    }
  }

  if (field.FieldId !== DEMO_TYPE_FIELD_ID || persistableValues.length <= 1) {
    return persistableValues;
  }

  const bestByValue = new Map<string, PersistableFieldValue>();
  for (const persistableValue of persistableValues) {
    const key = persistableValue.valueText.toUpperCase();
    const existing = bestByValue.get(key);
    if (!existing || getConfidence(persistableValue.fieldValue) > getConfidence(existing.fieldValue)) {
      bestByValue.set(key, persistableValue);
    }
  }

  const uniqueValues = Array.from(bestByValue.values());
  if (uniqueValues.length <= 1) {
    return uniqueValues;
  }

  uniqueValues.sort((a, b) => getConfidence(b.fieldValue) - getConfidence(a.fieldValue));
  const combinedValueText = uniqueValues.map((value) => value.valueText).join(", ");
  const maxConfidence = Math.max(...uniqueValues.map((value) => getConfidence(value.fieldValue)));
  const sample = uniqueValues[0];
  if (!sample) return [];

  return [
    {
      FieldId: sample.FieldId,
      FieldName: sample.FieldName,
      FieldType: sample.FieldType,
      valueText: combinedValueText,
      fieldValue: {
        Value: combinedValueText,
        Confidence: maxConfidence,
        SelectedValues: uniqueValues.map((value) => value.valueText),
        RawValues: uniqueValues.map((value) => value.fieldValue),
        TokenList: uniqueValues.flatMap((value) => getTokenList(value.fieldValue)),
      },
    },
  ];
}
