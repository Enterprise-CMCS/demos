import { describe, expect, it } from "vitest";

import { useValidation, ValidationSchema } from "./useValidation";

type TestFormData = {
  title: string;
  startDate: string;
  endDate: string;
  tags: string[];
};

describe("useValidation", () => {
  it("returns no errors and isValid=true when all rules pass", () => {
    const formData: TestFormData = {
      title: "Demo title",
      startDate: "2026-01-01",
      endDate: "2026-02-01",
      tags: ["alpha"],
    };

    const schema: ValidationSchema<TestFormData> = {
      title: [(data) => (data.title.trim() ? undefined : "Title is required.")],
      endDate: [
        (data) =>
          new Date(data.startDate) <= new Date(data.endDate)
            ? undefined
            : "End date must be on or after start date.",
      ],
      tags: [(data) => (data.tags.length > 0 ? undefined : "At least one tag is required.")],
    };

    const result = useValidation(formData, schema);

    expect(result.errors).toEqual({});
    expect(result.isValid).toBe(true);
  });

  it("returns field errors and isValid=false when rules fail", () => {
    const formData: TestFormData = {
      title: "",
      startDate: "2026-02-01",
      endDate: "2026-01-01",
      tags: [],
    };

    const schema: ValidationSchema<TestFormData> = {
      title: [(data) => (data.title.trim() ? undefined : "Title is required.")],
      endDate: [
        (data) =>
          new Date(data.startDate) <= new Date(data.endDate)
            ? undefined
            : "End date must be on or after start date.",
      ],
      tags: [(data) => (data.tags.length > 0 ? undefined : "At least one tag is required.")],
    };

    const result = useValidation(formData, schema);

    expect(result.errors).toEqual({
      title: "Title is required.",
      endDate: "End date must be on or after start date.",
      tags: "At least one tag is required.",
    });
    expect(result.isValid).toBe(false);
  });

  it("uses only the first failing rule for a field", () => {
    const formData: TestFormData = {
      title: "",
      startDate: "2026-01-01",
      endDate: "2026-02-01",
      tags: [],
    };

    const schema: ValidationSchema<TestFormData> = {
      title: [
        (data) => (data.title.trim() ? undefined : "Title is required."),
        () => "Title must be at least 3 characters.",
      ],
    };

    const result = useValidation(formData, schema);

    expect(result.errors).toEqual({ title: "Title is required." });
    expect(result.isValid).toBe(false);
  });

  it("supports validating a field based on other form fields", () => {
    const formData: TestFormData = {
      title: "Quarterly review",
      startDate: "2026-05-01",
      endDate: "2026-04-01",
      tags: ["review"],
    };

    const schema: ValidationSchema<TestFormData> = {
      endDate: [
        (data) =>
          !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate)
            ? undefined
            : "End date must be on or after start date.",
      ],
    };

    const result = useValidation(formData, schema);

    expect(result.errors).toEqual({
      endDate: "End date must be on or after start date.",
    });
    expect(result.isValid).toBe(false);
  });

  it("ignores fields without validation rules", () => {
    const formData: TestFormData = {
      title: "Demo title",
      startDate: "",
      endDate: "",
      tags: [],
    };

    const schema: ValidationSchema<TestFormData> = {
      title: [(data) => (data.title.trim() ? undefined : "Title is required.")],
    };

    const result = useValidation(formData, schema);

    expect(result.errors).toEqual({});
    expect(result.isValid).toBe(true);
  });
});
