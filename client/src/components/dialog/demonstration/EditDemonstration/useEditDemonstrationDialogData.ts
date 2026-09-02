import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { Demonstration, Person, State } from "demos-server";

export const EDIT_DEMONSTRATION_DIALOG_QUERY: TypedDocumentNode<
  {
    demonstration: Pick<
      Demonstration,
      | "id"
      | "name"
      | "description"
      | "sdgDivision"
      | "signatureLevel"
      | "effectiveDate"
      | "expirationDate"
      | "status"
    > & {
      state: Pick<State, "id">;
      primaryProjectOfficer: Pick<Person, "id">;
    };
  },
  {
    id: string;
  }
> = gql`
  query EditDemonstrationDialogQuery($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      state {
        id
      }
      sdgDivision
      signatureLevel
      primaryProjectOfficer {
        id
      }
      effectiveDate
      expirationDate
      status
    }
  }
`;

export type EditDemonstrationDialogQueryData = {
  demonstration: Pick<
    Demonstration,
    | "id"
    | "name"
    | "description"
    | "sdgDivision"
    | "signatureLevel"
    | "effectiveDate"
    | "expirationDate"
    | "status"
  > & {
    state: Pick<State, "id">;
    primaryProjectOfficer: Pick<Person, "id">;
  };
};

export const useEditDemonstrationDialogData = (demonstrationId: string) => {
  const { data, loading, error } = useQuery(EDIT_DEMONSTRATION_DIALOG_QUERY, {
    variables: { id: demonstrationId },
  });

  const demonstration = data?.demonstration;

  return {
    loading,
    error,
    demonstration,
  };
};
