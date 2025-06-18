import { gql, useLazyQuery, useMutation, ApolloError } from "@apollo/client";
import {
  Demonstration,
  AddDemonstrationInput,
  UpdateDemonstrationInput,
} from "demos-server";

export const GET_ALL_DEMONSTRATIONS = gql`
  query GetDemonstrations {
    demonstrations {
      id
      name
      description
      evaluationPeriodStartDate
      evaluationPeriodEndDate
      createdAt
      updatedAt
      demonstrationStatus {
        id
        name
      }
      state {
        id
        stateName
        stateCode
      }
      users {
        id
        fullName
      }
    }
  }
`;

export const GET_DEMONSTRATION_BY_ID = gql`
  query GetDemonstration($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      evaluationPeriodStartDate
      evaluationPeriodEndDate
      createdAt
      updatedAt
      demonstrationStatus {
        id
        name
      }
      state {
        id
        stateName
        stateCode
      }
      users {
        id
        fullName
      }
    }
  }
`;

export const ADD_DEMONSTRATION = gql`
  mutation AddDemonstration($input: AddDemonstrationInput!) {
    addDemonstration(input: $input) {
      id
      name
      description
      evaluationPeriodStartDate
      evaluationPeriodEndDate
      createdAt
      updatedAt
      demonstrationStatus {
        id
        name
      }
      state {
        id
        stateName
        stateCode
      }
      users {
        id
        fullName
      }
    }
  }
`;

export const UPDATE_DEMONSTRATION = gql`
  mutation UpdateDemonstration($input: UpdateDemonstrationInput!) {
    updateDemonstration(input: $input) {
      id
      name
      description
      evaluationPeriodStartDate
      evaluationPeriodEndDate
      createdAt
      updatedAt
      demonstrationStatus {
        id
        name
      }
      state {
        id
        stateName
        stateCode
      }
      users {
        id
        fullName
      }
    }
  }
`;

export const DELETE_DEMONSTRATION = gql`
  mutation DeleteDemonstration($id: ID!) {
    deleteDemonstration(id: $id) {
      id
      name
    }
  }
`;

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

interface UpdateDemonstrationOperation {
  trigger: (input: UpdateDemonstrationInput & { id: string }) => void;
  data?: Demonstration;
  loading: boolean;
  error?: ApolloError;
}

interface DeleteDemonstrationOperation {
  trigger: (id: string) => void;
  data?: Demonstration;
  loading: boolean;
  error?: ApolloError;
}

export interface DemonstrationOperations {
  getAllDemonstrations: GetAllDemonstrationsOperation;
  getDemonstrationById: GetDemonstrationByIdOperation;
  addDemonstration: AddDemonstrationOperation;
  updateDemonstration: UpdateDemonstrationOperation;
  deleteDemonstration: DeleteDemonstrationOperation;
}

export const useDemonstration = (): DemonstrationOperations => {
  const [
    triggerGetAllDemonstrations,
    {
      data: allDemonstrationsData,
      loading: allDemonstrationsLoading,
      error: allDemonstrationsError,
    },
  ] = useLazyQuery<{ demonstrations: Demonstration[] }>(GET_ALL_DEMONSTRATIONS);

  const getAllDemonstrations: GetAllDemonstrationsOperation = {
    trigger: () => triggerGetAllDemonstrations(),
    data: allDemonstrationsData?.demonstrations,
    loading: allDemonstrationsLoading,
    error: allDemonstrationsError,
  };

  const [
    triggerGetDemonstrationById,
    {
      data: demonstrationByIdData,
      loading: demonstrationByIdLoading,
      error: demonstrationByIdError,
    },
  ] = useLazyQuery<{ demonstration: Demonstration }>(GET_DEMONSTRATION_BY_ID);

  const getDemonstrationById: GetDemonstrationByIdOperation = {
    trigger: (id: string) => triggerGetDemonstrationById({ variables: { id } }),
    data: demonstrationByIdData?.demonstration,
    loading: demonstrationByIdLoading,
    error: demonstrationByIdError,
  };

  const [
    triggerAddDemonstration,
    {
      data: addDemonstrationData,
      loading: addDemonstrationLoading,
      error: addDemonstrationError,
    },
  ] = useMutation<{ addDemonstration: Demonstration }>(ADD_DEMONSTRATION);

  const addDemonstration: AddDemonstrationOperation = {
    trigger: (input: AddDemonstrationInput) =>
      triggerAddDemonstration({ variables: { input } }),
    data: addDemonstrationData?.addDemonstration,
    loading: addDemonstrationLoading,
    error: addDemonstrationError,
  };

  const [
    triggerUpdateDemonstration,
    {
      data: updateDemonstrationData,
      loading: updateDemonstrationLoading,
      error: updateDemonstrationError,
    },
  ] = useMutation<{ updateDemonstration: Demonstration }>(UPDATE_DEMONSTRATION);

  const updateDemonstration: UpdateDemonstrationOperation = {
    trigger: ({ id, ...input }: UpdateDemonstrationInput & { id: string }) =>
      triggerUpdateDemonstration({ variables: { input: { ...input, id } } }),
    data: updateDemonstrationData?.updateDemonstration,
    loading: updateDemonstrationLoading,
    error: updateDemonstrationError,
  };

  const [
    triggerDeleteDemonstration,
    {
      data: deleteDemonstrationData,
      loading: deleteDemonstrationLoading,
      error: deleteDemonstrationError,
    },
  ] = useMutation<{ deleteDemonstration: Demonstration }>(DELETE_DEMONSTRATION);

  const deleteDemonstration: DeleteDemonstrationOperation = {
    trigger: (id: string) => triggerDeleteDemonstration({ variables: { id } }),
    data: deleteDemonstrationData?.deleteDemonstration,
    loading: deleteDemonstrationLoading,
    error: deleteDemonstrationError,
  };

  return {
    getAllDemonstrations,
    getDemonstrationById,
    addDemonstration,
    updateDemonstration,
    deleteDemonstration,
  };
};
