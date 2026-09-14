import { describe, it, expect } from "vitest";
import { config } from "./vite.config";

describe("vite.config defines", () => {
  it("should have all define constants declared in vite-env.d.ts", () => {
    const resolvedConfig = config({ command: "serve", mode: "development" });
    const defineKeys = Object.keys(resolvedConfig.define || {})
      .filter((k) => k.startsWith("__"))
      .sort();

    const declaredInTypes = [
      "__GIT_COMMIT__",
      "__DEMOS_VERSION__",
      "__FEATURE_SHOW_GIT_VERSION__",
    ].sort();

    expect(defineKeys).toEqual(declaredInTypes);
  });
});
