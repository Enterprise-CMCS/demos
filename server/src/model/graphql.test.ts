import { describe, it, expect } from "vitest";
import { typeDefs, resolvers } from "./graphql.js";

import { bundleResolvers } from "./bundle/bundleResolvers.js";
import { bundlePhaseResolvers } from "./bundlePhase/bundlePhaseResolvers.js";
import { bundlePhaseDateResolvers } from "./bundlePhaseDate/bundlePhaseDateResolvers.js";
import { demonstrationResolvers } from "./demonstration/demonstrationResolvers.js";
import { documentResolvers } from "./document/documentResolvers.js";
import { eventResolvers } from "./event/index.js";
import { modificationResolvers } from "./modification/modificationResolvers.js";
import { stateResolvers } from "./state/stateResolvers.js";
import { userResolvers } from "./user/userResolvers.js";
import { personResolvers } from "./person/personResolvers.js";
import { demonstrationRoleAssigmentResolvers } from "./demonstrationRoleAssignment/demonstrationRoleAssignmentResolvers.js";

describe("model/graphql.ts exports", () => {
  it("exports typeDefs array with expected length", () => {
    expect(Array.isArray(typeDefs)).toBe(true);
    // The project includes many schemas + scalars + mock extension
    expect(typeDefs.length).toBeGreaterThanOrEqual(20);
  });

  it("includes the mock Demonstration extension in typeDefs", () => {
    const hasContact = typeDefs.some((def: any) => {
      // If the def is a string (SDL), search it directly
      if (typeof def === "string") {
        return def.includes("type Contact") || def.includes("extend type Demonstration");
      }

      // If it's a DocumentNode, the SDL is available at def.loc.source.body
      if (def && def.loc && def.loc.source && typeof def.loc.source.body === "string") {
        return def.loc.source.body.includes("type Contact") || def.loc.source.body.includes("extend type Demonstration");
      }

      // Fallback: inspect definitions for a Contact type or an extension
      try {
        if (def && Array.isArray(def.definitions)) {
          return def.definitions.some((d: any) => {
            return (
              (d.kind === "ObjectTypeDefinition" && d.name && d.name.value === "Contact") ||
              (d.kind === "ObjectTypeExtension" && d.name && d.name.value === "Demonstration")
            );
          });
        }
      } catch (e) {
        // ignore
      }

      return false;
    });
    expect(hasContact).toBe(true);
  });

  it("exports resolvers array with expected resolver objects", () => {
    expect(Array.isArray(resolvers)).toBe(true);
    // Should include the main resolver modules
    expect(resolvers).toContain(bundleResolvers);
    expect(resolvers).toContain(bundlePhaseResolvers);
    expect(resolvers).toContain(bundlePhaseDateResolvers);
    expect(resolvers).toContain(demonstrationResolvers);
    expect(resolvers).toContain(documentResolvers);
    expect(resolvers).toContain(eventResolvers);
    expect(resolvers).toContain(modificationResolvers);
    expect(resolvers).toContain(stateResolvers);
    expect(resolvers).toContain(userResolvers);
    expect(resolvers).toContain(personResolvers);
    expect(resolvers).toContain(demonstrationRoleAssigmentResolvers);

    // There should also be a mock extension resolver that adds Demonstration.contacts
    const mockExt = resolvers.find((r) => (r as any).Demonstration && (r as any).Demonstration.contacts);
    expect(mockExt).toBeDefined();
    expect(typeof (mockExt as any).Demonstration.contacts).toBe("function");
  });
});
