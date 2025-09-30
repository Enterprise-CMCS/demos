import { ApolloError, FetchResult, useLazyQuery, useMutation } from "@apollo/client";
import { Amendment, CreateAmendmentInput, UpdateAmendmentInput } from "demos-server";
import {
  ADD_AMENDMENT_MUTATION,
  GET_ALL_AMENDMENTS_QUERY,
  GET_AMENDMENT_BY_ID_QUERY,
  UPDATE_AMENDMENT_MUTATION,
} from "queries/amendmentQueries";

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
  trigger: (input: CreateAmendmentInput) => Promise<FetchResult<{ addAmendment: Amendment }>>;
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
  addAmendment: CreateAmendmentOperation;
  updateAmendment: UpdateAmendmentOperation;
}

const createGetAllAmendmentsOperation = (): GetAllAmendmentsOperation => {
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

const createGetAmendmentByIdOperation = (): GetAmendmentByIdOperation => {
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

const createAddAmendmentOperation = (): CreateAmendmentOperation => {
  const [trigger, { data, loading, error }] = useMutation<{
    addAmendment: Amendment;
  }>(ADD_AMENDMENT_MUTATION);

  return {
    trigger: async (input: CreateAmendmentInput) => await trigger({ variables: { input } }),
    data: data?.addAmendment,
    loading,
    error,
  };
};

const createUpdateAmendmentOperation = (): UpdateAmendmentOperation => {
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
    getAllAmendments: createGetAllAmendmentsOperation(),
    getAmendmentById: createGetAmendmentByIdOperation(),
    addAmendment: createAddAmendmentOperation(),
    updateAmendment: createUpdateAmendmentOperation(),
  };
};
