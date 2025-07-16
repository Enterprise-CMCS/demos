import { prisma } from "../../prismaClient.js";
import { DocumentType } from "@prisma/client";

export const documentTypeResolvers = {
  Query: {
    documentType: async (_: undefined, { id }: { id: string }) => {
      return await prisma().documentType.findUnique({
        where: { id: id },
      });
    },
    documentTypes: async () => {
      return await prisma().documentType.findMany();
    }
  },

  DocumentType: {
    documents: async(parent: DocumentType) => {
      return await prisma().document.findMany({
        where: {
          documentType: {
            id: parent.id
          }
        }
      });
    }
  }
};
