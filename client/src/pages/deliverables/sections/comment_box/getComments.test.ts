import { describe, expect, it } from "vitest";
import { getComments } from "./getComments";

describe("getComments", () => {
  it("returns only public comments for state users", () => {
    const comments = getComments("demos-state-user");
    expect(comments.every((c) => c.commentVisibility === "public")).toBe(true);
  });

  it("returns both public and private comments for admin users", () => {
    const comments = getComments("demos-admin");
    expect(comments.some((c) => c.commentVisibility === "public")).toBe(true);
    expect(comments.some((c) => c.commentVisibility === "private")).toBe(true);
  });

  it("returns both public and private comments for CMS users", () => {
    const comments = getComments("demos-cms-user");
    expect(comments.some((c) => c.commentVisibility === "public")).toBe(true);
    expect(comments.some((c) => c.commentVisibility === "private")).toBe(true);
  });
});
