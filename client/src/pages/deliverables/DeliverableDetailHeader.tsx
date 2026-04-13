import React from "react";
import { gql, useQuery } from "@apollo/client";
import { Loading } from "components/loading/Loading";
import { DemonstrationDetailHeader } from "pages/DemonstrationDetail/DemonstrationDetailHeader";

export const DELIVERABLE_DETAIL_HEADER_QUERY_NAME = "DeliverableDetailHeader";
export const DELIVERABLE_DETAIL_HEADER_QUERY = gql`
  query ${DELIVERABLE_DETAIL_HEADER_QUERY_NAME}($id: ID!) {
    deliverable(id: $id) {
      id
      demonstration {
        id
      }
    }
  }
`;

type DeliverableDetailHeaderQueryResponse = {
  deliverable: {
    id: string;
    demonstration: {
      id: string;
    };
  };
}

export const DeliverableDetailHeader = ({deliverableId}: {deliverableId: string}) => {
  const { data, loading } = useQuery<DeliverableDetailHeaderQueryResponse>(DELIVERABLE_DETAIL_HEADER_QUERY, { variables: { id: deliverableId } });

  if (loading) {
    return <Loading />;
  }

  const demonstrationId = data?.deliverable?.demonstration?.id;
  if (!demonstrationId) {
    return null;
  }

  return <DemonstrationDetailHeader demonstrationId={demonstrationId} />;
};
