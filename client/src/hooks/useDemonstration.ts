import { useLazyQuery, useMutation, ApolloError, FetchResult } from "@apollo/client";
import { Demonstration as ServerDemonstration, CreateDemonstrationInput } from "demos-server";
import {
  ADD_DEMONSTRATION_QUERY,
  DEMONSTRATION_TABLE_QUERY,
  GET_ALL_DEMONSTRATIONS_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "queries/demonstrationQueries";

type Demonstration = ServerDemonstration & {
  extensions: {
    name: string;
    projectOfficer: { fullName: string };
    extensionStatus: { name: string };
  }[];
};

interface GetAllDemonstrationsOperation {
  trigger: () => void;
  data?: Demonstration[];
  loading: boolean;
  error?: ApolloError;
}

// TODO: as the demonstration model changes, this will likely need to be updated
export type DemonstrationTableItem = {
  id: Demonstration["id"];
  name: Demonstration["name"];
  state: Pick<Demonstration["state"], "name">;
  projectOfficer: Pick<Demonstration["projectOfficer"], "fullName">;
  users: Pick<Demonstration["users"][number], "id">[];
  demonstrationStatus: Pick<Demonstration["demonstrationStatus"], "name">;
  amendments: {
    id: Demonstration["amendments"][number]["id"];
    name: Demonstration["amendments"][number]["name"];
    projectOfficer: Pick<Demonstration["amendments"][number]["projectOfficer"], "fullName">;
    amendmentStatus: Pick<Demonstration["amendments"][number]["amendmentStatus"], "name">;
  }[];
  extensions: {
    id: Demonstration["extensions"][number]["id"];
    name: Demonstration["extensions"][number]["name"];
    projectOfficer: Pick<Demonstration["extensions"][number]["projectOfficer"], "fullName">;
    extensionStatus: Pick<Demonstration["extensions"][number]["extensionStatus"], "name">;
  }[];
};

interface GetDemonstrationTableOperation {
  trigger: () => void;
  data?: DemonstrationTableItem[];
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
    input: CreateDemonstrationInput
  ) => Promise<FetchResult<{ addDemonstration: Demonstration }>>;
  data?: Demonstration;
  loading: boolean;
  error?: ApolloError;
}

interface UpdateDemonstrationOperation {
  trigger: (
    id: string,
    input: CreateDemonstrationInput // or UpdateDemonstrationInput if defined separately
  ) => Promise<FetchResult<{ updateDemonstration: Demonstration }>>;
  data?: Demonstration;
  loading: boolean;
  error?: ApolloError;
}

export interface DemonstrationOperations {
  getAllDemonstrations: GetAllDemonstrationsOperation;
  getDemonstrationTable: GetDemonstrationTableOperation;
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

const createGetDemonstrationTableHook = (): GetDemonstrationTableOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    demonstrations: DemonstrationTableItem[];
  }>(DEMONSTRATION_TABLE_QUERY);

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
    trigger: async (input: CreateDemonstrationInput) => await trigger({ variables: { input } }),
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
    trigger: async (id: string, input: CreateDemonstrationInput) =>
      await trigger({ variables: { id, input } }),
    data: data?.updateDemonstration,
    loading,
    error,
  };
};

export const useDemonstration = (): DemonstrationOperations => {
  return {
    getAllDemonstrations: createGetAllDemonstrationsHook(),
    getDemonstrationTable: createGetDemonstrationTableHook(),
    getDemonstrationById: createGetDemonstrationByIdHook(),
    addDemonstration: createAddDemonstrationHook(),
    updateDemonstration: createUpdateDemonstrationHook(),
  };
};
