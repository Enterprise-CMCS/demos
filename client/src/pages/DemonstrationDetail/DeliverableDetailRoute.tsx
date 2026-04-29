import React from "react";
import { gql, useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { DemonstrationDetail } from "./DemonstrationDetail";

export const DELIVERABLE_DEMONSTRATION_ID_QUERY = gql`
  query DeliverableDemonstrationIdQuery($deliverableId: ID!) {
    deliverable(id: $deliverableId) {
      id
      demonstration {
        id
      }
    }
  }
`;

export const DeliverableDetailRoute: React.FC = () => {
  const { deliverableId } = useParams<{ deliverableId?: string }>();
  const { data, loading, error } = useQuery<{
    deliverable: {
      id: string;
      demonstration: {
        id: string;
      };
    };
  }>(DELIVERABLE_DEMONSTRATION_ID_QUERY, {
    variables: { deliverableId: deliverableId ?? "" },
    skip: !deliverableId,
  });

  const demonstrationId = data?.deliverable?.demonstration?.id;

  if (loading) {
    return <div>Loading demonstration...</div>;
  }

  if (error || !demonstrationId) {
    return <div>Failed to load demonstration.</div>;
  }

  return <DemonstrationDetail demonstrationId={demonstrationId} />;
};
