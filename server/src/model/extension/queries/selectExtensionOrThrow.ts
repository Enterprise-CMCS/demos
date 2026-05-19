import { Prisma, Extension as PrismaExtension } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { selectExtension } from "./selectExtension";

export async function selectExtensionOrThrow(
  filter: Prisma.ExtensionWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaExtension> {
  const extension = await selectExtension(filter, tx);
  if (!extension) {
    throw new Error("No extension found matching the provided filter");
  }
  return extension;
}
