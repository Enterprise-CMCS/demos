import { gql, TypedDocumentNode, useMutation, useQuery } from "@apollo/client";
import {
  DemonstrationTypeInput,
  Tag as DemonstrationTypeName,
  LocalDate,
  Demonstration as ServerDemonstration,
  SetDemonstrationTypesInput,
} from "demos-server";

export type DemonstrationType = {
  demonstrationTypeName: DemonstrationTypeName;
  effectiveDate: string;
  expirationDate: string;
};
export type Demonstration = Pick<ServerDemonstration, "id"> & {
  demonstrationTypes: DemonstrationType[];
};

export const ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY: TypedDocumentNode<
  { demonstration: Demonstration },
  { id: string }
> = gql`
  query AssignDemonstrationTypesDialog($id: ID!) {
    demonstration(id: $id) {
      id
      demonstrationTypes {
        demonstrationTypeName
        effectiveDate
        expirationDate
      }
    }
  }
`;

export const ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION: TypedDocumentNode<
  { setDemonstrationTypes: Demonstration },
  { input: SetDemonstrationTypesInput }
> = gql`
  mutation setDemonstrationTypes($input: SetDemonstrationTypesInput!) {
    setDemonstrationTypes(input: $input) {
      id
      demonstrationTypes {
        demonstrationTypeName
      }
    }
  }
`;

export const getSetDemonstrationTypesInput = (
  demonstrationId: string,
  initialDemonstrationTypes: DemonstrationType[],
  currentDemonstrationTypes: DemonstrationType[]
): SetDemonstrationTypesInput => {
  const demonstrationTypesToAdd: DemonstrationTypeInput[] = currentDemonstrationTypes.map(
    (demonstrationType) => ({
      demonstrationTypeName: demonstrationType.demonstrationTypeName,
      demonstrationTypeDates: {
        effectiveDate: demonstrationType.effectiveDate as LocalDate,
        expirationDate: demonstrationType.expirationDate as LocalDate,
      },
    })
  );
  const demonstrationTypesToRemove: DemonstrationTypeInput[] = initialDemonstrationTypes
    .filter(
      (initialDemonstrationType) =>
        !currentDemonstrationTypes.some(
          (currentDemonstrationType) =>
            currentDemonstrationType.demonstrationTypeName ===
            initialDemonstrationType.demonstrationTypeName
        )
    )
    .map((demonstrationType) => ({
      demonstrationTypeName: demonstrationType.demonstrationTypeName,
      demonstrationTypeDates: null,
    }));

  return {
    demonstrationId: demonstrationId,
    demonstrationTypes: [...demonstrationTypesToAdd, ...demonstrationTypesToRemove],
  };
};

export const useApplyDemonstrationTypesDialogData = (demonstrationId: string) => {
  const {
    data,
    loading,
    error: loadingError,
  } = useQuery(ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY, {
    variables: { id: demonstrationId },
  });

  const [setDemonstrationTypes, { loading: saving }] = useMutation(
    ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION
  );

  const save = async (
    demonstrationId: string,
    initialDemonstrationTypes: DemonstrationType[],
    currentDemonstrationTypes: DemonstrationType[]
  ) => {
    const demonstrationTypesInput = getSetDemonstrationTypesInput(
      demonstrationId,
      initialDemonstrationTypes,
      currentDemonstrationTypes
    );
    return await setDemonstrationTypes({
      variables: {
        input: demonstrationTypesInput,
      },
    });
  };

  return {
    data,
    loading,
    loadingError,
    save,
    saving,
  };
};
