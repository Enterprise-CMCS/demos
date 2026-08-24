import { print } from "graphql";
import { describe, expect, it, vi } from "vitest";
import { createTestEmail } from "./createTestEmail";
import { emailResolvers } from "./emailResolvers";
import { emailSchema } from "./emailSchema";

vi.mock("./createTestEmail", () => ({
  createTestEmail: vi.fn(),
}));

describe("emailResolvers", () => {
  it("sends a test email to the provided address", async () => {
    vi.mocked(createTestEmail).mockResolvedValue("message-1");

    await expect(
      emailResolvers.Mutation.createTestEmail({}, { recipientEmail: "user@example.com" })
    ).resolves.toBe("message-1");
    expect(createTestEmail).toHaveBeenCalledExactlyOnceWith("user@example.com");
  });

  it("requires admin authorization", () => {
    expect(print(emailSchema)).toContain(
      'createTestEmail(recipientEmail: NonEmptyString!): String! @auth(requires: ["Perform Admin Action"])'
    );
  });
});
