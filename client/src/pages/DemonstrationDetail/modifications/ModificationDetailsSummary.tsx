import React from "react";
import { ModificationItem } from "./ModificationTabs";
import { formatDateForDisplay } from "util/formatDate";
import { IconButton } from "components/button";
import { EditIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { getCurrentUser, isReadonly } from "components/user/UserContext";

// Single source of truth for each field's label id, shared between the label's id and its group's aria-labelledby.
export const FIELD_IDS = {
  title: "modification-field-title",
  effectiveDate: "modification-field-effective-date",
  status: "modification-field-status",
  medicaidId: "modification-field-medicaid-id",
  description: "modification-field-description",
  signatureLevel: "modification-field-signature-level",
} as const;

const Field = ({ label, value, id }: { label: string; value: string; id: string }) => {
  return (
    <div className="flex flex-col" role="group" aria-labelledby={id}>
      <p id={id} className="font-bold">
        {label}
      </p>
      <p>{value}</p>
    </div>
  );
};

const ModificationDetailsFields = ({
  modificationItem,
}: {
  modificationItem: ModificationItem;
}) => {
  const effectiveDateValue = modificationItem.effectivePlainDate
    ? formatDateForDisplay(modificationItem.effectivePlainDate)
    : "--/--/----";

  const labelPrefix = modificationItem.modificationType === "amendment" ? "Amendment" : "Renewal";

  return (
    <div className="flex flex-col p-1 gap-2">
      <div className="flex justify-between w-full">
        <Field label={`${labelPrefix} Title`} value={modificationItem.name} id={FIELD_IDS.title} />
        <Field label="Effective Date" value={effectiveDateValue} id={FIELD_IDS.effectiveDate} />
        <Field label="Status" value={modificationItem.status ?? "-"} id={FIELD_IDS.status} />
      </div>
      <div className="w-full">
        <Field
          label="Demonstration ID"
          value={modificationItem.medicaidId || "-"}
          id={FIELD_IDS.medicaidId}
        />
      </div>
      <div className="w-full">
        <Field
          label={`${labelPrefix} Description`}
          value={modificationItem.description || "-"}
          id={FIELD_IDS.description}
        />
      </div>
      <div className="w-full">
        <Field
          label="Signature Level"
          value={modificationItem.signatureLevel || "-"}
          id={FIELD_IDS.signatureLevel}
        />
      </div>
    </div>
  );
};

export const ModificationDetailsSummary = ({
  modificationItem,
}: {
  modificationItem: ModificationItem;
}) => {
  const { currentUser } = getCurrentUser();
  const isReadonlyUser = isReadonly(currentUser, "DemonstrationDetail");

  const { showUpdateAmendmentDialog, showUpdateRenewalDialog } = useDialog();

  const handleEditClick = () => {
    if (modificationItem.modificationType === "amendment") {
      showUpdateAmendmentDialog(modificationItem.id, [DEMONSTRATION_DETAIL_QUERY]);
    } else if (modificationItem.modificationType === "renewal") {
      showUpdateRenewalDialog(modificationItem.id, [DEMONSTRATION_DETAIL_QUERY]);
    } else {
      console.error("Unknown modification type");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center pb-1 border-b border-border-rules">
        <h2 className="text-xl font-bold text-brand">SUMMARY DETAILS</h2>
        {!isReadonlyUser && (
          <IconButton
            icon={<EditIcon />}
            name="button-edit-details"
            size="small"
            onClick={handleEditClick}
          >
            Edit Details
          </IconButton>
        )}
      </div>
      <ModificationDetailsFields modificationItem={modificationItem} />
    </div>
  );
};
