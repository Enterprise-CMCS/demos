import { describe, expect, it } from "vitest";

import { useValidation, type ValidationConfig } from "./useValidation";

type TestData = {
  title: string;
  startDate: string;
  endDate: string;
  tags: string[];
};

describe("useValidation", () => {
  it("returns no errors and isValid=true when all rules pass", () => {
    const data: TestData = {
      title: "Demo title",
      startDate: "2026-01-01",
      endDate: "2026-02-01",
      tags: ["alpha"],
    };

    const config: ValidationConfig<TestData> = {
      validateTitleRequired: {
        check: (data) => Boolean(data.title.trim()),
        message: "Title is required.",
      },
    };

    const result = useValidation(data, config);

    expect(result.validationErrors).toEqual({});
    expect(result.isValid).toBe(true);
  });

  it("returns rule errors and isValid=false when rules fail", () => {
    const data: TestData = {
      title: "",
      startDate: "2026-02-01",
      endDate: "2026-01-01",
      tags: [],
    };

    const config: ValidationConfig<TestData> = {
      validateTitleRequired: {
        check: (data) => Boolean(data.title.trim()),
        message: "Title is required.",
      },
      validateEndDateAfterStartDate: {
        check: (data) => new Date(data.startDate) <= new Date(data.endDate),
        message: "End date must be after start date.",
      },
    };

    const result = useValidation(data, config);

    expect(result.validationErrors.validateTitleRequired).toBe("Title is required.");
    expect(result.validationErrors.validateEndDateAfterStartDate).toBe(
      "End date must be after start date."
    );
    expect(result.isValid).toBe(false);
  });

  it("tracks multiple rules independently even if they validate the same data", () => {
    const data: TestData = {
      title: "ab",
      startDate: "2026-01-01",
      endDate: "2026-02-01",
      tags: [],
    };

    const config: ValidationConfig<TestData> = {
      validateTitleMinLength: {
        check: (data) => data.title.length >= 3,
        message: "Title must be at least 3 characters.",
      },
      validateTitleMaxLength: {
        check: (data) => data.title.length <= 100,
        message: "Title cannot exceed 100 characters.",
      },
    };

    const result = useValidation(data, config);

    // Each rule is tracked separately by its name
    expect(result.validationErrors.validateTitleMinLength).toBe(
      "Title must be at least 3 characters."
    );
    expect(result.validationErrors.validateTitleMaxLength).toBeUndefined();
    expect(result.isValid).toBe(false);
  });

  it("supports cross-field validation", () => {
    const data: TestData = {
      title: "Quarterly Review",
      startDate: "2026-05-01",
      endDate: "2026-04-01",
      tags: ["important"],
    };

    const config: ValidationConfig<TestData> = {
      validateEndDateAfterStartDate: {
        check: (data) =>
          !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
        message: "End date must be on or after start date.",
      },
      validateQuarterlyReportsTagged: {
        check: (data) =>
          !data.title.toLowerCase().includes("quarterly") ||
          data.tags.some((tag) => tag.toLowerCase() === "review"),
        message: "Quarterly reports must be tagged with 'review'.",
      },
    };

    const result = useValidation(data, config);

    expect(result.validationErrors.validateEndDateAfterStartDate).toBe(
      "End date must be on or after start date."
    );
    expect(result.validationErrors.validateQuarterlyReportsTagged).toBe(
      "Quarterly reports must be tagged with 'review'."
    );
    expect(result.isValid).toBe(false);
  });

  it("only validates rules in the config", () => {
    const data: TestData = {
      title: "Demo title",
      startDate: "",
      endDate: "",
      tags: [],
    };

    const config: ValidationConfig<TestData> = {
      validateTitleRequired: {
        check: (data) => Boolean(data.title.trim()),
        message: "Title is required.",
      },
    };

    const result = useValidation(data, config);

    // Only validateTitleRequired is in the config, so no other errors
    expect(result.validationErrors).toEqual({});
    expect(result.isValid).toBe(true);
  });
});
