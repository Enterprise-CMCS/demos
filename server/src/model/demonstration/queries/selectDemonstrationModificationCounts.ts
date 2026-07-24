import { prisma } from "../../../prismaClient";

export type DemonstrationModificationCounts = {
  id: string;
  amendmentCount: number;
  extensionCount: number;
};

export async function selectDemonstrationModificationCounts(
  demonstrationIds: string[],
): Promise<DemonstrationModificationCounts[]> {
  const rows = await prisma().demonstration.findMany({
    where: { id: { in: demonstrationIds } },
    select: {
      id: true,
      _count: {
        select: {
          amendments: true,
          extensions: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    amendmentCount: row._count.amendments,
    extensionCount: row._count.extensions,
  }));
}
