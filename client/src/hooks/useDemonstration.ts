import {
  useLazyQuery,
  useMutation,
  ApolloError,
  FetchResult,
} from "@apollo/client";
import { Demonstration, AddDemonstrationInput } from "demos-server";
import {
  ADD_DEMONSTRATION_QUERY,
  GET_ALL_DEMONSTRATIONS_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "queries/demonstrationQueries";

interface GetAllDemonstrationsOperation {
  trigger: () => void;
  data?: Demonstration[];
  loading: boolean;
  error?: ApolloError;
}

interface GetDemonstrationByIdOperation {
  trigger: (id: string) => void;
  data?: Demonstration;
  loading: boolean;
  error?: ApolloError;
}

interface AddDemonstrationOperation {
  trigger: (
    input: AddDemonstrationInput
  ) => Promise<FetchResult<{ addDemonstration: Demonstration }>>;
  data?: Demonstration;
  loading: boolean;
  error?: ApolloError;
}

interface UpdateDemonstrationOperation {
  trigger: (
    id: string,
    input: AddDemonstrationInput // or UpdateDemonstrationInput if defined separately
  ) => Promise<FetchResult<{ updateDemonstration: Demonstration }>>;
  data?: Demonstration;
  loading: boolean;
  error?: ApolloError;
}

export interface DemonstrationOperations {
  getAllDemonstrations: GetAllDemonstrationsOperation;
  getDemonstrationById: GetDemonstrationByIdOperation;
  addDemonstration: AddDemonstrationOperation;
  updateDemonstration: UpdateDemonstrationOperation;
}

const createGetAllDemonstrationsHook = (): GetAllDemonstrationsOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    demonstrations: Demonstration[];
  }>(GET_ALL_DEMONSTRATIONS_QUERY);

  return {
    trigger,
    data: data?.demonstrations,
    loading,
    error,
  };
};

const createGetDemonstrationByIdHook = (): GetDemonstrationByIdOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    demonstration: Demonstration;
  }>(GET_DEMONSTRATION_BY_ID_QUERY);

  return {
    trigger: (id: string) => trigger({ variables: { id } }),
    data: data?.demonstration,
    loading,
    error,
  };
};

const createAddDemonstrationHook = (): AddDemonstrationOperation => {
  const [trigger, { data, loading, error }] = useMutation<{
    addDemonstration: Demonstration;
  }>(ADD_DEMONSTRATION_QUERY);

  return {
    trigger: async (input: AddDemonstrationInput) =>
      await trigger({ variables: { input } }),
    data: data?.addDemonstration,
    loading,
    error,
  };
};

const createUpdateDemonstrationHook = (): UpdateDemonstrationOperation => {
  const [trigger, { data, loading, error }] = useMutation<{
    updateDemonstration: Demonstration;
  }>(UPDATE_DEMONSTRATION_MUTATION);

  return {
    trigger: async (id: string, input: AddDemonstrationInput) =>
      await trigger({ variables: { id, input } }),
    data: data?.updateDemonstration,
    loading,
    error,
  };
};

export const useDemonstration = (): DemonstrationOperations => {
  return {
    getAllDemonstrations: createGetAllDemonstrationsHook(),
    getDemonstrationById: createGetDemonstrationByIdHook(),
    addDemonstration: createAddDemonstrationHook(),
    updateDemonstration: createUpdateDemonstrationHook(),
  };
};
