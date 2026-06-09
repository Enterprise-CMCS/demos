import { NonEmptyString, TagName } from "../../../types";

export type SelectManyReferenceConfigurationsResult = {
  id: string;
  statusId: string;
  reference: {
    id: string;
    name: NonEmptyString;
    description: NonEmptyString;
    referenceTagAssignments: {
      tag: {
        tagNameId: TagName;
        statusId: string;
      };
    }[];
    referenceDemonstrationTypes: {
      tag: {
        tagNameId: TagName;
        statusId: string;
      };
    }[];
    s3Path: string;
    createdAt: Date;
    updatedAt: Date;
  };
  referenceAgreement: {
    id: string;
    name: NonEmptyString;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

export const selectManyReferenceConfigurationsRequest = {
  id: true,
  statusId: true,
  reference: {
    select: {
      id: true,
      name: true,
      description: true,
      referenceTagAssignments: {
        select: {
          tag: {
            select: {
              tagNameId: true,
              statusId: true,
            },
          },
        },
      },
      referenceDemonstrationTypes: {
        select: {
          tag: {
            select: {
              tagNameId: true,
              statusId: true,
            },
          },
        },
      },
      s3Path: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  referenceAgreement: {
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

export { selectManyReferenceConfigurations } from "./selectManyReferenceConfigurations";
export { selectReferenceConfiguration } from "./selectReferenceConfiguration";
