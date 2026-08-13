import { describe, it, expect, vi, beforeEach } from "vitest";
import { GraphQLError } from "graphql";

import { validateSetDemonstrationRoleInput } from "./validateSetDemonstrationRoleInput";
import { SetDemonstrationRoleInput } from "./demonstrationRoleAssignmentSchema";
import { Role } from "../../types";

// Mock imports
vi.mock("./checkPersonCanBePrimary", () => ({
  checkPersonCanBePrimary: vi.fn(),
}));

import { checkPersonCanBePrimary } from "./checkPersonCanBePrimary";

describe("validateSetDemonstrationRoleInput", () => {
  const testInput: SetDemonstrationRoleInput = {
    demonstrationId: "test-demo-id",
    personId: "test-person-id",
    roleId: "DDME Analyst" satisfies Role,
    isPrimary: true,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should not throw when checkPersonCanBePrimary returns undefined", async () => {
    vi.mocked(checkPersonCanBePrimary).mockResolvedValue(undefined);

    await expect(validateSetDemonstrationRoleInput(testInput)).resolves.toBeUndefined();
  });

  it("should call checkPersonCanBePrimary with the input", async () => {
    vi.mocked(checkPersonCanBePrimary).mockResolvedValue(undefined);

    await validateSetDemonstrationRoleInput(testInput);
    expect(checkPersonCanBePrimary).toHaveBeenCalledExactlyOnceWith(testInput);
  });

  it("should throw GraphQLError when checkPersonCanBePrimary returns an error message", async () => {
    const errorMessage =
      "this error forbids you from doing that!";
    vi.mocked(checkPersonCanBePrimary).mockResolvedValue(errorMessage);

    try {
      await validateSetDemonstrationRoleInput(testInput);
      throw new Error("Expected validateSetDemonstrationRoleInput to throw, but it did not.");
    } catch (e) {
      expect(e).toBeInstanceOf(GraphQLError);
      const error = e as GraphQLError;
      expect(error.message).toBe(
        "One or more validation checks for setDemonstrationRole have failed."
      );
      expect(error.extensions.code).toBe("SET_DEMONSTRATION_ROLE_VALIDATION_FAILED");
      expect(error.extensions.originalMessages).toStrictEqual([errorMessage]);
    }
  });
});
