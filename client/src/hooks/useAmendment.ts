import { Amendment, CreateAmendmentInput, UpdateAmendmentInput } from "demos-server";
import {
  CREATE_AMENDMENT_MUTATION,
  GET_ALL_AMENDMENTS_QUERY,
  GET_AMENDMENT_BY_ID_QUERY,
  UPDATE_AMENDMENT_MUTATION,
} from "queries/amendmentQueries";

import { ApolloError, FetchResult, useLazyQuery, useMutation } from "@apollo/client";

interface GetAllAmendmentsOperation {
  trigger: () => void;
  data?: Amendment[];
  loading: boolean;
  error?: ApolloError;
}

interface GetAmendmentByIdOperation {
  trigger: (id: string) => void;
  data?: Amendment;
  loading: boolean;
  error?: ApolloError;
}

interface CreateAmendmentOperation {
  trigger: (input: CreateAmendmentInput) => Promise<FetchResult<{ createAmendment: Amendment }>>;
  data?: Amendment;
  loading: boolean;
  error?: ApolloError;
}

interface UpdateAmendmentOperation {
  trigger: (
    id: string,
    input: UpdateAmendmentInput
  ) => Promise<FetchResult<{ updateAmendment: Amendment }>>;
  data?: Amendment;
  loading: boolean;
  error?: ApolloError;
}

export interface AmendmentOperations {
  getAllAmendments: GetAllAmendmentsOperation;
  getAmendmentById: GetAmendmentByIdOperation;
  createAmendment: CreateAmendmentOperation;
  updateAmendment: UpdateAmendmentOperation;
}

const createGetAllAmendmentsHook = (): GetAllAmendmentsOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    amendments: Amendment[];
  }>(GET_ALL_AMENDMENTS_QUERY);

  return {
    trigger,
    data: data?.amendments,
    loading,
    error,
  };
};

const createGetAmendmentByIdHook = (): GetAmendmentByIdOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    amendment: Amendment;
  }>(GET_AMENDMENT_BY_ID_QUERY);

  return {
    trigger: (id: string) => trigger({ variables: { id } }),
    data: data?.amendment,
    loading,
    error,
  };
};

const createCreateAmendmentHook = (): CreateAmendmentOperation => {
  const [trigger, { data, loading, error }] = useMutation<{
    createAmendment: Amendment;
  }>(CREATE_AMENDMENT_MUTATION);

  return {
    trigger: async (input: CreateAmendmentInput) => await trigger({ variables: { input } }),
    data: data?.createAmendment,
    loading,
    error,
  };
};

const createUpdateAmendmentHook = (): UpdateAmendmentOperation => {
  const [trigger, { data, loading, error }] = useMutation<{
    updateAmendment: Amendment;
  }>(UPDATE_AMENDMENT_MUTATION);

  return {
    trigger: async (id: string, input: UpdateAmendmentInput) =>
      await trigger({ variables: { id, input } }),
    data: data?.updateAmendment,
    loading,
    error,
  };
};

export const useAmendment = (): AmendmentOperations => {
  return {
    getAllAmendments: createGetAllAmendmentsHook(),
    getAmendmentById: createGetAmendmentByIdHook(),
    createAmendment: createCreateAmendmentHook(),
    updateAmendment: createUpdateAmendmentHook(),
  };
};
