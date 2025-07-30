import {
  AddExtensionInput,
  Extension,
  UpdateExtensionInput,
} from "demos-server";
import {
  ADD_EXTENSION_QUERY,
  GET_ALL_EXTENSIONS_QUERY,
  GET_EXTENSION_BY_ID_QUERY,
  UPDATE_EXTENSION_MUTATION,
} from "queries/extensionQueries";

import {
  ApolloError,
  FetchResult,
  useLazyQuery,
  useMutation,
} from "@apollo/client";

interface GetAllExtensionsOperation {
  trigger: () => void;
  data?: Extension[];
  loading: boolean;
  error?: ApolloError;
}

interface GetExtensionByIdOperation {
  trigger: (id: string) => void;
  data?: Extension;
  loading: boolean;
  error?: ApolloError;
}

interface AddExtensionOperation {
  trigger: (
    input: AddExtensionInput
  ) => Promise<FetchResult<{ addExtension: Extension }>>;
  data?: Extension;
  loading: boolean;
  error?: ApolloError;
}

interface UpdateExtensionOperation {
  trigger: (
    id: string,
    input: UpdateExtensionInput
  ) => Promise<FetchResult<{ updateExtension: Extension }>>;
  data?: Extension;
  loading: boolean;
  error?: ApolloError;
}

export interface ExtensionOperations {
  getAllExtensions: GetAllExtensionsOperation;
  getExtensionById: GetExtensionByIdOperation;
  addExtension: AddExtensionOperation;
  updateExtension: UpdateExtensionOperation;
}

const createGetAllExtensionsHook = (): GetAllExtensionsOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    extensions: Extension[];
  }>(GET_ALL_EXTENSIONS_QUERY);

  return {
    trigger,
    data: data?.extensions,
    loading,
    error,
  };
};

const createGetExtensionByIdHook = (): GetExtensionByIdOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    extension: Extension;
  }>(GET_EXTENSION_BY_ID_QUERY);

  return {
    trigger: (id: string) => trigger({ variables: { id } }),
    data: data?.extension,
    loading,
    error,
  };
};

const createAddExtensionHook = (): AddExtensionOperation => {
  const [trigger, { data, loading, error }] = useMutation<{
    addExtension: Extension;
  }>(ADD_EXTENSION_QUERY);

  return {
    trigger: async (input: AddExtensionInput) =>
      await trigger({ variables: { input } }),
    data: data?.addExtension,
    loading,
    error,
  };
};

const createUpdateExtensionHook = (): UpdateExtensionOperation => {
  const [trigger, { data, loading, error }] = useMutation<{
    updateExtension: Extension;
  }>(UPDATE_EXTENSION_MUTATION);

  return {
    trigger: async (id: string, input: UpdateExtensionInput) =>
      await trigger({ variables: { id, input } }),
    data: data?.updateExtension,
    loading,
    error,
  };
};

export const useExtension = (): ExtensionOperations => {
  return {
    getAllExtensions: createGetAllExtensionsHook(),
    getExtensionById: createGetExtensionByIdHook(),
    addExtension: createAddExtensionHook(),
    updateExtension: createUpdateExtensionHook(),
  };
};
