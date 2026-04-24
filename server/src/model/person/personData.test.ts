import { Person as PrismaPerson, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPerson, getManyPeople } from "./personData";
import { selectPerson, selectManyPeople } from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectPerson: vi.fn(),
  selectManyPeople: vi.fn(),
}));

describe("personData", () => {
  const where: Prisma.PersonWhereInput = {
    id: "NC",
  };

  const authorizedWhereClause: Prisma.PersonWhereInput = {
    id: "SC",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPerson", () => {
    it("queries for a single person", async () => {
      const person = { id: "NC" } as PrismaPerson;
      vi.mocked(selectPerson).mockResolvedValueOnce(person);

      const result = await getPerson(where);

      expect(selectPerson).toHaveBeenCalledExactlyOnceWith(where, undefined);
      expect(result).toBe(person);
    });

    it("passes transaction client to selectPerson if provided", async () => {
      const mockTransactionClient = {} as any;

      await getPerson(where, mockTransactionClient);
      expect(selectPerson).toHaveBeenCalledExactlyOnceWith(where, mockTransactionClient);
    });
  });

  describe("getManyPeople", () => {
    it("queries for many people", async () => {
      const people = [{ id: "NC" }, { id: "SC" }] as PrismaPerson[];
      vi.mocked(selectManyPeople).mockResolvedValueOnce(people);

      const result = await getManyPeople(where);
      expect(selectManyPeople).toHaveBeenCalledExactlyOnceWith(where, undefined);
      expect(result).toBe(people);
    });

    it("passes transaction client to selectManyDemonstrations if provided", async () => {
      const mockTransactionClient = {} as any;

      await getManyPeople(where, mockTransactionClient);
      expect(selectManyPeople).toHaveBeenCalledExactlyOnceWith(where, mockTransactionClient);
    });
  });
});
