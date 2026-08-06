import { describe, expect, it, vi } from "vitest";
import { GraphQLContext } from "../../auth";
import { createTestEmail } from "./createTestEmail";
import { emailResolvers } from "./emailResolvers";
import { CreateTestEmailInput } from "./emailSchema";

vi.mock("./createTestEmail", () => ({
  createTestEmail: vi.fn(),
}));

describe("emailResolvers", () => {
  it("exposes createTestEmail as a GraphQL mutation resolver", async () => {
    const input: CreateTestEmailInput = {
      emailType: "Deliverable Created",
      entityType: "deliverable",
      entityId: "deliverable-1",
      recipientUserIds: ["recipient-1"],
      payload: { name: "Quarterly Report" },
    };
    const context = { user: { id: "user-1" } } as GraphQLContext;
    vi.mocked(createTestEmail).mockResolvedValue("message-1");

    await expect(emailResolvers.Mutation.createTestEmail({}, { input }, context)).resolves.toBe(
      "message-1"
    );
    expect(createTestEmail).toHaveBeenCalledExactlyOnceWith(input, context);
  });
});
