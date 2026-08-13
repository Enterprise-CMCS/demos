import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  warn: vi.fn(),
}));

vi.mock("./log", () => ({
  log: { warn: mocks.warn },
}));

import { toPersistableFieldValues } from "./uipathFields";

const TAG_NAMES = [
  "Basic Health Plan (BHP)",
  "Dental",
  "Long-Term Services and Supports (LTSS)",
  "ReEntry",
  "Substance Use Disorder (SUD)",
];

describe("toPersistableFieldValues", () => {
  beforeEach(() => {
    mocks.warn.mockReset();
  });

  it("splits, canonicalizes, and deduplicates a comma-delimited demo_type list", () => {
    const fieldValues = toPersistableFieldValues(
      {
        FieldId: "demo_type",
        FieldName: "demo_type",
        Values: [
          {
            Value:
              "Substance Use Disorder (SUD),, ReEntry, Substance Use Disorder (SUD), (LTSS),, Dental",
            Confidence: 0.8,
            Reference: { TokenList: [{ Page: 2 }] },
          },
        ],
      },
      TAG_NAMES,
    );

    expect(fieldValues.map((value) => value.valueText)).toEqual([
      "Substance Use Disorder (SUD)",
      "ReEntry",
      "Long-Term Services and Supports (LTSS)",
      "Dental",
    ]);
    expect(
      fieldValues.every((value) => value.fieldValue.Confidence === 0.8),
    ).toBe(true);
  });

  it("accepts string arrays and keeps metadata from the highest-confidence duplicate", () => {
    const lowConfidenceValue = {
      Value: ["SUD", " BHP ", ""],
      Confidence: 0.25,
      Reference: { TokenList: [{ Page: 0 }] },
    };
    const highConfidenceValue = {
      UnformattedValue: ["sud"],
      Confidence: 0.9,
      Reference: { TokenList: [{ Page: 3 }] },
    };

    const fieldValues = toPersistableFieldValues(
      {
        FieldId: "demo_type",
        FieldName: "demo_type",
        Values: [lowConfidenceValue, highConfidenceValue],
      },
      TAG_NAMES,
    );

    expect(fieldValues.map((value) => value.valueText)).toEqual([
      "Substance Use Disorder (SUD)",
      "Basic Health Plan (BHP)",
    ]);
    expect(fieldValues[0]?.fieldValue).toBe(highConfidenceValue);
    expect(fieldValues[1]?.fieldValue).toBe(lowConfidenceValue);
  });

  it("logs and skips unknown or ambiguous tag aliases", () => {
    const fieldValues = toPersistableFieldValues(
      {
        FieldId: "demo_type",
        FieldName: "demo_type",
        Values: [{ Value: "Dental, Unknown Tag, DUP" }],
      },
      [...TAG_NAMES, "First Duplicate (DUP)", "Second Duplicate (DUP)"],
    );

    expect(fieldValues.map((value) => value.valueText)).toEqual(["Dental"]);
    expect(mocks.warn).toHaveBeenCalledTimes(2);
    expect(mocks.warn).toHaveBeenCalledWith(
      { fieldId: "demo_type", value: "Unknown Tag" },
      "Skipping unknown or ambiguous UiPath tag suggestion",
    );
    expect(mocks.warn).toHaveBeenCalledWith(
      { fieldId: "demo_type", value: "DUP" },
      "Skipping unknown or ambiguous UiPath tag suggestion",
    );
  });
});
