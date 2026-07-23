import { describe, expect, it, vi } from "vitest";
import { GraphQLContext } from "../../auth";
import { testEmail } from "./testEmail";
import { emailResolvers } from "./emailResolvers";
import { TestEmailInput } from "./emailSchema";

vi.mock("./testEmail", () => ({
  testEmail: vi.fn(),
}));

describe("emailResolvers", () => {
  it("exposes testEmail as a GraphQL mutation resolver", async () => {
    const input: TestEmailInput = {
      emailType: "Deliverable Created",
      entityType: "deliverable",
      entityId: "deliverable-1",
      recipientUserIds: ["recipient-1"],
      payload: { name: "Quarterly Report" },
    };
    const context = { user: { id: "user-1" } } as GraphQLContext;
    vi.mocked(testEmail).mockResolvedValue("message-1");

    await expect(emailResolvers.Mutation.testEmail({}, { input }, context)).resolves.toBe(
      "message-1"
    );
    expect(testEmail).toHaveBeenCalledExactlyOnceWith(input, context);
  });
});
