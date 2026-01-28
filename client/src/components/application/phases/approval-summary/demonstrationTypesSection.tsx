import React, { useState } from "react";

import Switch from "react-switch";
import { CompletableSection } from "layout/completableSection";
import { SecondaryButton } from "components/button";
import { TypesTable } from "components/table/tables/TypesTable";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { AddNewIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";

type DemonstrationTypesSectionProps = {
  demonstrationId: string;
  initialTypes: DemonstrationDetailDemonstrationType[];
  onMarkComplete: (complete: boolean) => void;
  isComplete?: boolean;
};

export const DemonstrationTypesSection = ({
  demonstrationId,
  initialTypes,
  onMarkComplete,
  isComplete = false,
}: DemonstrationTypesSectionProps) => {
  const [types] = useState<DemonstrationDetailDemonstrationType[]>(initialTypes);
  const { showApplyDemonstrationTypesDialog } = useDialog();
  const applyTypes = () => {
    showApplyDemonstrationTypesDialog(demonstrationId);
  };

  return (
    <CompletableSection title="Types" isComplete={isComplete}>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-text-placeholder mt-1 mb-2">
          Add or Update Demonstration Types with Effective and Expiration Dates below
        </p>
        <SecondaryButton size="small" name="apply-types" onClick={applyTypes} disabled={isComplete}>
          Apply Type(s)
          <AddNewIcon />
        </SecondaryButton>
      </div>

      <TypesTable
        demonstrationId={demonstrationId}
        types={types}
        inputDisabled={isComplete}
        hideSearch={true}
      />

      <div className="border-t-1 border-gray-dark mt-2">
        <div className="flex justify-end mt-2 gap-2">
          <span className="text-sm font-semibold text-text-font">Mark Complete</span>
          <Switch
            data-testid="mark-complete-switch"
            checked={isComplete}
            onChange={(checked) => onMarkComplete(checked)}
            onColor="#10B981"
            offColor="#E5E7EB"
            checkedIcon={false}
            uncheckedIcon={false}
            height={18}
            width={40}
            handleDiameter={24}
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.6)"
            activeBoxShadow="0 0 2px 3px #3bf"
            disabled={types.length === 0}
          />
        </div>
      </div>
    </CompletableSection>
  );
};
