import { describe, it, expect } from "vitest";
import { resolveBundleStatus } from "./bundleStatusResolvers";

describe("resolveBundleStatus", () => {
  it("returns parent.statusId for Demonstration", async () => {
    const demo = { statusId: "S1" } as any;
    const res = await resolveBundleStatus(demo);
    expect(res).toBe("S1");
  });

  it("returns parent.statusId for Modification", async () => {
    const mod = { statusId: "M1" } as any;
    const res = await resolveBundleStatus(mod);
    expect(res).toBe("M1");
  });
});
