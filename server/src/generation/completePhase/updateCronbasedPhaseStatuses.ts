import { prisma } from "../../prismaClient";

export const updateCronbasedPhaseStatuses = async () => {
  await prisma().$executeRawUnsafe("CALL demos_app.update_federal_comment_phase_status()");
};
