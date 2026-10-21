import { describe, expect, it, vi } from "vitest";
import { checkTagsDontAlreadyExist } from ".";
import { PrismaTransactionClient } from "../../prismaClient";
import { validateCreateTagsInput } from "./validateCreateTagsInput";
import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";

vi.mock(".", () => ({
  checkTagsDontAlreadyExist: vi.fn(),
}));

vi.mock("../../errors/cleanErrorsAndThrow", () => ({
  cleanErrorsAndThrow: vi.fn(),
}));

describe("validateCreateTagInput", () => {
  it("should pass validation results to cleanErrorsAndThrow", async () => {
    vi.mocked(checkTagsDontAlreadyExist).mockResolvedValue("mistakes were made");

    await validateCreateTagsInput(["test-tag"], {} as PrismaTransactionClient);

    expect(cleanErrorsAndThrow).toHaveBeenCalledWith(
      ["mistakes were made"],
      "createTags",
      "CREATE_TAGS_VALIDATION_FAILED"
    );
  });
});
