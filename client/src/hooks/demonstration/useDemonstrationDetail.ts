import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { gql, useLazyQuery } from "@apollo/client";
import { DemonstrationDetail } from "pages/DemonstrationDetail";
import { DemonstrationHeaderDetails } from "pages/DemonstrationDetail/DemonstrationDetailHeader";
import { DemonstrationModalDetails } from "pages/DemonstrationDetail/DemonstrationDetailModals";
import { AmendmentTableRow } from "components/table/tables/AmendmentTable";
import { ExtensionTableRow } from "components/table/tables/ExtensionTable";

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

export type DemonstrationDetail = DemonstrationHeaderDetails &
  DemonstrationModalDetails & {
    amendments: AmendmentTableRow[];
    extensions: ExtensionTableRow[];
  };

export const useDemonstrationDetail = () => {
  const { id } = useParams<{ id: string }>();

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
    demonstrationId: id,
  };
};
