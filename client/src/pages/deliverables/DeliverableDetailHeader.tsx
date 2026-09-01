import React from "react";
import { gql, useQuery } from "@apollo/client";
import { Loading } from "components/loading/Loading";
import { BaseDemonstrationHeader } from "pages/DemonstrationDetail/BaseDemonstrationHeader";
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

export const DeliverableDetailHeader = () => {
  const params = useParams<{ deliverableId: string }>();

  if (!params.deliverableId) {
    throw new Error(
      "DeliverableDetailHeader must be rendered within a route with :deliverableId param"
    );
  }

  return <DeliverableDetailHeaderInner deliverableId={params.deliverableId} />;
};

const DeliverableDetailHeaderInner: React.FC<{ deliverableId: string }> = ({ deliverableId }) => {
  const { data, loading, error } = useQuery<DeliverableDetailHeaderQueryResponse>(
    DELIVERABLE_DETAIL_HEADER_QUERY,
    { variables: { deliverableId } }
  );

  if (loading) {
    return <Loading />;
  }

  const deliverable = data?.deliverable;
  if (error || !deliverable) {
    return <div>Error loading deliverable</div>;
  }

  return <BaseDemonstrationHeader demonstrationId={deliverable.demonstration.id} />;
};
