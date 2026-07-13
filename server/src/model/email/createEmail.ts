import { GraphQLContext } from "../../auth";
import { prisma } from "../../prismaClient";
import { buildRealtimeEmailEnvelope, enqueueRealtimeEmail } from "../../services/emailQueue";
import { CreateEmailInput } from "./emailSchema";

export async function createEmail(
  input: CreateEmailInput,
  context: GraphQLContext
): Promise<string> {
  const currentUser = await prisma().user.findUniqueOrThrow({
    where: { id: context.user.id },
    include: { person: true },
  });
  const currentUserEmail = currentUser.person.email.trim();
  if (!currentUserEmail) {
    throw new Error("Cannot create email because the current user email is missing.");
  }

  const message = buildRealtimeEmailEnvelope({
    ...input,
    payload: {
      ...input.payload,
      to: currentUserEmail,
    },
  });

  return enqueueRealtimeEmail(message);
}
