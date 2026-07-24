import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Deliverable as PrismaDeliverable,
  Demonstration as PrismaDemonstration,
  Document as PrismaDocument,
} from "@prisma/client";
import type { ContextUser } from "../auth";
import { createLoaders, requireLoaders } from ".";
import { selectManyDemonstrations } from "../model/demonstration/queries/selectManyDemonstrations";
import { selectManyDeliverables } from "../model/deliverable/queries/selectManyDeliverables";
import { selectManyStates } from "../model/state/queries/selectManyStates";
import { selectManyUsers } from "../model/user/queries/selectManyUsers";
import { selectManyPeople } from "../model/person/queries/selectManyPeople";
import { selectDocumentTypesForDeliverableTypes } from "../model/deliverableTypeDocumentType/selectDocumentTypesForDeliverableTypes";
import { getManyDocuments } from "../model/document/documentData";

vi.mock("../model/demonstration/queries/selectManyDemonstrations", () => ({
  selectManyDemonstrations: vi.fn(),
}));
vi.mock("../model/deliverable/queries/selectManyDeliverables", () => ({
  selectManyDeliverables: vi.fn(),
}));
vi.mock("../model/state/queries/selectManyStates", () => ({
  selectManyStates: vi.fn(),
}));
vi.mock("../model/user/queries/selectManyUsers", () => ({
  selectManyUsers: vi.fn(),
}));
vi.mock("../model/person/queries/selectManyPeople", () => ({
  selectManyPeople: vi.fn(),
}));
vi.mock("../model/deliverableTypeDocumentType/selectDocumentTypesForDeliverableTypes", () => ({
  selectDocumentTypesForDeliverableTypes: vi.fn(),
}));
vi.mock("../model/document/documentData", () => ({
  getManyDocuments: vi.fn(),
}));

const mockUser = {} as unknown as ContextUser;

describe("createLoaders", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("batches by-id loads into a single IN query and re-indexes rows by id", async () => {
    // Returned out of order, and "c" is intentionally absent.
    vi.mocked(selectManyDemonstrations).mockResolvedValue([
      { id: "b" },
      { id: "a" },
    ] as unknown as PrismaDemonstration[]);

    const loaders = createLoaders(mockUser);
    const [a, b, missing] = await Promise.all([
      loaders.demonstrationById.load("a"),
      loaders.demonstrationById.load("b"),
      loaders.demonstrationById.load("c"),
    ]);

    expect(selectManyDemonstrations).toHaveBeenCalledExactlyOnceWith({
      id: { in: ["a", "b", "c"] },
    });
    expect(a).toEqual({ id: "a" });
    expect(b).toEqual({ id: "b" });
    expect(missing).toBeNull();
  });

  it("groups by-foreign-key loads and returns [] for keys with no rows", async () => {
    vi.mocked(selectManyDeliverables).mockResolvedValue([
      { id: "d1", demonstrationId: "x" },
      { id: "d2", demonstrationId: "x" },
      { id: "d3", demonstrationId: "y" },
    ] as unknown as PrismaDeliverable[]);

    const loaders = createLoaders(mockUser);
    const [x, y, z] = await Promise.all([
      loaders.deliverablesByDemonstrationId.load("x"),
      loaders.deliverablesByDemonstrationId.load("y"),
      loaders.deliverablesByDemonstrationId.load("z"),
    ]);

    expect(selectManyDeliverables).toHaveBeenCalledExactlyOnceWith({
      demonstrationId: { in: ["x", "y", "z"] },
    });
    expect(x).toEqual([
      { id: "d1", demonstrationId: "x" },
      { id: "d2", demonstrationId: "x" },
    ]);
    expect(y).toEqual([{ id: "d3", demonstrationId: "y" }]);
    expect(z).toEqual([]);
  });

  it("keys the owned-deliverables loader on cmsOwnerUserId", async () => {
    vi.mocked(selectManyDeliverables).mockResolvedValue([
      { id: "d1", cmsOwnerUserId: "u1" },
    ] as unknown as PrismaDeliverable[]);

    const loaders = createLoaders(mockUser);
    const result = await loaders.deliverablesByCmsOwnerId.load("u1");

    expect(selectManyDeliverables).toHaveBeenCalledExactlyOnceWith({
      cmsOwnerUserId: { in: ["u1"] },
    });
    expect(result).toEqual([{ id: "d1", cmsOwnerUserId: "u1" }]);
  });

  it("wires the remaining by-id loaders to their query functions", async () => {
    vi.mocked(selectManyUsers).mockResolvedValue([]);
    vi.mocked(selectManyStates).mockResolvedValue([]);
    vi.mocked(selectManyPeople).mockResolvedValue([]);

    const loaders = createLoaders(mockUser);
    await Promise.all([
      loaders.userById.load("u1"),
      loaders.stateById.load("NC"),
      loaders.personById.load("p1"),
    ]);

    expect(selectManyUsers).toHaveBeenCalledExactlyOnceWith({ id: { in: ["u1"] } });
    expect(selectManyStates).toHaveBeenCalledExactlyOnceWith({ id: { in: ["NC"] } });
    expect(selectManyPeople).toHaveBeenCalledExactlyOnceWith({ id: { in: ["p1"] } });
  });

  it("threads the request user into authorization-scoped loaders and groups by foreign key", async () => {
    vi.mocked(getManyDocuments).mockResolvedValue([
      { id: "doc1", applicationId: "app1" },
      { id: "doc2", applicationId: "app2" },
    ] as unknown as PrismaDocument[]);

    const loaders = createLoaders(mockUser);
    const [app1, app2] = await Promise.all([
      loaders.documentsByApplicationId.load("app1"),
      loaders.documentsByApplicationId.load("app2"),
    ]);

    expect(getManyDocuments).toHaveBeenCalledExactlyOnceWith(
      { applicationId: { in: ["app1", "app2"] } },
      mockUser
    );
    expect(app1).toEqual([{ id: "doc1", applicationId: "app1" }]);
    expect(app2).toEqual([{ id: "doc2", applicationId: "app2" }]);
  });

  it("groups allowed document types by deliverable type id", async () => {
    vi.mocked(selectDocumentTypesForDeliverableTypes).mockResolvedValue([
      { deliverableTypeId: "type1", documentTypeId: "General File" },
      { deliverableTypeId: "type1", documentTypeId: "Signed Approval Package" },
    ]);

    const loaders = createLoaders(mockUser);
    const [type1, type2] = await Promise.all([
      loaders.documentTypesByDeliverableTypeId.load("type1"),
      loaders.documentTypesByDeliverableTypeId.load("type2"),
    ]);

    expect(selectDocumentTypesForDeliverableTypes).toHaveBeenCalledExactlyOnceWith([
      "type1",
      "type2",
    ]);
    expect(type1).toEqual(["General File", "Signed Approval Package"]);
    expect(type2).toEqual([]);
  });
});

describe("requireLoaders", () => {
  it("returns the loaders when present", () => {
    const loaders = createLoaders(mockUser);
    expect(requireLoaders({ loaders })).toBe(loaders);
  });

  it("throws when loaders are missing", () => {
    expect(() => requireLoaders({})).toThrow(
      "GraphQL context was constructed without DataLoaders."
    );
  });
});
