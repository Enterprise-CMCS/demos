import { Person as PrismaPerson } from "@prisma/client";
import { SystemRole, UserType } from "../../types";
import { prisma } from "../../prismaClient";

const SYSTEM_ROLE_MAP: Record<UserType, SystemRole> = {
  "demos-admin": "Admin User",
  "demos-cms-user": "CMS User",
  "demos-state-user": "State User",
};

export const generatePerson = async ({
  firstName,
  lastName,
  email,
  personTypeId,
}: {
  firstName: string;
  lastName: string;
  email: string;
  personTypeId: UserType;
}): Promise<PrismaPerson> => {
  const person = await prisma().person.create({
    data: {
      personTypeId,
      email,
      firstName,
      lastName,
    },
  });

  await prisma().systemRoleAssignment.create({
    data: {
      personId: person.id,
      personTypeId,
      roleId: SYSTEM_ROLE_MAP[personTypeId],
      grantLevelId: "System",
    },
  });
  return person;
};
