import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateRenameTagInput } from "./validateRenameTagInput";
import { checkTagOldNameExists } from "./checkTagOldNameExists";
import { checkTagNewNameDoesNotExist } from "./checkTagNewNameDoesNotExist";
import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";

vi.mock("./checkTagOldNameExists", () => ({
  checkTagOldNameExists: vi.fn(),
}));

vi.mock("./checkTagNewNameDoesNotExist", () => ({
  checkTagNewNameDoesNotExist: vi.fn(),
}));

vi.mock("../../errors/cleanErrorsAndThrow", () => ({
  cleanErrorsAndThrow: vi.fn(),
}));

describe("validateRenameTagInput", () => {
  const mockTransaction: any = "Test!";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call both validation functions with correct parameters", async () => {
    vi.mocked(checkTagOldNameExists).mockResolvedValue(undefined);
    vi.mocked(checkTagNewNameDoesNotExist).mockResolvedValue(undefined);

    await validateRenameTagInput("Old Name", "New Name", mockTransaction);

    expect(checkTagOldNameExists).toHaveBeenCalledExactlyOnceWith("Old Name", mockTransaction);
    expect(checkTagNewNameDoesNotExist).toHaveBeenCalledExactlyOnceWith(
      "New Name",
      mockTransaction
    );
  });

  it("should pass errors to cleanErrorsAndThrow", async () => {
    const oldError = "Cannot rename tag named Old Name as the name does not exist.";
    const newError = "Cannot rename tag to name New Name as the name already exists.";

    vi.mocked(checkTagOldNameExists).mockResolvedValue(oldError);
    vi.mocked(checkTagNewNameDoesNotExist).mockResolvedValue(newError);

    await validateRenameTagInput("Old Name", "New Name", mockTransaction);

    expect(cleanErrorsAndThrow).toHaveBeenCalledExactlyOnceWith(
      [oldError, newError],
      "renameTag",
      "RENAME_TAG_VALIDATION_FAILED"
    );
  });

  it("should pass undefined errors when validation passes", async () => {
    vi.mocked(checkTagOldNameExists).mockResolvedValue(undefined);
    vi.mocked(checkTagNewNameDoesNotExist).mockResolvedValue(undefined);

    await validateRenameTagInput("Old Name", "New Name", mockTransaction);

    expect(cleanErrorsAndThrow).toHaveBeenCalledExactlyOnceWith(
      [undefined, undefined],
      "renameTag",
      "RENAME_TAG_VALIDATION_FAILED"
    );
  });
});
