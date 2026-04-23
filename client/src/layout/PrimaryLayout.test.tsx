import { describe, it, expect } from "vitest";
import { shouldHideSideNav } from "./PrimaryLayout";

describe("shouldHideSideNav", () => {
  describe("demonstration detail routes", () => {
    it("returns true for a numeric id", () => {
      expect(shouldHideSideNav("/demonstrations/123")).toBe(true);
    });

    it("returns true for a string id", () => {
      expect(shouldHideSideNav("/demonstrations/abc-def")).toBe(true);
    });

    it("returns false for a bare trailing slash", () => {
      expect(shouldHideSideNav("/demonstrations/")).toBe(false);
    });
  });

  describe("deliverable detail routes", () => {
    it("returns true for a numeric id", () => {
      expect(shouldHideSideNav("/deliverables/456")).toBe(true);
    });

    it("returns true for a string id", () => {
      expect(shouldHideSideNav("/deliverables/abc-def")).toBe(true);
    });

    it("returns false for a bare trailing slash", () => {
      expect(shouldHideSideNav("/deliverables/")).toBe(false);
    });
  });

  describe("list / other routes", () => {
    it("returns false for the demonstrations list page", () => {
      expect(shouldHideSideNav("/demonstrations")).toBe(false);
    });

    it("returns false for the deliverables list page", () => {
      expect(shouldHideSideNav("/deliverables")).toBe(false);
    });

    it("returns false for the root route", () => {
      expect(shouldHideSideNav("/")).toBe(false);
    });

    it("returns false for an unrelated route", () => {
      expect(shouldHideSideNav("/settings")).toBe(false);
    });
  });
});
