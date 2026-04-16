import { Document as PrismaDocument, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter } from "../../auth/buildAuthorizationFilter.js";
import { getDocument, getManyDocuments } from "./documentData.js";
import { selectDocument } from "./queries/selectDocument.js";
import { selectManyDocuments } from "./queries/selectManyDocuments.js";
import { ContextUser } from "../../auth/userContext.js";

vi.mock("../../auth/buildAuthorizationFilter.js", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries/selectDocument.js", () => ({
  selectDocument: vi.fn(),
}));

vi.mock("./queries/selectManyDocuments.js", () => ({
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
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getDocument(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDocument).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single document with the authorization filter applied", async () => {
      const document = { id: "document-1" } as PrismaDocument;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDocument).mockResolvedValueOnce(document);

      const result = await getDocument(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectDocument).toHaveBeenCalledExactlyOnceWith({
        AND: [where, authFilter],
      });
      expect(result).toBe(document);
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
      expect(selectManyDocuments).toHaveBeenCalledExactlyOnceWith({
        AND: [where, authFilter],
      });
      expect(result).toBe(documents);
    });
  });
});
