import DataLoader from "dataloader";
import {
  Deliverable as PrismaDeliverable,
  Demonstration as PrismaDemonstration,
  State as PrismaState,
  User as PrismaUser,
} from "@prisma/client";
import { selectManyDemonstrations } from "../model/demonstration/queries/selectManyDemonstrations";
import { selectManyDeliverables } from "../model/deliverable/queries/selectManyDeliverables";
import { selectManyStates } from "../model/state/queries/selectManyStates";
import { selectManyUsers } from "../model/user/queries/selectManyUsers";

/**
 * Builds a loader that returns a single row per key by coalescing every key
 * requested in the same tick into one `WHERE id IN (...)` query. Keys with no
 * matching row resolve to `null`. Results are re-indexed by id, so the order in
 * which the database returns rows does not matter.
 */
function byIdLoader<T extends { id: string }>(
  batch: (ids: string[]) => Promise<T[]>
): DataLoader<string, T | null> {
  return new DataLoader<string, T | null>(async (ids) => {
    const rows = await batch([...ids]);
    const rowsById = new Map(rows.map((row) => [row.id, row]));
    return ids.map((id) => rowsById.get(id) ?? null);
  });
}

/**
 * Builds a loader that returns an array of rows per key by coalescing every key
 * requested in the same tick into one `WHERE <foreignKey> IN (...)` query and
 * grouping the results. Keys with no matching rows resolve to an empty array.
 */
function byForeignKeyLoader<T>(
  batch: (keys: string[]) => Promise<T[]>,
  keyOf: (row: T) => string
): DataLoader<string, T[]> {
  return new DataLoader<string, T[]>(async (keys) => {
    const rows = await batch([...keys]);
    const rowsByKey = new Map<string, T[]>();
    for (const row of rows) {
      const key = keyOf(row);
      const bucket = rowsByKey.get(key);
      if (bucket) {
        bucket.push(row);
      } else {
        rowsByKey.set(key, [row]);
      }
    }
    return keys.map((key) => rowsByKey.get(key) ?? []);
  });
}

export interface Loaders {
  demonstrationById: DataLoader<string, PrismaDemonstration | null>;
  userById: DataLoader<string, PrismaUser | null>;
  stateById: DataLoader<string, PrismaState | null>;
  deliverablesByDemonstrationId: DataLoader<string, PrismaDeliverable[]>;
  deliverablesByCmsOwnerId: DataLoader<string, PrismaDeliverable[]>;
}

/**
 * Creates a fresh set of DataLoaders for a single GraphQL request.
 *
 * These MUST be created per-request (in the Apollo context factory) and never
 * shared between requests. DataLoader memoizes each key for the lifetime of the
 * loader, so a shared instance would serve one request's (and one user's) rows
 * to another. Per-request isolation is what makes the batching safe.
 *
 * The batch functions mirror the exact queries the field resolvers issued
 * before batching was introduced (no additional authorization filtering); they
 * only coalesce and de-duplicate round-trips. Any future loader that fans out to
 * authorization-scoped data must bake the request user's auth filter into its
 * batch function.
 */
export function createLoaders(): Loaders {
  return {
    demonstrationById: byIdLoader((ids) => selectManyDemonstrations({ id: { in: ids } })),
    userById: byIdLoader((ids) => selectManyUsers({ id: { in: ids } })),
    stateById: byIdLoader((ids) => selectManyStates({ id: { in: ids } })),
    deliverablesByDemonstrationId: byForeignKeyLoader(
      (demonstrationIds) => selectManyDeliverables({ demonstrationId: { in: demonstrationIds } }),
      (deliverable) => deliverable.demonstrationId
    ),
    deliverablesByCmsOwnerId: byForeignKeyLoader(
      (cmsOwnerUserIds) => selectManyDeliverables({ cmsOwnerUserId: { in: cmsOwnerUserIds } }),
      (deliverable) => deliverable.cmsOwnerUserId
    ),
  };
}

/**
 * Returns the request's DataLoaders, throwing if the context was constructed
 * without them. Loaders are optional on the GraphQL context so that existing
 * unit-test contexts need not construct them, but the real request path always
 * sets them via `buildContextFromClaims`.
 */
export function requireLoaders(context: { loaders?: Loaders }): Loaders {
  if (!context.loaders) {
    throw new Error("GraphQL context was constructed without DataLoaders.");
  }
  return context.loaders;
}
