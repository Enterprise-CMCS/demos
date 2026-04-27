import React from "react";
import { useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { Deliverable, Demonstration } from "demos-server";
import { Loading } from "components/loading/Loading";
import { CommentBox } from "./sections/CommentBox";
import { DeliverableButtons } from "./sections/DeliverableButtons";
import { DeliverableInfoFields } from "./sections/DeliverableInfoFields";
import { FileAndHistoryTabs } from "./sections/FileAndHistoryTabs";

export const GET_DELIVERABLE_DETAILS_QUERY_NAME = "GetDeliverableDetails";
export const DELIVERABLE_DETAILS_QUERY = gql`
  query ${GET_DELIVERABLE_DETAILS_QUERY_NAME}($id: ID!) {
    deliverable(id: $id) {
      id
      name
      deliverableType
      dueDate
      createdAt
      status
      demonstration {
        id
        name
        expirationDate
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

export type DeliverableDetailsManagementDeliverable = Pick<
  Deliverable,
  "id" | "deliverableType" | "dueDate" | "createdAt" | "status" | "name"
> & {
  demonstration: Pick<Demonstration, "id" | "name" | "expirationDate"> & { state: { id: string } };
  cmsOwner: { person: { fullName: string } };
};

export const DeliverableDetailsManagementPage: React.FC = () => {
  const { deliverableId } = useParams<{ deliverableId: string }>();

  const { data, loading, error } = useQuery<{
    deliverable: DeliverableDetailsManagementDeliverable;
  }>(DELIVERABLE_DETAILS_QUERY, { variables: { id: deliverableId } });

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <div>Error loading deliverable: {error.message}</div>;
  }
  if (!data || !data.deliverable) {
    return <div>Deliverable not found.</div>;
  }

  return (
    <div className="shadow-md bg-white p-[16px] h-full flex flex-col">
      <h1 className="text-[20px] font-bold mb-[24px] text-brand uppercase border-b pb-[8px]">
        DELIVERABLES
      </h1>
      <h2 className="text-brand text-md uppercase font-bold">{data.deliverable.name}</h2>
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start">
          <DeliverableInfoFields deliverable={data.deliverable} />
          <DeliverableButtons deliverable={data.deliverable} />
        </div>
        <div className="flex w-full gap-2 flex-1">
          <div className="flex-1">
            <FileAndHistoryTabs />
          </div>
          <div>
            <CommentBox />
          </div>
        </div>
      </div>
    </div>
  );
};
