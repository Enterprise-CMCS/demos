import React from "react";
import { DatePicker } from "components/input/date/DatePicker";
import { SecondaryButton } from "components/button";
import { SelectDemonstrationTypeName } from "components/input/select/SelectDemonstrationTypeName";
import { DemonstrationType } from "./ApplyDemonstrationTypesDialog";

function isValid(demonstrationType: DemonstrationType): boolean {
  return !!(
    demonstrationType.demonstrationTypeName &&
    demonstrationType.effectiveDate &&
    demonstrationType.expirationDate
  );
}

export const AddDemonstrationTypesForm = ({
  demonstrationTypes,
  addDemonstrationType,
}: {
  demonstrationTypes: DemonstrationType[];
  addDemonstrationType: (demonstrationType: DemonstrationType) => void;
}) => {
  const [demonstrationTypeFormData, setDemonstrationTypeFormData] =
    React.useState<DemonstrationType>({
      demonstrationTypeName: "",
      effectiveDate: "",
      expirationDate: "",
    });

  const handleAddDemonstrationType = () => {
    if (!isValid(demonstrationTypeFormData)) return;
    addDemonstrationType(demonstrationTypeFormData);
    setDemonstrationTypeFormData({
      ...demonstrationTypeFormData,
      demonstrationTypeName: "",
    });
  };

  const filterDemonstrationTypes = (demonstrationTypeName: string) => {
    return !demonstrationTypes
      .map((demonstrationType) => demonstrationType.demonstrationTypeName)
      .includes(demonstrationTypeName);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <SelectDemonstrationTypeName
            filter={filterDemonstrationTypes}
            isRequired
            value={demonstrationTypeFormData.demonstrationTypeName}
            onSelect={(demonstrationTypeName) =>
              setDemonstrationTypeFormData(
                (demonstrationType): DemonstrationType => ({
                  ...demonstrationType,
                  demonstrationTypeName,
                })
              )
            }
          />
        </div>
        <div className="flex-1 flex gap-2">
          <div className="flex-1">
            <DatePicker
              isRequired
              value={demonstrationTypeFormData.effectiveDate}
              onChange={(date) =>
                setDemonstrationTypeFormData(
                  (demonstrationType): DemonstrationType => ({
                    ...demonstrationType,
                    effectiveDate: date,
                  })
                )
              }
              label="Effective Date"
              name="date-picker-effective-date"
            />
          </div>
          <div className="flex-1">
            <DatePicker
              isRequired
              value={demonstrationTypeFormData.expirationDate}
              onChange={(date) =>
                setDemonstrationTypeFormData(
                  (demonstrationType): DemonstrationType => ({
                    ...demonstrationType,
                    expirationDate: date,
                  })
                )
              }
              label="Expiration Date"
              name="date-picker-expiration-date"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <SecondaryButton
          disabled={!isValid(demonstrationTypeFormData)}
          name="button-add-demonstration-type"
          type="button"
          onClick={handleAddDemonstrationType}
        >
          + Add to List
        </SecondaryButton>
      </div>
    </div>
  );
};
