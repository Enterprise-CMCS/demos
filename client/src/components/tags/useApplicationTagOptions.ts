import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { Tag } from "demos-server";

export const GET_APPLICATION_TAG_OPTIONS: TypedDocumentNode<
  {
    applicationTagOptions: Tag[];
  },
  Record<string, never>
> = gql`
  query GetApplicationTagOptions {
    applicationTagOptions {
      tagName
      approvalStatus
    }
  }
`;

export const useApplicationTagOptions = () => {
  const { data, loading, error } = useQuery(GET_APPLICATION_TAG_OPTIONS);
  return { data, loading, error };
};
