import { Document as PrismaDocument, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { editDocument, getDocument, getManyDocuments, removeDocument } from "./documentData";
import { selectDocument, selectManyDocuments, updateDocument } from "./queries";
import { log } from "../../log";
import { PrismaTransactionClient } from "../../prismaClient";
import { handleDeleteDocument } from "./handleDeleteDocument";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("../../log", () => ({
  log: {
    warn: vi.fn(),
  },
}));

vi.mock("./queries", () => ({
  selectDocument: vi.fn(),
  selectManyDocuments: vi.fn(),
  updateDocument: vi.fn(),
}));

vi.mock("./handleDeleteDocument", () => ({
  handleDeleteDocument: vi.fn(),
}));

describe("documentData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: [],
  };

  const authorizedWhereClause: Prisma.DocumentWhereInput = {
    id: "abc123",
  };

  const authFilter = {
    OR: [authorizedWhereClause],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDocument", () => {
    const where: Prisma.DocumentWhereInput = {
      id: "document-1",
    };
    it("throws not found error when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);
      vi.mocked(selectDocument).mockResolvedValueOnce(null);

      await expect(getDocument(where, user)).rejects.toThrow(
        "Requested Document not found or User does not have Permission to view it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDocument).toHaveBeenCalledExactlyOnceWith(where, undefined);
    });

    it("throws not found error when document is not found even if auth filter is applied", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDocument).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await expect(getDocument(where, user)).rejects.toThrow(
        "Requested Document not found or User does not have Permission to view it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledExactlyOnceWith(user, expect.any(Function));

      expect(selectDocument).toHaveBeenNthCalledWith(
        1,
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(selectDocument).toHaveBeenNthCalledWith(2, where, undefined);
    });

    it("logs a warning and throws not found error when document is found but user does not have permission to view it", async () => {
      const document = { id: "document-1" } as PrismaDocument;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDocument).mockResolvedValueOnce(null).mockResolvedValueOnce(document);

      await expect(getDocument(where, user)).rejects.toThrow(
        "Requested Document not found or User does not have Permission to view it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectDocument).toHaveBeenNthCalledWith(
        1,
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(selectDocument).toHaveBeenNthCalledWith(2, where, undefined);
      expect(log.warn).toHaveBeenCalledExactlyOnceWith(
        `User ${user.id} attempted to access Document ${document.id} without sufficient permissions.`
      );
    });

    it("returns the document when found and user has permission to view it", async () => {
      const document = { id: "document-1" } as PrismaDocument;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDocument).mockResolvedValueOnce(document);

      const result = await getDocument(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectDocument).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(document);
    });

    it("passes transaction client to selectDocument if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      const document = { id: "document-1" } as PrismaDocument;
      vi.mocked(selectDocument).mockResolvedValueOnce(document);

      await getDocument(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDocument).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyDocuments", () => {
    const where: Prisma.DocumentWhereInput = {
      id: "document-1",
    };
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyDocuments(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyDocuments).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many documents with the authorization filter applied", async () => {
      const documents = [{ id: "document-1" }, { id: "document-2" }] as PrismaDocument[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyDocuments).mockResolvedValueOnce(documents);

      const result = await getManyDocuments(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyDocuments).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(documents);
    });

    it("passes transaction client to selectManyDemonstrations if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyDocuments(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyDocuments).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("editDocument", () => {
    const where: Prisma.DocumentWhereUniqueInput = {
      id: "document-1",
    };

    it("throws not found error when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);
      vi.mocked(selectDocument).mockResolvedValueOnce(null);

      await expect(editDocument(where, { name: "Updated Name" }, user)).rejects.toThrow(
        "Requested Document not found or User does not have Permission to edit it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDocument).toHaveBeenCalledExactlyOnceWith(where, undefined);
    });

    it("throws not found error when document is not found even if auth filter is applied", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDocument).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await expect(editDocument(where, { name: "Updated Name" }, user)).rejects.toThrow(
        "Requested Document not found or User does not have Permission to edit it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledExactlyOnceWith(user, expect.any(Function));

      expect(selectDocument).toHaveBeenNthCalledWith(
        1,
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(selectDocument).toHaveBeenNthCalledWith(2, where, undefined);
    });

    it("logs a warning and throws not found error when document is found but user does not have permission to edit it", async () => {
      const document = { id: "document-1" } as PrismaDocument;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDocument).mockResolvedValueOnce(null).mockResolvedValueOnce(document);

      await expect(editDocument(where, { name: "Updated Name" }, user)).rejects.toThrow(
        "Requested Document not found or User does not have Permission to edit it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectDocument).toHaveBeenNthCalledWith(
        1,
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(selectDocument).toHaveBeenNthCalledWith(2, where, undefined);
      expect(log.warn).toHaveBeenCalledExactlyOnceWith(
        `User ${user.id} attempted to edit Document ${document.id} without sufficient permissions.`
      );
    });

    it("edits and returns the document when found and user has permission to edit it", async () => {
      const document = { id: "document-1" } as PrismaDocument;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDocument).mockResolvedValueOnce(document);
      vi.mocked(updateDocument).mockResolvedValueOnce({ ...document, name: "Updated Name" });

      const result = await editDocument(where, { name: "Updated Name" }, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(updateDocument).toHaveBeenCalledExactlyOnceWith(
        where,
        { name: "Updated Name" },
        undefined
      );
      expect(result).toStrictEqual({ ...document, name: "Updated Name" });
    });

    it("passes transaction client to updateDocument if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      const document = { id: "document-1" } as PrismaDocument;
      vi.mocked(selectDocument).mockResolvedValueOnce(document);

      await editDocument(where, { name: "Updated Name" }, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(updateDocument).toHaveBeenCalledExactlyOnceWith(
        where,
        {
          name: "Updated Name",
        },
        mockTransactionClient
      );
    });
  });

  describe("removeDocument", () => {
    const mockTransaction = {} as PrismaTransactionClient;

    const where: Prisma.DocumentWhereUniqueInput = {
      id: "document-1",
    };

    it("throws not found error when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);
      vi.mocked(selectDocument).mockResolvedValueOnce(null);

      await expect(removeDocument(where, user, mockTransaction)).rejects.toThrow(
        "Requested Document not found or User does not have Permission to delete it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDocument).toHaveBeenCalledExactlyOnceWith(where, mockTransaction);
    });

    it("throws not found error when document is not found even if auth filter is applied", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDocument).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await expect(removeDocument(where, user, mockTransaction)).rejects.toThrow(
        "Requested Document not found or User does not have Permission to delete it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledExactlyOnceWith(user, expect.any(Function));

      expect(selectDocument).toHaveBeenNthCalledWith(
        1,
        {
          AND: [where, authFilter],
        },
        mockTransaction
      );
      expect(selectDocument).toHaveBeenNthCalledWith(2, where, mockTransaction);
    });

    it("logs a warning and throws not found error when document is found but user does not have permission to delete it", async () => {
      const document = { id: "document-1" } as PrismaDocument;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDocument).mockResolvedValueOnce(null).mockResolvedValueOnce(document);

      await expect(removeDocument(where, user, mockTransaction)).rejects.toThrow(
        "Requested Document not found or User does not have Permission to delete it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectDocument).toHaveBeenNthCalledWith(
        1,
        {
          AND: [where, authFilter],
        },
        mockTransaction
      );
      expect(selectDocument).toHaveBeenNthCalledWith(2, where, mockTransaction);
      expect(log.warn).toHaveBeenCalledExactlyOnceWith(
        `User ${user.id} attempted to delete Document ${document.id} without sufficient permissions.`
      );
    });

    it("deletes and returns the document when found and user has permission to delete it", async () => {
      const document = { id: "document-1" } as PrismaDocument;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDocument).mockResolvedValueOnce(document);
      vi.mocked(handleDeleteDocument).mockResolvedValueOnce(document);

      const result = await removeDocument(where, user, mockTransaction);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(handleDeleteDocument).toHaveBeenCalledExactlyOnceWith(where, mockTransaction);
      expect(result).toStrictEqual(document);
    });
  });
});
