import { useLazyQuery, useMutation, ApolloError } from "@apollo/client";
import { Demonstration, AddDemonstrationInput } from "demos-server";
import {
  ADD_DEMONSTRATION_QUERY,
  GET_ALL_DEMONSTRATIONS_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
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
  trigger: (input: AddDemonstrationInput) => void;
  data?: Demonstration;
  loading: boolean;
  error?: ApolloError;
}

export interface DemonstrationOperations {
  getAllDemonstrations: GetAllDemonstrationsOperation;
  getDemonstrationById: GetDemonstrationByIdOperation;
  addDemonstration: AddDemonstrationOperation;
}

const createGetAllDemonstrationsHook = (): GetAllDemonstrationsOperation => {
  const [
    triggerGetAllDemonstrations,
    {
      data: allDemonstrationsData,
      loading: allDemonstrationsLoading,
      error: allDemonstrationsError,
    },
  ] = useLazyQuery<{ demonstrations: Demonstration[] }>(
    GET_ALL_DEMONSTRATIONS_QUERY
  );

  return {
    trigger: () => triggerGetAllDemonstrations(),
    data: allDemonstrationsData?.demonstrations,
    loading: allDemonstrationsLoading,
    error: allDemonstrationsError,
  };
};

const createGetDemonstrationByIdHook = (): GetDemonstrationByIdOperation => {
  const [
    triggerGetDemonstrationById,
    {
      data: demonstrationByIdData,
      loading: demonstrationByIdLoading,
      error: demonstrationByIdError,
    },
  ] = useLazyQuery<{ demonstration: Demonstration }>(
    GET_DEMONSTRATION_BY_ID_QUERY
  );

  return {
    trigger: (id: string) => triggerGetDemonstrationById({ variables: { id } }),
    data: demonstrationByIdData?.demonstration,
    loading: demonstrationByIdLoading,
    error: demonstrationByIdError,
  };
};

const createAddDemonstrationHook = (): AddDemonstrationOperation => {
  const [
    triggerAddDemonstration,
    {
      data: addDemonstrationData,
      loading: addDemonstrationLoading,
      error: addDemonstrationError,
    },
  ] = useMutation<{ addDemonstration: Demonstration }>(ADD_DEMONSTRATION_QUERY);

  return {
    trigger: (input: AddDemonstrationInput) =>
      triggerAddDemonstration({ variables: { input } }),
    data: addDemonstrationData?.addDemonstration,
    loading: addDemonstrationLoading,
    error: addDemonstrationError,
  };
};

export const useDemonstration = (): DemonstrationOperations => {
  return {
    getAllDemonstrations: createGetAllDemonstrationsHook(),
    getDemonstrationById: createGetDemonstrationByIdHook(),
    addDemonstration: createAddDemonstrationHook(),
  };
};
