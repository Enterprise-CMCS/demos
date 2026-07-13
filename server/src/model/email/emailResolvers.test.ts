import { describe, expect, it, vi } from "vitest";
import { GraphQLContext } from "../../auth";
import { createEmail } from "./createEmail";
import { emailResolvers } from "./emailResolvers";
import { CreateEmailInput } from "./emailSchema";

vi.mock("./createEmail", () => ({
  createEmail: vi.fn(),
}));

describe("emailResolvers", () => {
  it("exposes createEmail as a GraphQL mutation resolver", async () => {
    const input: CreateEmailInput = {
      emailType: "Deliverable Created",
      entityType: "deliverable",
      entityId: "deliverable-1",
      payload: { name: "Quarterly Report" },
    };
    const context = { user: { id: "user-1" } } as GraphQLContext;
    vi.mocked(createEmail).mockResolvedValue("message-1");

    await expect(emailResolvers.Mutation.createEmail({}, { input }, context)).resolves.toBe(
      "message-1"
    );
    expect(createEmail).toHaveBeenCalledExactlyOnceWith(input, context);
  });
});
