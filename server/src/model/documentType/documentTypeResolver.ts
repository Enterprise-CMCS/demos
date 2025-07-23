import { prisma } from "../../prismaClient.js";
import { DocumentType } from "@prisma/client";
import { AddDocumentTypeInput, UpdateDocumentTypeInput } from "./documentTypeSchema.js";

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

  Mutation: {
    addDocumentType: async (
      _: undefined,
      { input }: { input: AddDocumentTypeInput }
    ) => {
      return await prisma().documentType.create({
        data: {
          id: input.id,
          description: input.description
        }
      });
    },

    updateDocumentType: async (
      _: undefined,
      { id, input }: { id: string, input: UpdateDocumentTypeInput }
    ) => {
      return await prisma().documentType.update({
        where: { id: id },
        data: {
          description: input.description
        }
      });
    },

    deleteDocumentType: async (_: undefined, { id }: { id: string }) => {
      return await prisma().documentType.delete({
        where: { id: id },
      });
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
