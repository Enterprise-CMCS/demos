import { gql, useLazyQuery } from "@apollo/client";
import { User } from "demos-server";
import { USER_OPTIONS_QUERY } from "queries/userQueries";

export const GET_ALL_USERS = gql`
  query GetUsers {
    users {
      fullName
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      fullName
    }
  }
`;

interface GetAllUsersOperation {
  trigger: () => void;
  data?: User[];
  loading: boolean;
  error?: Error;
}

export type UserOption = Pick<User, "fullName">;

interface GetUserOptionsOperation {
  trigger: () => void;
  data?: UserOption[];
  loading: boolean;
  error?: Error;
}

interface GetUserByIdOperation {
  trigger: (id: string) => void;
  data?: User;
  loading: boolean;
  error?: Error;
}

export interface UserOperations {
  getAllUsers: GetAllUsersOperation;
  getUserById: GetUserByIdOperation;
  getUserOptions: GetUserOptionsOperation;
}

export const useUserOperations = (): UserOperations => {
  const [
    triggerGetAllUsers,
    { data: allUsersData, loading: allUsersLoading, error: allUsersError },
  ] = useLazyQuery<{ users: User[] }>(GET_ALL_USERS);

  const getAllUsers: GetAllUsersOperation = {
    trigger: () => triggerGetAllUsers(),
    data: allUsersData?.users,
    loading: allUsersLoading,
    error: allUsersError,
  };

  const [
    triggerGetUserOptions,
    { data: userOptionsData, loading: userOptionsLoading, error: userOptionsError },
  ] = useLazyQuery<{ users: UserOption[] }>(USER_OPTIONS_QUERY);

  const getUserOptions: GetUserOptionsOperation = {
    trigger: () => triggerGetUserOptions(),
    data: userOptionsData?.users,
    loading: userOptionsLoading,
    error: userOptionsError,
  };

  const [
    triggerGetUserById,
    { data: userByIdData, loading: userByIdLoading, error: userByIdError },
  ] = useLazyQuery<{ user: User }>(GET_USER_BY_ID);

  const getUserById: GetUserByIdOperation = {
    trigger: (id: string) => triggerGetUserById({ variables: { id } }),
    data: userByIdData?.user,
    loading: userByIdLoading,
    error: userByIdError,
  };

  return { getAllUsers, getUserOptions, getUserById };
};
