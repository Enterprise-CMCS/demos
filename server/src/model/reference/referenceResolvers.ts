import { Prisma } from "@prisma/client";
import {
  selectManyReferenceConfigurations,
  SelectManyReferenceConfigurationsResult,
} from "../referenceConfiguration/queries";
import { NonEmptyString, ReferenceAgreement, Tag, TagName, TagStatus } from "../../types";
import { getReferenceAgreementDownloadUrl, getReferenceDownloadUrl } from ".";

export const referenceResolvers = {
  Query: {
    references: async (
      parent: unknown,
      args: { withTag: TagName }
    ): Promise<SelectManyReferenceConfigurationsResult[]> => {
      let tagFilter: Prisma.ReferenceConfigurationWhereInput | undefined;
      if (args.withTag) {
        tagFilter = {
          reference: {
            referenceTagAssignments: {
              some: {
                tagNameId: args.withTag,
              },
            },
          },
        };
      }
      return await selectManyReferenceConfigurations({
        ...tagFilter,
        statusId: "Active",
      });
    },
    referenceDownloadUrl: getReferenceDownloadUrl,
    referenceAgreementDownloadUrl: getReferenceAgreementDownloadUrl,
  },

  // Tag Status casts below are enforced by the database
  Reference: {
    name: (parent: SelectManyReferenceConfigurationsResult): NonEmptyString => {
      return parent.reference.name;
    },
    description: (parent: SelectManyReferenceConfigurationsResult): NonEmptyString => {
      return parent.reference.description;
    },
    agreement: (parent: SelectManyReferenceConfigurationsResult): ReferenceAgreement | null => {
      return parent.referenceAgreement;
    },
    tags: (parent: SelectManyReferenceConfigurationsResult): Tag[] => {
      return parent.reference.referenceTagAssignments.map((tagAssignment) => ({
        tagName: tagAssignment.tag.tagNameId,
        approvalStatus: tagAssignment.tag.statusId as TagStatus,
      }));
    },
    demonstrationTypes: (parent: SelectManyReferenceConfigurationsResult): Tag[] => {
      return parent.reference.referenceDemonstrationTypes.map((typeAssignment) => ({
        tagName: typeAssignment.tag.tagNameId,
        approvalStatus: typeAssignment.tag.statusId as TagStatus,
      }));
    },
    createdAt: (parent: SelectManyReferenceConfigurationsResult): Date => {
      return parent.reference.createdAt;
    },
    updatedAt: (parent: SelectManyReferenceConfigurationsResult): Date => {
      return parent.reference.updatedAt;
    },
  },
};
