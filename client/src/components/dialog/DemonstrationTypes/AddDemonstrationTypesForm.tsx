import React from "react";
import { DemonstrationType } from "./ApplyDemonstrationTypesDialog";
import { DatePicker } from "components/input/date/DatePicker";
import { SecondaryButton } from "components/button";
import { SelectDemonstrationTypeTag } from "components/input/select/SelectTag/SelectDemonstrationTypeTag";
import { Tag } from "mock-data/TagMocks";

const isValid = (formData: DemonstrationType) => {
  return formData.tag && formData.effectiveDate && formData.expirationDate;
};

export const AddDemonstrationTypesForm = ({
  selectedTags,
  addDemonstrationType,
}: {
  selectedTags: Tag[];
  addDemonstrationType: (demonstrationType: DemonstrationType) => void;
}) => {
  const [addDemonstrationTypesFormData, setAddDemonstrationTypesFormData] =
    React.useState<DemonstrationType>({
      tag: "",
      effectiveDate: "",
      expirationDate: "",
    });

  const handleAddType = () => {
    addDemonstrationType(addDemonstrationTypesFormData);
    setAddDemonstrationTypesFormData(
      (demonstrationType): DemonstrationType => ({
        ...demonstrationType,
        tag: "",
      })
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <SelectDemonstrationTypeTag
            filter={(tag) => !selectedTags.includes(tag)}
            isRequired
            value={addDemonstrationTypesFormData.tag}
            onSelect={(tag) =>
              setAddDemonstrationTypesFormData(
                (demonstrationType): DemonstrationType => ({ ...demonstrationType, tag })
              )
            }
          />
        </div>
        <div className="flex-1 flex gap-2">
          <div className="flex-1">
            <DatePicker
              isRequired
              value={addDemonstrationTypesFormData.effectiveDate}
              onChange={(date) =>
                setAddDemonstrationTypesFormData(
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
              value={addDemonstrationTypesFormData.expirationDate}
              onChange={(date) =>
                setAddDemonstrationTypesFormData(
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
          disabled={!isValid(addDemonstrationTypesFormData)}
          name="button-add-demonstration-type"
          type="button"
          onClick={handleAddType}
        >
          + Add to List
        </SecondaryButton>
      </div>
    </div>
  );
};
