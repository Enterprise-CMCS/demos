import React from "react";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { useToast } from "components/toast";
import { Button } from "components/button";
import {
  DemonstrationTypeAssignment,
  SetDemonstrationTypesInput,
  Demonstration as ServerDemonstration,
  LocalDate,
} from "demos-server";
import { gql, TypedDocumentNode, useMutation } from "@apollo/client";
import { DatePicker } from "components/input/date/DatePicker";
import { formatDateForServer, getTodayEst } from "util/formatDate";

type Demonstration = Pick<ServerDemonstration, "id"> & {
  demonstrationTypes: DemonstrationType[];
};

export type DemonstrationType = Pick<
  DemonstrationTypeAssignment,
  "demonstrationTypeName" | "status" | "effectiveDate" | "expirationDate"
>;

type DemonstrationTypeFormData = Pick<
  DemonstrationTypeAssignment,
  "demonstrationTypeName" | "status"
> & {
  effectiveDate: LocalDate;
  expirationDate: LocalDate;
};

export const EDIT_DEMONSTRATION_TYPES_DIALOG_MUTATION: TypedDocumentNode<
  {
    setDemonstrationTypes: Pick<Demonstration, "id"> & {
      demonstrationTypes: Pick<DemonstrationTypeAssignment, "demonstrationTypeName">[];
    };
  },
  { input: SetDemonstrationTypesInput }
> = gql`
  mutation removeDemonstrationTypes($input: SetDemonstrationTypesInput!) {
    setDemonstrationTypes(input: $input) {
      id
      demonstrationTypes {
        demonstrationTypeName
      }
    }
  }
`;

const hasChanges = (
  initialDemonstrationType: DemonstrationTypeFormData,
  currentDemonstrationType: DemonstrationTypeFormData
) => {
  return (
    initialDemonstrationType.effectiveDate !== currentDemonstrationType.effectiveDate ||
    initialDemonstrationType.expirationDate !== currentDemonstrationType.expirationDate
  );
};

const getDemonstrationTypeStatus = (effectiveDate: LocalDate, expirationDate: LocalDate) => {
  // coerce all dates to be LocalDates, then build Date objects for comparison
  const today = new Date(getTodayEst());
  const effective = new Date(effectiveDate);
  const expiration = new Date(expirationDate);

  if (today < effective) {
    return "Pending";
  }
  if (today > expiration) {
    return "Expired";
  }
  return "Active";
};

const isValid = (effectiveDate: LocalDate, expirationDate: LocalDate) => {
  return effectiveDate && expirationDate && new Date(effectiveDate) <= new Date(expirationDate);
};

export const EditDemonstrationTypeDialog = ({
  demonstrationId,
  initialDemonstrationType,
}: {
  demonstrationId: string;
  initialDemonstrationType: DemonstrationType;
}) => {
  const { closeDialog } = useDialog();
  const { showSuccess, showError } = useToast();
  const [editDemonstrationType, { loading: saving }] = useMutation(
    EDIT_DEMONSTRATION_TYPES_DIALOG_MUTATION
  );
  const initialDemonstrationTypeFormData = React.useMemo(
    () => ({
      ...initialDemonstrationType,
      effectiveDate: formatDateForServer(initialDemonstrationType.effectiveDate),
      expirationDate: formatDateForServer(initialDemonstrationType.expirationDate),
    }),
    [initialDemonstrationType]
  );
  const [demonstrationTypeFormData, setDemonstrationTypeFormData] =
    React.useState<DemonstrationTypeFormData>(initialDemonstrationTypeFormData);

  const handleSubmit = async () => {
    const editDemonstrationTypeInput = {
      demonstrationId,
      demonstrationTypes: [
        {
          demonstrationTypeName: demonstrationTypeFormData.demonstrationTypeName,
          demonstrationTypeDates: {
            effectiveDate: demonstrationTypeFormData.effectiveDate,
            expirationDate: demonstrationTypeFormData.expirationDate,
          },
        },
      ],
    };
    try {
      await editDemonstrationType({
        variables: { input: editDemonstrationTypeInput },
      });
      showSuccess("Demonstration type edited successfully.");
    } catch (error) {
      console.error("Error editing demonstration type:", error);
      showError("Failed to edit demonstration type.");
    }
    closeDialog();
  };

  const handleOnChange = (demonstrationType: DemonstrationTypeFormData) => {
    if (isValid(demonstrationType.effectiveDate, demonstrationType.expirationDate)) {
      demonstrationType.status = getDemonstrationTypeStatus(
        demonstrationType.effectiveDate,
        demonstrationType.expirationDate
      );
    }
    setDemonstrationTypeFormData(demonstrationType);
  };

  return (
    <BaseDialog
      title="Edit Type"
      onClose={closeDialog}
      dialogHasChanges={false}
      actionButton={
        <Button
          name={"button-submit-edit-demonstration-type-dialog"}
          disabled={
            saving ||
            !isValid ||
            !hasChanges(initialDemonstrationTypeFormData, demonstrationTypeFormData)
          }
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-text-font font-semibold text-field-label">Type</p>
          <p className="text-text-filled">{demonstrationTypeFormData.demonstrationTypeName}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-text-font font-semibold text-field-label">Status</p>
          <p className="text-text-filled">{demonstrationTypeFormData.status}</p>
        </div>
        <DatePicker
          isRequired
          value={demonstrationTypeFormData.effectiveDate}
          onChange={(date) =>
            handleOnChange({ ...demonstrationTypeFormData, effectiveDate: date as LocalDate })
          }
          name="input-effective-date"
          label="Effective Date"
        />
        <DatePicker
          isRequired
          onChange={(date) =>
            handleOnChange({ ...demonstrationTypeFormData, expirationDate: date as LocalDate })
          }
          value={demonstrationTypeFormData.expirationDate}
          name="input-expiration-date"
          label="Expiration Date"
          getValidationMessage={() =>
            isValid(
              demonstrationTypeFormData.effectiveDate,
              demonstrationTypeFormData.expirationDate
            )
              ? ""
              : "Effective date must be on or before expiration date."
          }
        />
      </div>
    </BaseDialog>
  );
};
