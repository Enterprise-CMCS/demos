import React from "react";
import { gql, useQuery } from "@apollo/client";
import { Loading } from "components/loading";
import { DemonstrationDetailHeader } from "pages/DemonstrationDetail/DemonstrationDetailHeader";
import { useParams } from "react-router-dom";

export const DELIVERABLE_DETAIL_HEADER_QUERY_NAME = "DeliverableDetailHeader";
export const DELIVERABLE_DETAIL_HEADER_QUERY = gql`
  query ${DELIVERABLE_DETAIL_HEADER_QUERY_NAME}($deliverableId: ID!) {
    deliverable(id: $deliverableId) {
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
};

export const DeliverableDetailHeader = ({ deliverableId }: { deliverableId: string }) => {
  const { data, loading } = useQuery<DeliverableDetailHeaderQueryResponse>(
    DELIVERABLE_DETAIL_HEADER_QUERY,
    { variables: { deliverableId } }
  );

  if (loading) {
    return <Loading />;
  }

  const demonstrationId = data?.deliverable?.demonstration?.id;
  if (!demonstrationId) {
    return null;
  }

  return <DemonstrationDetailHeader demonstrationId={demonstrationId} />;
};

export const DeliverableDetailRouteHeader: React.FC = () => {
  const { deliverableId } = useParams<{ deliverableId?: string }>();

  if (!deliverableId) {
    throw new Error("DeliverableDetailRouteHeader requires route param deliverableId.");
  }

  return <DeliverableDetailHeader deliverableId={deliverableId} />;
};
