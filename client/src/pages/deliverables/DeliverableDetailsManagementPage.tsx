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
      name
      deliverableType
      dueDate
      status
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
    }
  }
`;

const DeliverableInfoFields = ({deliverable}: {deliverable: DeliverableDetailsManagementDeliverable}) => {
  const displayFields = [
    { label: "Deliverable Type", value: deliverable.deliverableType },
    { label: "Due Date", value: formatDate(deliverable.dueDate) },
    { label: "Submission Date", value: "—" },
    { label: "Status", value: deliverable.status },
  ];

  const VerticalRule = () => (
    <div className="text-[18px] mt-0.5 font-title font-normal opacity-70" aria-hidden="true">|</div>
  );

  return (
    <div className="inline-flex flex-wrap items-center gap-1">
      {displayFields.map((field, index) => (
        <React.Fragment key={field.label}>
          <div className="text-[16px] mt-0.5 font-title">
            <span className="font-semibold">{field.label}:{" "}</span>
            <span className="font-normal" data-testid={`deliverable-${field.label}`}>
              {field.value}
            </span>
          </div>
          {index < displayFields.length - 1 && (<VerticalRule />)}
        </React.Fragment>
      ))}
    </div>
  );

};

export type DeliverableDetailsManagementDeliverable = Pick<Deliverable, "id" | "deliverableType" | "dueDate" | "status" | "name" > & {
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
      <h1 className="text-[20px] font-bold mb-[24px] text-brand uppercase border-b pb-[8px]">
        DELIVERABLES
      </h1>
      <h2 className="text-brand text-lg uppercase font-bold">{deliverable.name}</h2>
      <DeliverableInfoFields deliverable={deliverable} />
    </div>
  );
};
