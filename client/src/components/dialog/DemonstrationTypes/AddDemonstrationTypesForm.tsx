import React from "react";
import { DatePicker } from "components/input/date/DatePicker";
import { SecondaryButton } from "components/button";
import { SelectDemonstrationTypeName } from "components/input/select/SelectDemonstrationTypeName";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { Tag as DemonstrationTypeName } from "demos-server";
import { DemonstrationType } from "./ApplyDemonstrationTypesDialog";

export const ADD_DEMONSTRATION_TYPES_FORM_QUERY: TypedDocumentNode<
  {
    demonstration: {
      demonstrationTypes: {
        demonstrationTypeName: DemonstrationTypeName;
      }[];
    };
  },
  { id: string }
> = gql`
  query AddDemonstrationTypesForm($id: ID!) {
    demonstration(id: $id) {
      demonstrationTypes {
        demonstrationTypeName
      }
    }
  }
`;

function isValid(demonstrationType: DemonstrationType): boolean {
  return !!(
    demonstrationType.demonstrationTypeName &&
    demonstrationType.effectiveDate &&
    demonstrationType.expirationDate &&
    new Date(demonstrationType.effectiveDate) <= new Date(demonstrationType.expirationDate)
  );
}

export const AddDemonstrationTypesForm = ({
  demonstrationId,
  demonstrationTypeNames,
  addDemonstrationType,
}: {
  demonstrationId: string;
  demonstrationTypeNames: DemonstrationTypeName[];
  addDemonstrationType: (demonstrationType: DemonstrationType) => void;
}) => {
  const { data, loading, error } = useQuery(ADD_DEMONSTRATION_TYPES_FORM_QUERY, {
    variables: { id: demonstrationId },
  });

  const [demonstrationTypeFormData, setDemonstrationTypeFormData] =
    React.useState<DemonstrationType>({
      demonstrationTypeName: "",
      effectiveDate: "",
      expirationDate: "",
    });

  if (loading) return <div>Loading demonstration...</div>;
  if (error || !data) return <div>Error loading demonstration.</div>;
  const existingDemonstrationTypeNames = data?.demonstration.demonstrationTypes.map(
    (dt) => dt.demonstrationTypeName
  );

  const handleAddDemonstrationType = () => {
    if (!isValid(demonstrationTypeFormData)) return;
    addDemonstrationType(demonstrationTypeFormData);
    setDemonstrationTypeFormData({
      ...demonstrationTypeFormData,
      demonstrationTypeName: "",
    });
  };

  const filterDemonstrationTypes = (demonstrationTypeName: string) => {
    return (
      !demonstrationTypeNames.includes(demonstrationTypeName) &&
      !existingDemonstrationTypeNames.includes(demonstrationTypeName)
    );
  };

  const validateDatePicker = (effectiveDate: string, expirationDate: string) => {
    if (
      !effectiveDate ||
      !expirationDate ||
      new Date(demonstrationTypeFormData.effectiveDate) <=
        new Date(demonstrationTypeFormData.expirationDate)
    ) {
      return "";
    }

    return "Effective date must be on or before expiration date.";
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
              getValidationMessage={() =>
                validateDatePicker(
                  demonstrationTypeFormData.effectiveDate,
                  demonstrationTypeFormData.expirationDate
                )
              }
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
