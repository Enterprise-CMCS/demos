import { User as PrismaUser } from "@prisma/client";
import { UserType } from "../../types";
import { prisma } from "../../prismaClient";
import { faker } from "@faker-js/faker";

export const generateUser = async ({
  personId,
  username,
  personTypeId,
}: {
  personId: string;
  username: string;
  personTypeId: UserType;
}): Promise<PrismaUser> => {
  const user = await prisma().user.create({
    data: {
      id: personId,
      personTypeId,
      cognitoSubject: faker.string.uuid(),
      username,
    },
  });
  return user;
};
