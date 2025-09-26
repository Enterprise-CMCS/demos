import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GraphQLError } from "graphql";

// module under test
import { documentResolvers } from "./documentResolvers";

// mocks
vi.mock("../../prismaClient", () => ({
  prisma: () => mockedPrisma,
}));

const mockedPrisma: any = {
  document: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  documentPendingUpload: {
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  documentType: {
    findUnique: vi.fn(),
  },
  bundle: {
    findUnique: vi.fn(),
  },
};

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(() => Promise.resolve("https://signed.example/url")),
}));

vi.mock("../../errors/checkOptionalNotNullFields", () => ({
  checkOptionalNotNullFields: vi.fn(),
}));

vi.mock("../../errors/handlePrismaError", () => ({
  handlePrismaError: vi.fn((e: any) => {
    throw e;
  }),
}));

describe("documentResolvers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("Query.document returns a document when found", async () => {
    const fakeDoc = { id: "doc1", bundleId: "b1", ownerUserId: "u1", documentTypeId: "dt1" };
    mockedPrisma.document.findUnique.mockResolvedValueOnce(fakeDoc);

    const res = await (documentResolvers as any).Query.document(undefined, { id: "doc1" });
    expect(res).toEqual(fakeDoc);
    expect(mockedPrisma.document.findUnique).toHaveBeenCalledWith({ where: { id: "doc1" } });
  });

  it("Mutation.uploadDocument throws when context.user is null", async () => {
    await expect(
      (documentResolvers as any).Mutation.uploadDocument(undefined, { input: {} }, { user: null })
    ).rejects.toThrow("The GraphQL context does not have user information");
  });

  it("Mutation.uploadDocument creates pending upload and returns presignedURL", async () => {
    const fakePending = { id: "pending1" };
    mockedPrisma.documentPendingUpload.create.mockResolvedValueOnce(fakePending);

    const ctx = { user: { id: "u1" } };
    const input = { title: "t", description: "d", documentType: "dt1", bundleId: "b1" };

    const result = await (documentResolvers as any).Mutation.uploadDocument(undefined, { input }, ctx);
    expect(mockedPrisma.documentPendingUpload.create).toHaveBeenCalled();
    expect(result).toHaveProperty("presignedURL", "https://signed.example/url");
  });

  it("Mutation.downloadDocument throws GraphQLError when document not found", async () => {
    mockedPrisma.document.findUnique.mockResolvedValueOnce(null);
    await expect((documentResolvers as any).Mutation.downloadDocument(undefined, { id: "nope" })).rejects.toBeInstanceOf(
      GraphQLError
    );
  });

  it("Mutation.downloadDocument returns signed url when document exists", async () => {
    const doc = { id: "d1", bundleId: "b1" };
    mockedPrisma.document.findUnique.mockResolvedValueOnce(doc);
    const res = await (documentResolvers as any).Mutation.downloadDocument(undefined, { id: "d1" });
    expect(res).toBe("https://signed.example/url");
  });

  it("updateDocument calls prisma.update and returns document", async () => {
    const updated = { id: "d2" };
    mockedPrisma.document.update.mockResolvedValueOnce(updated);
    const res = await (documentResolvers as any).Mutation.updateDocument(undefined, { id: "d2", input: {} });
    expect(mockedPrisma.document.update).toHaveBeenCalled();
    expect(res).toEqual(updated);
  });

  it("deleteDocuments returns delete count", async () => {
    mockedPrisma.document.deleteMany.mockResolvedValueOnce({ count: 3 });
    const res = await (documentResolvers as any).Mutation.deleteDocuments(undefined, { ids: ["a", "b"] });
    expect(res).toBe(3);
  });

  it("Document.owner returns user merged with person", async () => {
    const user = { id: "u1", person: { firstName: "Sam" } };
    mockedPrisma.user.findUnique.mockResolvedValueOnce(user);
    const res = await (documentResolvers as any).Document.owner({ ownerUserId: "u1" });
    expect(res.firstName).toBe("Sam");
  });

  it("Document.documentType resolves through prisma.documentType.findUnique", async () => {
    const dt = { id: "dt1" };
    mockedPrisma.documentType.findUnique.mockResolvedValueOnce(dt);
    const res = await (documentResolvers as any).Document.documentType({ documentTypeId: "dt1" });
    expect(res).toEqual(dt);
  });

  it("Document.bundleType returns bundleType id via bundle lookup", async () => {
    // mock bundle.findUnique that returns bundleType.id
    mockedPrisma.bundle.findUnique.mockResolvedValueOnce({ bundleType: { id: "BT1" } });
    const res = await (documentResolvers as any).Document.bundleType({ bundleId: "b1" });
    expect(res).toBe("BT1");
  });
});
