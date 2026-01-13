import { describe, it, expect } from "vitest";
import { checkFormHasChanges } from "./DocumentDialog";
import type { DocumentDialogFields } from "./DocumentDialog";

describe("checkFormHasChanges", () => {
  const base: DocumentDialogFields = {
    id: "1",
    name: "Test",
    description: "Desc",
    documentType: "General File",
    file: null,
  };

  it("returns false when fields are identical", () => {
    expect(checkFormHasChanges(base, base)).toBe(false);
  });

  it("returns true when name changes", () => {
    expect(checkFormHasChanges(base, { ...base, name: "Updated" })).toBe(true);
  });

  it("returns true when description changes", () => {
    expect(checkFormHasChanges(base, { ...base, description: "Updated" })).toBe(true);
  });

  it("returns true when documentType changes", () => {
    expect(checkFormHasChanges(base, { ...base, documentType: "Approval Letter" })).toBe(true);
  });

  it("returns true when file changes", () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    expect(checkFormHasChanges(base, { ...base, file })).toBe(true);
  });

  it("ignores id changes", () => {
    expect(checkFormHasChanges(base, { ...base, id: "2" })).toBe(false);
  });
});
