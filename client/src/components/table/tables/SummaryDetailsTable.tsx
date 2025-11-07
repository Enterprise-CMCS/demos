import React from "react";

import { Demonstration as ServerDemonstration, Person, State } from "demos-server";
import { gql } from "graphql-tag";
import { tw } from "tags/tw";
import { formatDate } from "utils/formatDate";

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

const LABEL_CLASSES = tw`text-text-font font-bold text-xs tracking-wide`;
const VALUE_CLASSES = tw`text-text-font text-sm leading-relaxed`;

const prepareDisplayData = (demonstration: Demonstration) => ({
  ...demonstration,
  name: demonstration.name || "-",
  description: demonstration.description || "-",
  status: demonstration.status || "-",
  sdgDivision: demonstration.sdgDivision || "-",
  signatureLevel: demonstration.signatureLevel || "-",
  primaryProjectOfficerName: demonstration.primaryProjectOfficer?.fullName || "-",
});

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

  const displayData = prepareDisplayData(demonstration);

  return (
    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
      <div>
        <div className={LABEL_CLASSES}>State/Territory</div>
        <div className={VALUE_CLASSES}>{demonstration.state.name}</div>
      </div>

      <div>
        <div className={LABEL_CLASSES}>Demonstration (Max Limit - 128 Characters)</div>
        <div className={VALUE_CLASSES}>{displayData.name}</div>
      </div>

      <div>
        <div className={LABEL_CLASSES}>Project Officer</div>
        <div className={VALUE_CLASSES}>{displayData.primaryProjectOfficerName}</div>
      </div>

      <div>
        <div className={LABEL_CLASSES}>Status</div>
        <div className={VALUE_CLASSES}>{displayData.status}</div>
      </div>

      <div>
        <div className={LABEL_CLASSES}>Effective Date</div>
        <div className={VALUE_CLASSES}>
          {demonstration.effectiveDate ? formatDate(demonstration.effectiveDate) : "-"}
        </div>
      </div>

      <div>
        <div className={LABEL_CLASSES}>Expiration Date</div>
        <div className={VALUE_CLASSES}>
          {demonstration.expirationDate ? formatDate(demonstration.expirationDate) : "-"}
        </div>
      </div>

      <div className="col-span-2">
        <div className={LABEL_CLASSES}>Demonstration Description (Max Limit - 2048 Characters)</div>
        <div className={VALUE_CLASSES}>{displayData.description}</div>
      </div>

      <div>
        <div className={LABEL_CLASSES}>SDG Division</div>
        <div className={VALUE_CLASSES}>{displayData.sdgDivision}</div>
      </div>

      <div>
        <div className={LABEL_CLASSES}>Signature Level</div>
        <div className={VALUE_CLASSES}>{displayData.signatureLevel}</div>
      </div>
    </div>
  );
};
