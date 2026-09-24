import { gql, useQuery } from "@apollo/client";
import { Tag } from "demos-server";

export const GET_APPLICATION_TAG_OPTIONS = gql`
  query GetApplicationTagOptions {
    applicationTagOptions {
      tagName
      approvalStatus
    }
  }
`;

export const useApplicationTagOptions = () => {
  const { data, loading, error } = useQuery<{
    applicationTagOptions: Tag[];
  }>(GET_APPLICATION_TAG_OPTIONS);
  return { data, loading, error };
};
