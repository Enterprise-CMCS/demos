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

export { selectManyReferenceConfigurations } from "./selectManyReferenceConfigurations";
export { selectReferenceConfiguration } from "./selectReferenceConfiguration";
