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
  selectManyDeliverables,
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
  FinalDeliverableStatus,
  RequestDeliverableExtensionInput,
  RequestDeliverableResubmissionInput,
  Tag,
  TagStatus,
  UpdateDeliverableInput,
} from "../../types";
import { getApplication } from "../application";
import { selectUserOrThrow } from "../user/queries";
import { getManyDocuments } from "../document";
import { getFormattedDeliverableActions } from "../deliverableAction";
import { selectManyDeliverableDemonstrationTypes } from "../deliverableDemonstrationType/queries";
import { selectManyDeliverableExtensions } from "../deliverableExtension/queries";
import { selectManyPublicComments } from "../publicComment/queries";
import { selectManyPrivateComments } from "../privateComment/queries";

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
  let filter: Prisma.DeliverableWhereInput;

  switch (parentType) {
    case Prisma.ModelName.Demonstration:
      filter = { demonstrationId: parent.id };
      break;
    case Prisma.ModelName.User:
      filter = { cmsOwnerUserId: parent.id };
      break;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  return selectManyDeliverables(filter);
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
    demonstration: (parent: PrismaDeliverable): Promise<PrismaDemonstration> =>
      getApplication(parent.demonstrationId, { applicationTypeId: "Demonstration" }),
    status: (parent: PrismaDeliverable): DeliverableStatus => {
      return parent.statusId as DeliverableStatus;
    },
    cmsOwner: (parent: PrismaDeliverable) => selectUserOrThrow({ id: parent.cmsOwnerUserId }),
    dueDateType: (parent: PrismaDeliverable): DeliverableDueDateType => {
      return parent.dueDateTypeId as DeliverableDueDateType;
    },
    demonstrationTypes: async (parent: PrismaDeliverable): Promise<Tag[]> =>
      (await selectManyDeliverableDemonstrationTypes({ deliverableId: parent.id })).map(
        (deliverableDemonstrationType) => {
          const { statusId, tagNameId } =
            deliverableDemonstrationType.demonstrationTypeTagAssignment.tag;
          return {
            tagName: tagNameId,
            approvalStatus: statusId as TagStatus,
          };
        }
      ),
    cmsDocuments: async (
      parent: PrismaDeliverable,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDocument[]> =>
      await getManyDocuments(
        {
          AND: [{ deliverableId: parent.id }, { deliverableIsCmsAttachedFile: true }],
        },
        context.user
      ),
    stateDocuments: async (
      parent: PrismaDeliverable,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDocument[]> =>
      await getManyDocuments(
        {
          AND: [{ deliverableId: parent.id }, { deliverableIsCmsAttachedFile: false }],
        },
        context.user
      ),
    deliverableActions: (parent: PrismaDeliverable): Promise<DeliverableAction[]> =>
      getFormattedDeliverableActions(parent.id),
    extensionRequests: (parent: PrismaDeliverable): Promise<PrismaDeliverableExtension[]> =>
      selectManyDeliverableExtensions({ deliverableId: parent.id }),
    publicComments: (parent: PrismaDeliverable): Promise<PrismaPublicComment[]> =>
      selectManyPublicComments({ deliverableId: parent.id }),
    privateComments: (parent: PrismaDeliverable): Promise<PrismaPrivateComment[]> =>
      selectManyPrivateComments({ deliverableId: parent.id }),
  },
};
