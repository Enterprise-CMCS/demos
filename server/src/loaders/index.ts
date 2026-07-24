import DataLoader from "dataloader";
import {
  Amendment as PrismaAmendment,
  ApplicationPhase as PrismaApplicationPhase,
  ApplicationTagSuggestion as PrismaApplicationTagSuggestion,
  Deliverable as PrismaDeliverable,
  DeliverableExtension as PrismaDeliverableExtension,
  Demonstration as PrismaDemonstration,
  Document as PrismaDocument,
  Extension as PrismaExtension,
  Person as PrismaPerson,
  PrivateComment as PrismaPrivateComment,
  PublicComment as PrismaPublicComment,
  State as PrismaState,
  User as PrismaUser,
} from "@prisma/client";
import type { ContextUser } from "../auth";
import type { DocumentType, Role, UiPathResultStatus } from "../types";

// Batched query functions (imported from their specific files to avoid pulling
// in resolver/barrel modules and creating import cycles).
import { selectManyDemonstrations } from "../model/demonstration/queries/selectManyDemonstrations";
import { selectManyDeliverables } from "../model/deliverable/queries/selectManyDeliverables";
import { selectManyStates } from "../model/state/queries/selectManyStates";
import { selectManyUsers } from "../model/user/queries/selectManyUsers";
import { selectManyPeople } from "../model/person/queries/selectManyPeople";
import { selectManyDemonstrationRoleAssignments } from "../model/demonstrationRoleAssignment/queries/selectManyDemonstrationRoleAssignments";
import { selectManyApplicationPhases } from "../model/applicationPhase/queries/selectManyApplicationPhases";
import { selectManyApplicationTagAssignments } from "../model/applicationTagAssignment/queries/selectManyApplicationTagAssignments";
import { selectManyApplicationTagSuggestions } from "../model/applicationTagSuggestion/queries/selectManyApplicationTagSuggestions";
import { selectManyDemonstrationTypeTagAssignments } from "../model/demonstrationTypeTagAssignment/queries/selectManyDemonstrationTypeTagAssignments";
import { selectManyDeliverableDemonstrationTypes } from "../model/deliverableDemonstrationType/queries/selectManyDeliverableDemonstrationTypes";
import { selectManyDeliverableExtensions } from "../model/deliverableExtension/queries/selectManyDeliverableExtensions";
import { selectManyPublicComments } from "../model/publicComment/queries/selectManyPublicComments";
import { selectManyPrivateComments } from "../model/privateComment/queries/selectManyPrivateComments";
import { selectManyDeliverableActions } from "../model/deliverableAction/queries/selectManyDeliverableActions";
import { selectDocumentTypesForDeliverableTypes } from "../model/deliverableTypeDocumentType/selectDocumentTypesForDeliverableTypes";
import { getManyDocuments } from "../model/document/documentData";
import { getManyAmendments } from "../model/amendment/amendmentData";
import { getManyExtensions } from "../model/extension/extensionData";

// Query-result row shapes (type-only imports; erased at build time).
import type { DemonstrationRoleAssignmentQueryResult } from "../model/demonstrationRoleAssignment/queries";
import type { ApplicationTagAssignmentQueryResult } from "../model/applicationTagAssignment/queries";
import type { DemonstrationTypeTagAssignmentQueryResult } from "../model/demonstrationTypeTagAssignment/queries";
import type { DeliverableDemonstrationTypeQueryResult } from "../model/deliverableDemonstrationType/queries";
import type { SelectDeliverableActionRowResult } from "../model/deliverableAction/queries";

const PROJECT_OFFICER_ROLE = "Project Officer" satisfies Role;
const PENDING_TAG_SUGGESTION_STATUS = "Pending" satisfies UiPathResultStatus;

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
  // Single-row, keyed by primary id.
  demonstrationById: DataLoader<string, PrismaDemonstration | null>;
  userById: DataLoader<string, PrismaUser | null>;
  stateById: DataLoader<string, PrismaState | null>;
  personById: DataLoader<string, PrismaPerson | null>;

  // Collections, keyed by a foreign key.
  deliverablesByDemonstrationId: DataLoader<string, PrismaDeliverable[]>;
  deliverablesByCmsOwnerId: DataLoader<string, PrismaDeliverable[]>;
  rolesByDemonstrationId: DataLoader<string, DemonstrationRoleAssignmentQueryResult[]>;
  primaryProjectOfficerAssignmentsByDemonstrationId: DataLoader<
    string,
    DemonstrationRoleAssignmentQueryResult[]
  >;
  phasesByApplicationId: DataLoader<string, PrismaApplicationPhase[]>;
  tagAssignmentsByApplicationId: DataLoader<string, ApplicationTagAssignmentQueryResult[]>;
  suggestedTagsByApplicationId: DataLoader<string, PrismaApplicationTagSuggestion[]>;
  demonstrationTypeAssignmentsByDemonstrationId: DataLoader<
    string,
    DemonstrationTypeTagAssignmentQueryResult[]
  >;
  deliverableDemonstrationTypesByDeliverableId: DataLoader<
    string,
    DeliverableDemonstrationTypeQueryResult[]
  >;
  deliverableExtensionsByDeliverableId: DataLoader<string, PrismaDeliverableExtension[]>;
  publicCommentsByDeliverableId: DataLoader<string, PrismaPublicComment[]>;
  privateCommentsByDeliverableId: DataLoader<string, PrismaPrivateComment[]>;
  deliverableActionsByDeliverableId: DataLoader<string, SelectDeliverableActionRowResult[]>;
  documentTypesByDeliverableTypeId: DataLoader<string, DocumentType[]>;

  // Authorization-scoped collections (batch functions bake in the request user's
  // permission filter via the existing `getMany*` helpers).
  documentsByApplicationId: DataLoader<string, PrismaDocument[]>;
  amendmentsByDemonstrationId: DataLoader<string, PrismaAmendment[]>;
  extensionsByDemonstrationId: DataLoader<string, PrismaExtension[]>;
  cmsDocumentsByDeliverableId: DataLoader<string, PrismaDocument[]>;
  stateDocumentsByDeliverableId: DataLoader<string, PrismaDocument[]>;
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
 * before batching was introduced. The `getMany*`-backed loaders remain
 * authorization-scoped to `user` (identical filter across the batch, since it
 * depends only on the user); the `selectMany*`-backed loaders are not
 * authorization-filtered, exactly as their resolvers were not.
 */
export function createLoaders(user: ContextUser): Loaders {
  return {
    demonstrationById: byIdLoader((ids) => selectManyDemonstrations({ id: { in: ids } })),
    userById: byIdLoader((ids) => selectManyUsers({ id: { in: ids } })),
    stateById: byIdLoader((ids) => selectManyStates({ id: { in: ids } })),
    personById: byIdLoader((ids) => selectManyPeople({ id: { in: ids } })),

    deliverablesByDemonstrationId: byForeignKeyLoader(
      (demonstrationIds) => selectManyDeliverables({ demonstrationId: { in: demonstrationIds } }),
      (deliverable) => deliverable.demonstrationId
    ),
    deliverablesByCmsOwnerId: byForeignKeyLoader(
      (cmsOwnerUserIds) => selectManyDeliverables({ cmsOwnerUserId: { in: cmsOwnerUserIds } }),
      (deliverable) => deliverable.cmsOwnerUserId
    ),
    rolesByDemonstrationId: byForeignKeyLoader(
      (demonstrationIds) =>
        selectManyDemonstrationRoleAssignments({ demonstrationId: { in: demonstrationIds } }),
      (roleAssignment) => roleAssignment.demonstrationId
    ),
    primaryProjectOfficerAssignmentsByDemonstrationId: byForeignKeyLoader(
      (demonstrationIds) =>
        selectManyDemonstrationRoleAssignments({
          demonstrationId: { in: demonstrationIds },
          roleId: PROJECT_OFFICER_ROLE,
          primaryDemonstrationRoleAssignment: { isNot: null },
        }),
      (roleAssignment) => roleAssignment.demonstrationId
    ),
    phasesByApplicationId: byForeignKeyLoader(
      (applicationIds) => selectManyApplicationPhases({ applicationId: { in: applicationIds } }),
      (phase) => phase.applicationId
    ),
    tagAssignmentsByApplicationId: byForeignKeyLoader(
      (applicationIds) =>
        selectManyApplicationTagAssignments({ applicationId: { in: applicationIds } }),
      (tagAssignment) => tagAssignment.applicationId
    ),
    suggestedTagsByApplicationId: byForeignKeyLoader(
      (applicationIds) =>
        selectManyApplicationTagSuggestions({
          applicationId: { in: applicationIds },
          statusId: { in: [PENDING_TAG_SUGGESTION_STATUS] },
        }),
      (suggestion) => suggestion.applicationId
    ),
    demonstrationTypeAssignmentsByDemonstrationId: byForeignKeyLoader(
      (demonstrationIds) =>
        selectManyDemonstrationTypeTagAssignments({ demonstrationId: { in: demonstrationIds } }),
      (assignment) => assignment.demonstrationId
    ),
    deliverableDemonstrationTypesByDeliverableId: byForeignKeyLoader(
      (deliverableIds) =>
        selectManyDeliverableDemonstrationTypes({ deliverableId: { in: deliverableIds } }),
      (deliverableDemonstrationType) => deliverableDemonstrationType.deliverableId
    ),
    deliverableExtensionsByDeliverableId: byForeignKeyLoader(
      (deliverableIds) => selectManyDeliverableExtensions({ deliverableId: { in: deliverableIds } }),
      (extension) => extension.deliverableId
    ),
    publicCommentsByDeliverableId: byForeignKeyLoader(
      (deliverableIds) => selectManyPublicComments({ deliverableId: { in: deliverableIds } }),
      (comment) => comment.deliverableId
    ),
    privateCommentsByDeliverableId: byForeignKeyLoader(
      (deliverableIds) => selectManyPrivateComments({ deliverableId: { in: deliverableIds } }),
      (comment) => comment.deliverableId
    ),
    deliverableActionsByDeliverableId: byForeignKeyLoader(
      (deliverableIds) => selectManyDeliverableActions({ deliverableId: { in: deliverableIds } }),
      (action) => action.deliverableId
    ),
    documentTypesByDeliverableTypeId: new DataLoader<string, DocumentType[]>(
      async (deliverableTypeIds) => {
        const rows = await selectDocumentTypesForDeliverableTypes([...deliverableTypeIds]);
        const documentTypesByType = new Map<string, DocumentType[]>();
        for (const row of rows) {
          const documentType = row.documentTypeId as DocumentType;
          const bucket = documentTypesByType.get(row.deliverableTypeId);
          if (bucket) {
            bucket.push(documentType);
          } else {
            documentTypesByType.set(row.deliverableTypeId, [documentType]);
          }
        }
        return deliverableTypeIds.map((id) => documentTypesByType.get(id) ?? []);
      }
    ),

    documentsByApplicationId: byForeignKeyLoader(
      (applicationIds) => getManyDocuments({ applicationId: { in: applicationIds } }, user),
      (document) => document.applicationId
    ),
    amendmentsByDemonstrationId: byForeignKeyLoader(
      (demonstrationIds) => getManyAmendments({ demonstrationId: { in: demonstrationIds } }, user),
      (amendment) => amendment.demonstrationId
    ),
    extensionsByDemonstrationId: byForeignKeyLoader(
      (demonstrationIds) => getManyExtensions({ demonstrationId: { in: demonstrationIds } }, user),
      (extension) => extension.demonstrationId
    ),
    cmsDocumentsByDeliverableId: byForeignKeyLoader(
      (deliverableIds) =>
        getManyDocuments(
          {
            AND: [
              { deliverableId: { in: deliverableIds } },
              { deliverableIsCmsAttachedFile: true },
            ],
          },
          user
        ),
      (document) => document.deliverableId!
    ),
    stateDocumentsByDeliverableId: byForeignKeyLoader(
      (deliverableIds) =>
        getManyDocuments(
          {
            AND: [
              { deliverableId: { in: deliverableIds } },
              { deliverableIsCmsAttachedFile: false },
            ],
          },
          user
        ),
      (document) => document.deliverableId!
    ),
  };
}

/**
 * Returns the request's DataLoaders, throwing if the context was constructed
 * without them. Loaders are optional on the GraphQL context so that existing
 * unit-test contexts need not construct them, but the real request path always
 * sets them in the Apollo context factory.
 */
export function requireLoaders(context: { loaders?: Loaders }): Loaders {
  if (!context.loaders) {
    throw new Error("GraphQL context was constructed without DataLoaders.");
  }
  return context.loaders;
}
