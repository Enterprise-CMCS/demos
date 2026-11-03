import type {
  Amendment as PrismaAmendment,
  Deliverable as PrismaDeliverable,
  Demonstration as PrismaDemonstration,
  Extension as PrismaExtension,
} from "@prisma/client";
import {
  approveTags,
  createTags,
  deleteTags,
  getDataToResolveDemonstrationTypeApplicationTagDetails,
  getDemonstrationTypeSummaryCounts,
  getFormattedTagsByTagType,
} from ".";
import type { GraphQLContext } from "../../auth";
import { __DEMOS_VERSION__ } from "../../flags";
import type { Tag, TagName, TagStatus } from "../../types";
import { getManyAmendments } from "../amendment";
import { getManyDeliverables } from "../deliverable";
import { getManyDemonstrations } from "../demonstration";
import { getManyExtensions } from "../extension";
import type { SelectManyReferenceConfigurationsResult } from "../referenceConfiguration/queries";
import { selectManyReferenceConfigurations } from "../referenceConfiguration/queries";

export const tagResolvers = {
  Query: {
    demonstrationTypeOptions: (): Promise<Tag[]> => getFormattedTagsByTagType("Demonstration Type"),
    applicationTagOptions: (): Promise<Tag[]> => getFormattedTagsByTagType("Application"),
    demonstrationTypeUsageSummary: getDemonstrationTypeSummaryCounts,
    tagDetails: (parent: unknown, args: { tagName: TagName }): Promise<Tag> =>
      getDataToResolveDemonstrationTypeApplicationTagDetails(args.tagName, __DEMOS_VERSION__),
  },

  Mutation: {
    createTags: async (parent: unknown, args: { tagNames: string[] }): Promise<Tag[]> => {
      const createdTags = await createTags(args.tagNames);
      return createdTags.map((demonstrationTypeTag) => ({
        tagName: demonstrationTypeTag.tagNameId,
        // casting enforced by database constraints
        approvalStatus: demonstrationTypeTag.statusId as TagStatus,
      }));
    },
    approveTags: (parent: unknown, args: { tagNames: TagName[] }): Promise<Tag[]> =>
      approveTags(args.tagNames, __DEMOS_VERSION__),
    deleteTags: (parent: unknown, args: { tagNames: TagName[] }): Promise<number> =>
      deleteTags(args.tagNames, __DEMOS_VERSION__),
  },

  TagDetail: {
    taggedDemonstrations: (
      parent: Tag,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDemonstration[]> => {
      return getManyDemonstrations(
        { application: { applicationTagAssignments: { some: { tagNameId: parent.tagName } } } },
        context.user
      );
    },
    taggedAmendments: (
      parent: Tag,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaAmendment[]> => {
      return getManyAmendments(
        { application: { applicationTagAssignments: { some: { tagNameId: parent.tagName } } } },
        context.user
      );
    },
    taggedRenewals: (
      parent: Tag,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaExtension[]> => {
      return getManyExtensions(
        { application: { applicationTagAssignments: { some: { tagNameId: parent.tagName } } } },
        context.user
      );
    },
    taggedReferences: (parent: Tag): Promise<SelectManyReferenceConfigurationsResult[]> => {
      return selectManyReferenceConfigurations({
        reference: {
          referenceDemonstrationTypes: { some: { tag: { tagNameId: parent.tagName } } },
        },
      });
    },
    assignedDemonstrations: (
      parent: Tag,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDemonstration[]> => {
      return getManyDemonstrations(
        {
          demonstrationTypeTagAssignments: { some: { tagNameId: parent.tagName } },
        },
        context.user
      );
    },
    assignedDeliverables: (
      parent: Tag,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDeliverable[]> => {
      return getManyDeliverables(
        {
          deliverableDemonstrationTypes: {
            some: {
              demonstrationTypeTagNameId: parent.tagName,
            },
          },
        },
        context.user
      );
    },
  },
};
