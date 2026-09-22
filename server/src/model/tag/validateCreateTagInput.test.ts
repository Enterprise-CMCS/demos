import { describe, expect, it, vi } from "vitest";
import { checkTagDoesntAlreadyExist } from ".";
import { PrismaTransactionClient } from "../../prismaClient";
import { validateCreateTagInput } from "./validateCreateTagInput";
import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";

vi.mock(".", () => ({
  checkTagDoesntAlreadyExist: vi.fn(),
}));

vi.mock("../../errors/cleanErrorsAndThrow", () => ({
  cleanErrorsAndThrow: vi.fn(),
}));

describe("validateCreateTagInput", () => {
  it("should pass validation results to cleanErrorsAndThrow", async () => {
    vi.mocked(checkTagDoesntAlreadyExist).mockResolvedValue("mistakes were made");

    await validateCreateTagInput("test-tag", {} as PrismaTransactionClient);

    expect(cleanErrorsAndThrow).toHaveBeenCalledWith(
      ["mistakes were made"],
      "createTag",
      "CREATE_TAG_VALIDATION_FAILED"
    );
  });
});
