import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";

export const GET_DEMONSTRATION_OPTIONS_QUERY = gql`
  query GetDemonstrationOptions {
    demonstrations {
      id
      name
    }
  }
`;

interface DemonstrationOption {
  id: string;
  name: string;
}

interface DemonstrationOptionsQueryResult {
  demonstrations: DemonstrationOption[];
}

export const useDemonstrationOptions = () => {
  const { data, loading, error } = useQuery<DemonstrationOptionsQueryResult>(
    GET_DEMONSTRATION_OPTIONS_QUERY
  );

  // Convert demonstrations to options format for the dropdown
  const demoOptions =
    data?.demonstrations?.map((demo) => ({
      label: demo.name,
      value: demo.id,
    })) || [];

  return {
    demoOptions,
    loading,
    error,
  };
};
