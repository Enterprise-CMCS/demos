import { faker } from "@faker-js/faker";
import { prisma } from "../prismaClient";
import { SystemRole, UserType } from "../types";
import { User as PrismaUser } from "@prisma/client";

const SYSTEM_ROLE_MAP: Record<UserType, SystemRole> = {
  "demos-admin": "Admin User",
  "demos-cms-user": "CMS User",
  "demos-state-user": "State User",
};

export const generateUser = async ({
  firstName,
  lastName,
  personTypeId,
}: {
  firstName: string;
  lastName: string;
  personTypeId: UserType;
}): Promise<PrismaUser> => {
  const email = `${firstName.toLocaleLowerCase()}.${lastName.toLocaleLowerCase()}@example.com`;
  const username = `${firstName.toLocaleLowerCase()}_${lastName.toLocaleLowerCase()}`;
  const person = await prisma().person.create({
    data: {
      personTypeId,
      email,
      firstName,
      lastName,
    },
  });
  const user = await prisma().user.create({
    data: {
      id: person.id,
      personTypeId,
      cognitoSubject: faker.string.uuid(),
      username,
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
  return user;
};
