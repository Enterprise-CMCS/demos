import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Deliverable as PrismaDeliverable,
  Demonstration as PrismaDemonstration,
} from "@prisma/client";
import { createLoaders, requireLoaders } from ".";
import { selectManyDemonstrations } from "../model/demonstration/queries/selectManyDemonstrations";
import { selectManyDeliverables } from "../model/deliverable/queries/selectManyDeliverables";
import { selectManyStates } from "../model/state/queries/selectManyStates";
import { selectManyUsers } from "../model/user/queries/selectManyUsers";

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

    const loaders = createLoaders();
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

    const loaders = createLoaders();
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

    const loaders = createLoaders();
    const result = await loaders.deliverablesByCmsOwnerId.load("u1");

    expect(selectManyDeliverables).toHaveBeenCalledExactlyOnceWith({
      cmsOwnerUserId: { in: ["u1"] },
    });
    expect(result).toEqual([{ id: "d1", cmsOwnerUserId: "u1" }]);
  });

  it("wires the remaining by-id loaders to their query functions", async () => {
    vi.mocked(selectManyUsers).mockResolvedValue([]);
    vi.mocked(selectManyStates).mockResolvedValue([]);

    const loaders = createLoaders();
    await Promise.all([loaders.userById.load("u1"), loaders.stateById.load("NC")]);

    expect(selectManyUsers).toHaveBeenCalledExactlyOnceWith({ id: { in: ["u1"] } });
    expect(selectManyStates).toHaveBeenCalledExactlyOnceWith({ id: { in: ["NC"] } });
  });
});

describe("requireLoaders", () => {
  it("returns the loaders when present", () => {
    const loaders = createLoaders();
    expect(requireLoaders({ loaders })).toBe(loaders);
  });

  it("throws when loaders are missing", () => {
    expect(() => requireLoaders({})).toThrow(
      "GraphQL context was constructed without DataLoaders."
    );
  });
});
