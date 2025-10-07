import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";

export const GET_DEMONSTRATION_BY_ID_QUERY = gql`
  query GetDemonstrationById($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      state {
        id
        name
      }
      roles {
        isPrimary
        role
        person {
          id
          fullName
        }
      }
    }
  }
`;

interface DemonstrationState {
  id: string;
  name: string;
}

interface DemonstrationRole {
  isPrimary: boolean;
  role: string;
  person: {
    id: string;
    fullName: string;
  };
}

interface DemonstrationDetails {
  id: string;
  name: string;
  description: string;
  state: DemonstrationState;
  roles: DemonstrationRole[];
}

interface DemonstrationQueryResult {
  demonstration: DemonstrationDetails;
}

export const useDemonstration = (id?: string) => {
  const { data, loading, error } = useQuery<DemonstrationQueryResult>(
    GET_DEMONSTRATION_BY_ID_QUERY,
    {
      variables: { id: id! },
      skip: !id,
      fetchPolicy: "cache-first",
    }
  );

  const demonstration = data?.demonstration;

  // Extract project officer information
  const projectOfficer = demonstration?.roles.find(
    (role) => role.role === "Project Officer" && role.isPrimary === true
  );

  return {
    demonstration,
    projectOfficer,
    loading,
    error,
  };
};
