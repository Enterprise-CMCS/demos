import { Prisma, Document as PrismaDocument } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import { selectDocument, selectManyDocuments, updateDocument } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { log } from "../../log";
import { isAStatePointOfContactAssociatedWithDeliverable } from "../deliverable/deliverableData";
import { selectDeliverableOrThrow } from "../deliverable/queries/selectDeliverableOrThrow";
import { DeliverableStatus } from "../../constants";
import { handleDeleteDocument } from "./handleDeleteDocument";
import { validateDocumentCanBeDeleted } from "./validateDocumentCanBeDeleted";

const getViewPermissionFilters = (userId: string) =>
  ({
    "View All Documents": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Documents on Assigned Deliverables": {
      deliverable: isAStatePointOfContactAssociatedWithDeliverable(userId),
    },
  }) satisfies PermissionFilters<Prisma.DocumentWhereInput>;

const getEditPermissionFilters = (userId: string) =>
  ({
    "Edit All Documents": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "Edit State Documents on Assigned Deliverables": {
      deliverable: isAStatePointOfContactAssociatedWithDeliverable(userId),
      deliverableIsCmsAttachedFile: false,
    },
  }) satisfies PermissionFilters<Prisma.DocumentWhereInput>;

const getDeletePermissionFilters = (userId: string) =>
  ({
    "Delete All Documents": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "Delete State Documents on Assigned Deliverables": {
      deliverable: isAStatePointOfContactAssociatedWithDeliverable(userId),
      deliverableIsCmsAttachedFile: false,
    },
  }) satisfies PermissionFilters<Prisma.DocumentWhereInput>;

export async function getDocument(
  where: Prisma.DocumentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaDocument> {
  const authFilter = buildAuthorizationFilter<Prisma.DocumentWhereInput>(
    user,
    getViewPermissionFilters
  );

  if (authFilter !== null) {
    const authorizedDocument = await selectDocument(
      {
        AND: [where, authFilter],
      },
      tx
    );

    if (authorizedDocument) {
      return authorizedDocument;
    }
  }

  const document = await selectDocument(where, tx);
  if (document) {
    log.warn(
      `User ${user.id} attempted to access Document ${document.id} without sufficient permissions.`
    );
  }

  throw new Error("Requested Document not found or User does not have Permission to view it.");
}

export async function getManyDocuments(
  where: Prisma.DocumentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaDocument[]> {
  const authFilter = buildAuthorizationFilter<Prisma.DocumentWhereInput>(
    user,
    getViewPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyDocuments(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function editDocument(
  where: Prisma.DocumentWhereUniqueInput,
  data: Prisma.DocumentUncheckedUpdateInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaDocument> {
  const authFilter = buildAuthorizationFilter<Prisma.DocumentWhereInput>(
    user,
    getEditPermissionFilters
  );

  if (authFilter !== null) {
    const authorizedDocument = await selectDocument(
      {
        AND: [where, authFilter],
      },
      tx
    );

    if (authorizedDocument) {
      return await updateDocument(where, data, tx);
    }
  }

  const document = await selectDocument(where, tx);
  if (document) {
    log.warn(
      `User ${user.id} attempted to edit Document ${document.id} without sufficient permissions.`
    );
  }

  throw new Error("Requested Document not found or User does not have Permission to edit it.");
}

export async function removeDocument(
  where: Prisma.DocumentWhereUniqueInput,
  user: ContextUser,
  tx: PrismaTransactionClient
): Promise<PrismaDocument> {
  const authFilter = buildAuthorizationFilter<Prisma.DocumentWhereInput>(
    user,
    getDeletePermissionFilters
  );

  if (authFilter !== null) {
    const authorizedDocument = await selectDocument(
      {
        AND: [where, authFilter],
      },
      tx
    );

    if (authorizedDocument) {
      const deliverableStatus = authorizedDocument.deliverableId
        ? ((await selectDeliverableOrThrow({ id: authorizedDocument.deliverableId }, tx))
            .statusId as DeliverableStatus)
        : null;
      validateDocumentCanBeDeleted({ ...authorizedDocument, deliverableStatus });
      return await handleDeleteDocument(where, tx);
    }
  }

  const document = await selectDocument(where, tx);
  if (document) {
    log.warn(
      `User ${user.id} attempted to delete Document ${document.id} without sufficient permissions.`
    );
  }

  throw new Error("Requested Document not found or User does not have Permission to delete it.");
}
