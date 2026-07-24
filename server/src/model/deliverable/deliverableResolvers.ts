import {
  Deliverable as PrismaDeliverable,
  DeliverableExtension as PrismaDeliverableExtension,
  Demonstration as PrismaDemonstration,
  Document as PrismaDocument,
  DocumentPendingUpload as PrismaDocumentPendingUpload,
  Prisma,
  PrivateComment as PrismaPrivateComment,
  PublicComment as PrismaPublicComment,
  User as PrismaUser,
} from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { requireLoaders } from "../../loaders";
import { GraphQLResolveInfo } from "graphql";
import {
  approveDeliverableExtension,
  completeDeliverable,
  createDeliverable,
  deleteDeliverable,
  denyDeliverableExtension,
  requestDeliverableExtension,
  requestDeliverableResubmission,
  startDeliverableReview,
  submitDeliverable,
  updateDeliverable,
  getDeliverable,
  getManyDeliverables,
  selectDeliverable,
  selectDeliverableOrThrow,
} from ".";
import {
  ApproveDeliverableExtensionInput,
  CreateDeliverableInput,
  DeliverableAction,
  DeliverableDueDateType,
  DeliverableStatus,
  DeliverableType,
  DenyDeliverableExtensionInput,
  DocumentType,
  FinalDeliverableStatus,
  RequestDeliverableExtensionInput,
  RequestDeliverableResubmissionInput,
  Tag,
  TagStatus,
  UpdateDeliverableInput,
} from "../../types";
import { formatDeliverableAction } from "../deliverableAction";

export async function resolveDeliverable(
  parent: PrismaDocument | PrismaDocumentPendingUpload | PrismaPrivateComment | PrismaPublicComment,
  args: unknown,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<PrismaDeliverable | null> {
  const parentType = info.parentType.name;
  switch (parentType) {
    case Prisma.ModelName.Document:
    case Prisma.ModelName.DocumentPendingUpload: {
      const doc = parent as PrismaDocument | PrismaDocumentPendingUpload;
      if (!doc.deliverableId) {
        return null;
      }
      return await selectDeliverable({ id: doc.deliverableId });
    }

    case "DeliverableComment": {
      const comment = parent as PrismaPublicComment | PrismaPrivateComment;
      return selectDeliverableOrThrow({ id: comment.deliverableId });
    }
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }
}

export async function resolveManyDeliverables(
  parent: PrismaDemonstration | PrismaUser,
  args: unknown,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<PrismaDeliverable[]> {
  const parentType = info.parentType.name;

  switch (parentType) {
    case Prisma.ModelName.Demonstration:
      return requireLoaders(context).deliverablesByDemonstrationId.load(parent.id);
    case Prisma.ModelName.User:
      return requireLoaders(context).deliverablesByCmsOwnerId.load(parent.id);
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }
}

export const deliverableResolvers = {
  Query: {
    deliverable: async (
      parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ): Promise<PrismaDeliverable> => await getDeliverable({ id: args.id }, context.user),
    deliverables: async (
      parent: unknown,
      args: undefined,
      context: GraphQLContext
    ): Promise<PrismaDeliverable[]> => await getManyDeliverables({}, context.user),
  },

  Mutation: {
    createDeliverable: async (
      parent: unknown,
      args: { input: CreateDeliverableInput },
      context: GraphQLContext
    ): Promise<PrismaDeliverable> => {
      return await createDeliverable(args.input, context);
    },
    updateDeliverable: async (
      parent: unknown,
      args: { id: string; input: UpdateDeliverableInput },
      context: GraphQLContext
    ): Promise<PrismaDeliverable> => {
      return await updateDeliverable(args.id, args.input, context);
    },
    submitDeliverable: async (
      parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ): Promise<PrismaDeliverable> => {
      return await submitDeliverable(args.id, context);
    },
    startDeliverableReview: async (
      parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ): Promise<PrismaDeliverable> => {
      return await startDeliverableReview(args.id, context);
    },
    completeDeliverable: async (
      parent: unknown,
      args: { id: string; finalStatus: FinalDeliverableStatus },
      context: GraphQLContext
    ): Promise<PrismaDeliverable> => {
      return await completeDeliverable(args.id, args.finalStatus, context);
    },
    requestDeliverableResubmission: async (
      parent: unknown,
      args: { id: string; input: RequestDeliverableResubmissionInput },
      context: GraphQLContext
    ): Promise<PrismaDeliverable> => {
      return await requestDeliverableResubmission(args.id, args.input, context);
    },
    requestDeliverableExtension: async (
      parent: unknown,
      args: { deliverableId: string; input: RequestDeliverableExtensionInput },
      context: GraphQLContext
    ): Promise<PrismaDeliverable> => {
      return await requestDeliverableExtension(args.deliverableId, args.input, context);
    },
    approveDeliverableExtension: async (
      parent: unknown,
      args: { deliverableId: string; input: ApproveDeliverableExtensionInput },
      context: GraphQLContext
    ): Promise<PrismaDeliverable> => {
      return await approveDeliverableExtension(args.deliverableId, args.input, context);
    },
    denyDeliverableExtension: async (
      parent: unknown,
      args: { deliverableId: string; input: DenyDeliverableExtensionInput },
      context: GraphQLContext
    ): Promise<PrismaDeliverable> => {
      return await denyDeliverableExtension(args.deliverableId, args.input, context);
    },
    deleteDeliverable: async (
      parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ): Promise<PrismaDeliverable> => {
      return await deleteDeliverable(args.id, context);
    },
  },

  Deliverable: {
    deliverableType: (parent: PrismaDeliverable): DeliverableType => {
      return parent.deliverableTypeId as DeliverableType;
    },
    demonstration: async (
      parent: PrismaDeliverable,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDemonstration> => {
      const demonstration = await requireLoaders(context).demonstrationById.load(
        parent.demonstrationId
      );
      if (!demonstration) {
        throw new Error("No demonstration found matching the provided filter");
      }
      return demonstration;
    },
    status: (parent: PrismaDeliverable): DeliverableStatus => {
      return parent.statusId as DeliverableStatus;
    },
    cmsOwner: async (
      parent: PrismaDeliverable,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaUser> => {
      const user = await requireLoaders(context).userById.load(parent.cmsOwnerUserId);
      if (!user) {
        throw new Error("No user found matching the provided filter");
      }
      return user;
    },
    dueDateType: (parent: PrismaDeliverable): DeliverableDueDateType => {
      return parent.dueDateTypeId as DeliverableDueDateType;
    },
    demonstrationTypes: async (
      parent: PrismaDeliverable,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Tag[]> =>
      (
        await requireLoaders(context).deliverableDemonstrationTypesByDeliverableId.load(parent.id)
      ).map((deliverableDemonstrationType) => {
        const { statusId, tagNameId } =
          deliverableDemonstrationType.demonstrationTypeTagAssignment.tag;
        return {
          tagName: tagNameId,
          approvalStatus: statusId as TagStatus,
        };
      }),
    cmsDocuments: (
      parent: PrismaDeliverable,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDocument[]> =>
      requireLoaders(context).cmsDocumentsByDeliverableId.load(parent.id),
    stateDocuments: (
      parent: PrismaDeliverable,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDocument[]> =>
      requireLoaders(context).stateDocumentsByDeliverableId.load(parent.id),
    allowedDocumentTypes: (
      parent: PrismaDeliverable,
      _args: unknown,
      context: GraphQLContext
    ): Promise<DocumentType[]> =>
      requireLoaders(context).documentTypesByDeliverableTypeId.load(parent.deliverableTypeId),
    deliverableActions: async (
      parent: PrismaDeliverable,
      _args: unknown,
      context: GraphQLContext
    ): Promise<DeliverableAction[]> =>
      (await requireLoaders(context).deliverableActionsByDeliverableId.load(parent.id)).map(
        (action) => formatDeliverableAction(action)
      ),
    extensionRequests: (
      parent: PrismaDeliverable,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDeliverableExtension[]> =>
      requireLoaders(context).deliverableExtensionsByDeliverableId.load(parent.id),
    publicComments: (
      parent: PrismaDeliverable,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaPublicComment[]> =>
      requireLoaders(context).publicCommentsByDeliverableId.load(parent.id),
    privateComments: (
      parent: PrismaDeliverable,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaPrivateComment[]> =>
      requireLoaders(context).privateCommentsByDeliverableId.load(parent.id),
  },
};
