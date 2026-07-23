import { GraphQLContext } from "../../auth";
import { prisma } from "../../prismaClient";
import { buildRealtimeEmailEnvelope, enqueueRealtimeEmail } from "../../services/emailQueue";
import { TestEmailInput } from "./emailSchema";

export async function testEmail(
  input: TestEmailInput,
  context: GraphQLContext
): Promise<string> {
  const recipientUserIds = [...new Set(input.recipientUserIds)];
  if (recipientUserIds.length === 0) {
    throw new Error("Cannot test email without at least one recipient user.");
  }

  const recipientUsers = await prisma().user.findMany({
    where: { id: { in: recipientUserIds } },
    include: { person: true },
  });

  const usersById = new Map(recipientUsers.map((user) => [user.id, user]));
  const missingUserIds = recipientUserIds.filter((id) => !usersById.has(id));
  if (missingUserIds.length > 0) {
    throw new Error(`Cannot test email because recipient users were not found: ${missingUserIds.join(", ")}`);
  }

  const recipients = recipientUserIds.map((id) => {
    const user = usersById.get(id)!;
    const address = user.person.email.trim();
    if (!address) {
      throw new Error(`Cannot test email because recipient user ${id} has no email address.`);
    }

    return {
      name: `${user.person.firstName} ${user.person.lastName}`.trim(),
      address,
    };
  });

  const message = buildRealtimeEmailEnvelope({
    emailType: input.emailType,
    entityType: input.entityType,
    entityId: input.entityId,
    triggeredById: context.user.id,
    payload: {
      ...input.payload,
      recipients: {
        to: recipients,
      },
    },
  });

  return enqueueRealtimeEmail(message);
}
