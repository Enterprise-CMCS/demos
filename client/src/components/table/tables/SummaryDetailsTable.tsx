import React from "react";

import { Demonstration as ServerDemonstration, Person, State } from "demos-server";
import { gql } from "graphql-tag";
import { tw } from "tags/tw";
import { formatDateForDisplay } from "util/formatDate";

import { useQuery } from "@apollo/client";

export type Demonstration = Pick<
  ServerDemonstration,
  | "id"
  | "name"
  | "description"
  | "sdgDivision"
  | "signatureLevel"
  | "effectivePlainDate"
  | "expirationPlainDate"
  | "status"
  | "medicaidId"
  | "chipId"
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
      effectivePlainDate
      expirationPlainDate
      status
      medicaidId
      chipId
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

const FIELD_CONTAINER_CLASSES = tw`min-h-[62px] flex flex-col`;
const LABEL_CLASSES = tw`text-text-font font-bold text-sm tracking-wide h-[14px] flex items-center`;
const VALUE_CLASSES = tw`text-text-font text-base leading-relaxed min-h-[40px] flex items-start mt-1`;

export const FIELD_IDS = {
  state: "summary-field-state",
  title: "summary-field-title",
  medicaidId: "summary-field-medicaid-id",
  chipId: "summary-field-chip-id",
  projectOfficer: "summary-field-project-officer",
  status: "summary-field-status",
  effectiveDate: "summary-field-effective-date",
  expirationDate: "summary-field-expiration-date",
  description: "summary-field-description",
  sdgDivision: "summary-field-sdg-division",
  signatureLevel: "summary-field-signature-level",
} as const;

const prepareDisplayData = (demonstration: Demonstration) => ({
  ...demonstration,
  name: demonstration.name || "-",
  description: demonstration.description || "-",
  status: demonstration.status || "-",
  sdgDivision: demonstration.sdgDivision || "-",
  signatureLevel: demonstration.signatureLevel || "-",
  primaryProjectOfficerName: demonstration.primaryProjectOfficer?.fullName || "-",
  chipId: demonstration.chipId || "-",
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
    <div className="grid grid-cols-4 gap-y-2 gap-x-8">
      <div
        className={`col-span-2 ${FIELD_CONTAINER_CLASSES}`}
        role="group"
        aria-labelledby={FIELD_IDS.state}
      >
        <div id={FIELD_IDS.state} className={LABEL_CLASSES}>
          State/Territory
        </div>
        <div className={VALUE_CLASSES}>{demonstration.state.name}</div>
      </div>

      <div
        className={`col-span-2 ${FIELD_CONTAINER_CLASSES}`}
        role="group"
        aria-labelledby={FIELD_IDS.title}
      >
        <div id={FIELD_IDS.title} className={LABEL_CLASSES}>
          Demonstration Title
        </div>
        <div className={VALUE_CLASSES}>{displayData.name}</div>
      </div>

      <div className={FIELD_CONTAINER_CLASSES} role="group" aria-labelledby={FIELD_IDS.medicaidId}>
        <div id={FIELD_IDS.medicaidId} className={LABEL_CLASSES}>
          Demonstration ID
        </div>
        <div className={VALUE_CLASSES}>{demonstration.medicaidId}</div>
      </div>

      <div className={FIELD_CONTAINER_CLASSES} role="group" aria-labelledby={FIELD_IDS.chipId}>
        <div id={FIELD_IDS.chipId} className={LABEL_CLASSES}>
          CHIP ID
        </div>
        <div className={VALUE_CLASSES}>{displayData.chipId}</div>
      </div>

      <div
        className={FIELD_CONTAINER_CLASSES}
        role="group"
        aria-labelledby={FIELD_IDS.projectOfficer}
      >
        <div id={FIELD_IDS.projectOfficer} className={LABEL_CLASSES}>
          Project Officer
        </div>
        <div className={VALUE_CLASSES}>{displayData.primaryProjectOfficerName}</div>
      </div>

      <div className={FIELD_CONTAINER_CLASSES} role="group" aria-labelledby={FIELD_IDS.status}>
        <div id={FIELD_IDS.status} className={LABEL_CLASSES}>
          Status
        </div>
        <div className={VALUE_CLASSES}>{displayData.status}</div>
      </div>

      <div
        className={FIELD_CONTAINER_CLASSES}
        role="group"
        aria-labelledby={FIELD_IDS.effectiveDate}
      >
        <div id={FIELD_IDS.effectiveDate} className={LABEL_CLASSES}>
          Effective Date
        </div>
        <div className={VALUE_CLASSES}>
          {demonstration.effectivePlainDate
            ? formatDateForDisplay(demonstration.effectivePlainDate)
            : "-"}
        </div>
      </div>

      <div
        className={FIELD_CONTAINER_CLASSES}
        role="group"
        aria-labelledby={FIELD_IDS.expirationDate}
      >
        <div id={FIELD_IDS.expirationDate} className={LABEL_CLASSES}>
          Expiration Date
        </div>
        <div className={VALUE_CLASSES}>
          {demonstration.expirationPlainDate
            ? formatDateForDisplay(demonstration.expirationPlainDate)
            : "-"}
        </div>
      </div>

      <div
        className={`col-span-4 ${FIELD_CONTAINER_CLASSES}`}
        role="group"
        aria-labelledby={FIELD_IDS.description}
      >
        <div id={FIELD_IDS.description} className={LABEL_CLASSES}>
          Demonstration Description
        </div>
        <div className={VALUE_CLASSES}>{displayData.description}</div>
      </div>

      <div
        className={`col-span-2 ${FIELD_CONTAINER_CLASSES}`}
        role="group"
        aria-labelledby={FIELD_IDS.sdgDivision}
      >
        <div id={FIELD_IDS.sdgDivision} className={LABEL_CLASSES}>
          SDG Division
        </div>
        <div className={VALUE_CLASSES}>{displayData.sdgDivision}</div>
      </div>

      <div
        className={`col-span-2 ${FIELD_CONTAINER_CLASSES}`}
        role="group"
        aria-labelledby={FIELD_IDS.signatureLevel}
      >
        <div id={FIELD_IDS.signatureLevel} className={LABEL_CLASSES}>
          Signature Level
        </div>
        <div className={VALUE_CLASSES}>{displayData.signatureLevel}</div>
      </div>
    </div>
  );
};
