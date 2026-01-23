import React, { useState } from "react";
import { CompletableSection } from "layout/completableSection";
import { Button } from "components/button";
import { TypesTable } from "components/table/tables/TypesTable";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";


type DemonstrationTypesSectionProps = {
  initialTypes?: DemonstrationDetailDemonstrationType[];
};

export const DemonstrationTypesSection = ({ initialTypes = [] }: DemonstrationTypesSectionProps) => {
  const [types, setTypes] = useState<DemonstrationDetailDemonstrationType[]>(initialTypes);
  const [isComplete, setIsComplete] = useState(false);

  const hasRequiredFields = types.length > 0 && types.every((t) => t.demonstrationType && t.effectiveDate && t.expirationDate);

  const markComplete = () => setIsComplete(true);
  const markIncomplete = () => setIsComplete(false);

  const applyTypes = () => {
    console.log("Apply Types clicked");
  };

  return (
    <CompletableSection title="Demonstration Types" isComplete={isComplete}>
      <p className="text-sm text-text-placeholder mb-2">
        Add or Update Demonstration Types with Effective and Expiration Dates below
      </p>

      <div className="flex justify-between items-center mb-2">
        <Button
          size="small"
          name="apply-types"
          onClick={applyTypes}
          disabled={isComplete}
        >
          Apply Type(s)
        </Button>

        {isComplete ? (
          <Button
            size="small"
            name="mark-incomplete"
            onClick={markIncomplete}
          >
            Mark Incomplete
          </Button>
        ) : (
          <Button
            size="small"
            name="mark-complete"
            disabled={!hasRequiredFields}
            onClick={markComplete}
          >
            Mark Complete
          </Button>
        )}
      </div>

      <TypesTable types={types} />
    </CompletableSection>
  );
};
