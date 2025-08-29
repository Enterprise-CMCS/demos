import { Contact } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { CreateContactInput } from "./contactSchema.js";
import { BUNDLE_TYPE } from "../bundleType/bundleTypeSchema.js";

async function getBundleTypeId(bundleId: string) {
  const result = await prisma().bundle.findUnique({
    where: { id: bundleId },
    select: {
      bundleType: {
        select: {
          id: true,
        },
      },
    },
  });
  return result!.bundleType.id;
}

export const contactResolvers = {
  Query: {
    contact: async (_: undefined, { id }: { id: string }) => {
      return await prisma().contact.findUnique({
        where: { id: id },
      });
    },
    contacts: async () => {
      return await prisma().contact.findMany();
    },
  },

  Mutation: {
    createContact: async (_: undefined, { input }: { input: CreateContactInput }) => {
      return await prisma().contact.create({
        data: input,
      });
    },

    deleteContacts: async (_: undefined, { ids }: { ids: string[] }) => {
      const contactResults = await prisma().contact.deleteMany({
        where: { id: { in: ids } },
      });
      return contactResults.count;
    },
  },

  Contact: {
    user: async (parent: Contact) => {
      return await prisma().user.findUnique({
        where: { id: parent.userId },
      });
    },
    contactType: async (parent: Contact) => {
      return await prisma().contactType.findUnique({
        where: { id: parent.contactTypeId },
      });
    },
    bundle: async (parent: Contact) => {
      const bundleTypeId = await getBundleTypeId(parent.bundleId);
      if (bundleTypeId === BUNDLE_TYPE.DEMONSTRATION) {
        return await prisma().demonstration.findUnique({
          where: { id: parent.bundleId },
        });
      } else if (bundleTypeId === BUNDLE_TYPE.AMENDMENT) {
        return await prisma().modification.findUnique({
          where: {
            id: parent.bundleId,
            bundleTypeId: BUNDLE_TYPE.AMENDMENT,
          },
        });
      } else if (bundleTypeId === BUNDLE_TYPE.EXTENSION) {
        return await prisma().modification.findUnique({
          where: {
            id: parent.bundleId,
            bundleTypeId: BUNDLE_TYPE.EXTENSION,
          },
        });
      } else {
        return null;
      }
    },
  },
};
