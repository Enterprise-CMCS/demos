import { BudgetNeutralityWorkbook as PrismaBudgetNeutralityWorkbook, Prisma } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";

export async function deleteBudgetNeutralityWorkbook(
  where: Prisma.BudgetNeutralityWorkbookWhereUniqueInput,
  tx: PrismaTransactionClient
): Promise<PrismaBudgetNeutralityWorkbook> {
  return tx.budgetNeutralityWorkbook.delete({ where });
}
