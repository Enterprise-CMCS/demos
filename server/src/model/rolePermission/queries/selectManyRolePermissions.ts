import { Prisma, RolePermission as PrismaRolePermission } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyRolePermissions(
  where: Prisma.RolePermissionWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaRolePermission[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.rolePermission.findMany({ where: where });
}
