import React, { useState } from "react";

import Switch from "react-switch";
import { CompletableSection } from "layout/completableSection";
import { SecondaryButton } from "components/button";
import { TypesTable } from "components/table/tables/TypesTable";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { AddNewIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import { Demonstration as ServerDemonstration } from "demos-server";

type Demonstration = Pick<ServerDemonstration, "id" | "status"> & {
  demonstrationTypes: DemonstrationDetailDemonstrationType[];
};

type DemonstrationTypesSectionProps = {
  demonstration: Demonstration;
  onMarkComplete: (complete: boolean) => void;
  completionDate?: string;
  isComplete?: boolean;
  isReadonly?: boolean;
};

const toggleOnColor = "#6B7280";
const toggleOffColor = "#E5E7EB";

export const DemonstrationTypesSection = ({
  demonstration,
  onMarkComplete,
  completionDate,
  isComplete = false,
  isReadonly = false,
}: DemonstrationTypesSectionProps) => {
  const [types] = useState<DemonstrationDetailDemonstrationType[]>(
    demonstration.demonstrationTypes
  );
  const { showApplyDemonstrationTypesDialog } = useDialog();
  const applyTypes = () => {
    showApplyDemonstrationTypesDialog(demonstration.id);
  };

  return (
    <CompletableSection title="Types" isComplete={isComplete} completionDate={completionDate}>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-text-placeholder mt-1 mb-2">
          Add or Update Demonstration Types with Effective and Expiration Dates below
        </p>
        <SecondaryButton
          size="small"
          name="apply-types"
          onClick={applyTypes}
          disabled={isComplete || isReadonly}
        >
          Apply Type(s)
          <AddNewIcon />
        </SecondaryButton>
      </div>

      <TypesTable
        demonstration={demonstration}
        inputDisabled={isComplete || isReadonly}
        hideSearch={true}
      />

      <div className="border-t-1 border-gray-dark mt-2">
        <div className="flex justify-end mt-2 gap-2">
          <span className="text-sm font-semibold text-text-font">
            <span className="text-red-600">*</span>  Mark Complete
          </span>
          <Switch
            data-testid="mark-complete-switch"
            checked={isComplete}
            onChange={(checked) => onMarkComplete(checked)}
            onColor={toggleOnColor}
            offColor={toggleOffColor}
            checkedIcon={false}
            uncheckedIcon={false}
            height={18}
            width={40}
            handleDiameter={24}
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.6)"
            activeBoxShadow="0 0 2px 3px #3bf"
            disabled={types.length === 0 || isReadonly}
          />
        </div>
      </div>
    </CompletableSection>
  );
};
