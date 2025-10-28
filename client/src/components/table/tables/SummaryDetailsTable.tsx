import React from "react";

import { Demonstration as ServerDemonstration, Person, State } from "demos-server";
import { gql } from "graphql-tag";
import { tw } from "tags/tw";
import { safeDateFormat } from "util/formatDate";

import { useQuery } from "@apollo/client";

export type Demonstration = Pick<
  ServerDemonstration,
  | "id"
  | "name"
  | "description"
  | "sdgDivision"
  | "signatureLevel"
  | "effectiveDate"
  | "expirationDate"
  | "status"
> & {
  state: Pick<State, "id" | "name">;
  primaryProjectOfficer: Pick<Person, "id" | "fullName">;
};

export const DEMONSTRATION_SUMMARY_DETAILS_QUERY = gql`
  query GetDemonstrationSummaryDetails($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      sdgDivision
      signatureLevel
      effectiveDate
      expirationDate
      status
      state {
        id
        name
      }
      primaryProjectOfficer {
        id
        fullName
      }
    }
  }
`;

const FIELD_CONTAINER_CLASSES = tw`h-[62px] flex flex-col`;
const LABEL_CLASSES = tw`text-text-font font-bold text-sm tracking-wide h-[14px] flex items-center`;
const VALUE_CLASSES = tw`text-text-font text-base leading-relaxed h-[40px] flex items-start mt-1`;

export const SummaryDetailsTable: React.FC<{ demonstrationId: string }> = ({ demonstrationId }) => {
  const { data, loading, error } = useQuery<{ demonstration: Demonstration }>(
    DEMONSTRATION_SUMMARY_DETAILS_QUERY,
    {
      variables: { id: demonstrationId },
    }
  );

  if (loading) {
    return <div>Loading...</div>;
  }
  const demonstration = data?.demonstration;
  if (error || !demonstration) {
    return <div>Error loading demonstration details.</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-y-2 gap-x-8">
      <div className={`col-span-2 ${FIELD_CONTAINER_CLASSES}`}>
        <div className={LABEL_CLASSES}>State/Territory</div>
        <div className={VALUE_CLASSES}>{demonstration.state.name}</div>
      </div>

      <div className={`col-span-2 ${FIELD_CONTAINER_CLASSES}`}>
        <div className={LABEL_CLASSES}>Demonstration (Max Limit - 128 Characters)</div>
        <div className={VALUE_CLASSES}>{demonstration.name}</div>
      </div>

      <div className={FIELD_CONTAINER_CLASSES}>
        <div className={LABEL_CLASSES}>Project Officer</div>
        <div className={VALUE_CLASSES}>{demonstration.primaryProjectOfficer.fullName}</div>
      </div>

      <div className={FIELD_CONTAINER_CLASSES}>
        <div className={LABEL_CLASSES}>Status</div>
        <div className={VALUE_CLASSES}>{demonstration.status}</div>
      </div>

      <div className={FIELD_CONTAINER_CLASSES}>
        <div className={LABEL_CLASSES}>Effective Date</div>
        <div className={VALUE_CLASSES}>{safeDateFormat(demonstration.effectiveDate)}</div>
      </div>

      <div className={FIELD_CONTAINER_CLASSES}>
        <div className={LABEL_CLASSES}>Expiration Date</div>
        <div className={VALUE_CLASSES}>{safeDateFormat(demonstration.expirationDate)}</div>
      </div>

      <div className={`col-span-4 ${FIELD_CONTAINER_CLASSES}`}>
        <div className={LABEL_CLASSES}>Demonstration Description (Max Limit - 2048 Characters)</div>
        <div className={VALUE_CLASSES}>{demonstration.description}</div>
      </div>

      <div className={`col-span-2 ${FIELD_CONTAINER_CLASSES}`}>
        <div className={LABEL_CLASSES}>SDG Division</div>
        <div className={VALUE_CLASSES}>
          {demonstration.sdgDivision ? demonstration.sdgDivision : "--"}
        </div>
      </div>

      <div className={`col-span-2 ${FIELD_CONTAINER_CLASSES}`}>
        <div className={LABEL_CLASSES}>Signature Level</div>
        <div className={VALUE_CLASSES}>
          {demonstration.signatureLevel ? demonstration.signatureLevel : "--"}
        </div>
      </div>
    </div>
  );
};
