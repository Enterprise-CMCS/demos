import { gql, TypedDocumentNode, useMutation, useQuery } from "@apollo/client";
import { Tag as DemonstrationTypeName, Demonstration as ServerDemonstration } from "demos-server";
export type DemonstrationType = {
  demonstrationTypeName: DemonstrationTypeName;
  effectiveDate: string;
  expirationDate: string;
};

export type Demonstration = Pick<ServerDemonstration, "id"> & {
  demonstrationTypes: DemonstrationType[];
};

export type DemonstrationTypeInput = {
  demonstrationTypeName: DemonstrationTypeName;
  dates: {
    effectiveDate: string;
    expirationDate: string;
  } | null;
};
export type SetDemonstrationTypesInput = {
  demonstrationId: string;
  demonstrationTypes: DemonstrationTypeInput[];
};

const ASSIGN_DEMONSTRATION_TYPES_DIALOG_FRAGMENT = gql`
  fragment AssignDemonstrationTypesDialogFragment on Demonstration {
    id
    demonstrationTypes {
      demonstrationTypeName
      effectiveDate
      expirationDate
    }
  }
`;
export const ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY: TypedDocumentNode<
  { demonstration: Demonstration },
  { id: string }
> = gql`
  query AssignDemonstrationTypesDialog($id: ID!) {
    demonstration(id: $id) {
      ...AssignDemonstrationTypesDialogFragment
    }
  }
  ${ASSIGN_DEMONSTRATION_TYPES_DIALOG_FRAGMENT}
`;
export const ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION: TypedDocumentNode<
  { setDemonstrationTypes: Demonstration },
  { input: SetDemonstrationTypesInput }
> = gql`
  mutation setDemonstrationTypes($input: SetDemonstrationTypesInput!) {
    setDemonstrationTypes(input: $input) {
      ...AssignDemonstrationTypesDialogFragment
    }
  }
  ${ASSIGN_DEMONSTRATION_TYPES_DIALOG_FRAGMENT}
`;

export const getSetDemonstrationTypeInput = (
  demonstrationId: string,
  initialDemonstrationTypes: DemonstrationType[],
  currentDemonstrationTypes: DemonstrationType[]
): SetDemonstrationTypesInput => {
  const demonstrationTypesToAdd: DemonstrationTypeInput[] = currentDemonstrationTypes.map(
    (demonstrationType) => ({
      demonstrationTypeName: demonstrationType.demonstrationTypeName,
      dates: {
        effectiveDate: demonstrationType.effectiveDate,
        expirationDate: demonstrationType.expirationDate,
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
      dates: null,
    }));

  return {
    demonstrationId: demonstrationId,
    demonstrationTypes: [...demonstrationTypesToAdd, ...demonstrationTypesToRemove],
  };
};

export const useApplyDemonstrationTypesDialogData = (demonstrationId: string) => {
  const { data, loading, error } = useQuery(ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY, {
    variables: { id: demonstrationId },
  });

  const [assignDemonstrationTypes, { loading: saving }] = useMutation(
    ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION
  );

  const save = async (
    demonstrationId: string,
    initialDemonstrationTypes: DemonstrationType[],
    currentDemonstrationTypes: DemonstrationType[]
  ) => {
    const demonstrationTypeInput = getSetDemonstrationTypeInput(
      demonstrationId,
      initialDemonstrationTypes,
      currentDemonstrationTypes
    );
    return assignDemonstrationTypes({
      variables: {
        input: demonstrationTypeInput,
      },
    });
  };

  return {
    data,
    loading,
    loadingError: error,
    save,
    saving,
  };
};
