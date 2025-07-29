import {
  gql,
  useMutation,
} from "@apollo/client";

export interface SubmitExtensionData {
  title: string;
  state: string;
  projectOfficer: string;
  effectiveDate?: string | null;
  expirationDate?: string | null;
  description?: string | null;
  demonstration: string;
}

export interface CreateExtensionInput {
  title: string;
  state: string;
  projectOfficerId: string;
  effectiveDate?: string | null;
  expirationDate?: string | null;
  description?: string | null;
  demonstrationId: string;
}

const CREATE_EXTENSION = gql`
  mutation CreateExtension($input: CreateExtensionInput!) {
    createExtension(input: $input) {
      id
      title
      state
    }
  }
`;

export function useCreateExtension() {
  const [createExtension, { loading, error }] = useMutation<
    { createExtension: { id: string; title: string; state: string } },
    { input: CreateExtensionInput }
  >(CREATE_EXTENSION);

  const submitExtension = async (data: SubmitExtensionData) => {
    return createExtension({
      variables: {
        input: {
          title: data.title,
          state: data.state,
          projectOfficerId: data.projectOfficer,
          effectiveDate: data.effectiveDate ?? null,
          expirationDate: data.expirationDate ?? null,
          description: data.description ?? null,
          demonstrationId: data.demonstration,
        },
      },
    });
  };

  return { submitExtension, loading, error };
}
