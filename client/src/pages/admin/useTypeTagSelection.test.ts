import { describe, expect, it } from "vitest";
import {
  getSelectedTypeTag,
  isTypeTagSelected,
  TYPE_TAG_SEARCH_PARAM,
} from "./useTypeTagSelection";

const buildSearchParams = (typeTag: string): URLSearchParams =>
  new URLSearchParams(typeTag ? { [TYPE_TAG_SEARCH_PARAM]: typeTag } : {});

describe("getSelectedTypeTag", () => {
  it("returns the selected type/tag name", () => {
    expect(getSelectedTypeTag(buildSearchParams("Aggregate Cap"))).toBe("Aggregate Cap");
  });

  it("returns an empty name when no type/tag is selected", () => {
    expect(getSelectedTypeTag(buildSearchParams(""))).toBe("");
  });
});

describe("isTypeTagSelected", () => {
  it("is true when a type/tag name is in the search params", () => {
    expect(isTypeTagSelected(buildSearchParams("Aggregate Cap"))).toBe(true);
  });

  it("is false when no type/tag is selected", () => {
    expect(isTypeTagSelected(buildSearchParams(""))).toBe(false);
  });

  it("is false when the param is present but empty", () => {
    expect(isTypeTagSelected(new URLSearchParams(`${TYPE_TAG_SEARCH_PARAM}=`))).toBe(false);
  });
});
