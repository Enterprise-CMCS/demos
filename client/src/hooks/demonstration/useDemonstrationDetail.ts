import { useEffect } from "react";
import { gql, useLazyQuery } from "@apollo/client";
import { DemonstrationDetail } from "pages/DemonstrationDetail";

export const DEMONSTRATION_DETAIL_QUERY = gql`
  query DemonstrationDetailQuery($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      effectiveDate
      expirationDate
      state {
        id
      }
      demonstrationStatus {
        name
      }
      projectOfficer {
        fullName
      }
      amendments {
        name
        effectiveDate
        amendmentStatus {
          name
        }
      }
      extensions {
        name
        effectiveDate
        extensionStatus {
          name
        }
      }
    }
  }
`;

export const useDemonstrationDetail = (id?: string) => {
  const [getDemonstration, { data, loading, error }] = useLazyQuery<{
    demonstration: DemonstrationDetail;
  }>(DEMONSTRATION_DETAIL_QUERY);

  useEffect(() => {
    if (id) {
      getDemonstration({ variables: { id } });
    }
  }, [id, getDemonstration]);

  return {
    demonstration: data?.demonstration,
    loading,
    error,
  };
};
