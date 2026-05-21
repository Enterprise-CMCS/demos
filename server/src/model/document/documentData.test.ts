import { Document as PrismaDocument, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { getDocument, getManyDocuments } from "./documentData";
import { selectDocument, selectManyDocuments } from "./queries";
import { log } from "../../log";

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
}));

describe("documentData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: ["View Documents on Assigned Demonstrations"],
  };

  const where: Prisma.DocumentWhereInput = {
    id: "document-1",
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
});
