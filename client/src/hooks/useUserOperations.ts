import { gql, useLazyQuery } from "@apollo/client";
import { User } from "demos-server";

export const GET_ALL_USERS = gql`
  query GetUsers {
    users {
      firstName
      lastName
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      firstName
      lastName
    }
  }
`;

interface GetAllUsersOperation {
  trigger: () => void;
  data?: User[];
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
    triggerGetUserById,
    { data: userByIdData, loading: userByIdLoading, error: userByIdError },
  ] = useLazyQuery<{ user: User }>(GET_USER_BY_ID);

  const getUserById: GetUserByIdOperation = {
    trigger: (id: string) => triggerGetUserById({ variables: { id } }),
    data: userByIdData?.user,
    loading: userByIdLoading,
    error: userByIdError,
  };

  return { getAllUsers, getUserById };
};
