import React from "react";

import { Demonstration, DemonstrationStatus, State, User } from "demos-server";
import { tw } from "tags/tw";
import { formatDate } from "util/formatDate";

type SummaryDetailsDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "effectiveDate" | "expirationDate"
> & {
  state: Pick<State, "name" | "id">;
  projectOfficer: Pick<User, "id" | "fullName">;
  demonstrationStatus: Pick<DemonstrationStatus, "name">;
};

type SummaryDetailsTableProps = {
  demonstration: SummaryDetailsDemonstration;
};

const LABEL_CLASSES = tw`text-text-font font-bold text-xs uppercase tracking-wide`;
const VALUE_CLASSES = tw`text-text-font text-sm leading-relaxed`;

export const SummaryDetailsTable: React.FC<SummaryDetailsTableProps> = ({ demonstration }) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-y-4 gap-x-8">
        <div>
          <div className={LABEL_CLASSES}>State/Territory</div>
          <div className={VALUE_CLASSES}>{demonstration.state.name}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Demonstration (Max Limit - 128 Characters)</div>
          <div className={VALUE_CLASSES}>{demonstration.name}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Project Officer</div>
          <div className={VALUE_CLASSES}>{demonstration.projectOfficer.fullName}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Status</div>
          <div className={VALUE_CLASSES}>{demonstration.demonstrationStatus.name}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Effective Date</div>
          <div className={VALUE_CLASSES}>{formatDate(demonstration.effectiveDate)}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Expiration Date</div>
          <div className={VALUE_CLASSES}>{formatDate(demonstration.expirationDate)}</div>
        </div>

        <div className="col-span-2">
          <div className={LABEL_CLASSES}>
            Demonstration Description (Max Limit - 2048 Characters)
          </div>
          <div className={VALUE_CLASSES}>{demonstration.description}</div>
        </div>
      </div>
    </>
  );
};
