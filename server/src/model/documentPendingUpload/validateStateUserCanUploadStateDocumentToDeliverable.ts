import { prisma } from "../../prismaClient";

export const validateStateUserCanUploadStateDocumentToDeliverable = async (
  userId: string,
  demonstrationId: string
) => {
  const roleAssignments = await prisma().demonstrationRoleAssignment.findMany({
    where: {
      personId: userId,
      roleId: "State Point of Contact",
    },
  });
  if (
    !roleAssignments.some((roleAssignment) => roleAssignment.demonstrationId === demonstrationId)
  ) {
    throw new Error("User does not have permission to upload documents to this deliverable.");
  }
};
