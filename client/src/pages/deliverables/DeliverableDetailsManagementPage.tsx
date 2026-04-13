import React from "react";
import { useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { Deliverable, Demonstration } from "demos-server";
import { Loading } from "components/loading/Loading";
import { formatDate } from "util/formatDate";

export const GET_DELIVERABLE_DETAILS_QUERY_NAME = "GetDeliverableDetails";
export const DELIVERABLE_DETAILS_QUERY = gql`
  query ${GET_DELIVERABLE_DETAILS_QUERY_NAME}($id: ID!) {
    deliverable(id: $id) {
      id
      deliverableType
      demonstration {
        id
        name
        state {
          id
        }
      }
      cmsOwner {
        person {
          fullName
        }
      }
      dueDate
      status
    }
  }
`;

export type DeliverableDetailsManagementDeliverable = Pick<Deliverable, "id" | "deliverableType" | "dueDate" | "status"> & {
  demonstration: Pick<Demonstration, "id" | "name"> & { state: { id: string } };
  cmsOwner: { person: { fullName: string } };
};


export const DeliverableDetailsManagementPage: React.FC = () => {
  const { deliverableId } = useParams<{ deliverableId: string }>();

  const { data, loading, error } = useQuery<{ deliverable: DeliverableDetailsManagementDeliverable }>(
    DELIVERABLE_DETAILS_QUERY,
    { variables: { id: deliverableId } }
  );

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <div>Error loading deliverable: {error.message}</div>;
  }
  if (!data || !data.deliverable) {
    return <div>Deliverable not found.</div>;
  }

  const deliverable = data.deliverable;

  return (
    <div className="shadow-md bg-white p-[16px]">
      <h1 className="text-[20px] font-bold mb-[24px] text-brand uppercase border-b-1 pb-[8px]">
        DELIVERABLES
      </h1>
      <dl className="grid grid-cols-2">
        <dt>Demonstration</dt>
        <dd>{deliverable.demonstration.name}</dd>

        <dt>Type</dt>
        <dd>{deliverable.deliverableType}</dd>

        <dt>CMS Owner</dt>
        <dd>{deliverable.cmsOwner.person.fullName}</dd>

        <dt>Due Date</dt>
        <dd>{formatDate(deliverable.dueDate)}</dd>

        <dt>Status</dt>
        <dd>{deliverable.status}</dd>

        <dt>State</dt>
        <dd>{deliverable.demonstration.state.id}</dd>
      </dl>
    </div>
  );
};
