import React from "react";
import { ModificationItem } from "./ModificationTabs";
import { formatDateForDisplay, getDateEst } from "util/formatDate";
import { IconButton } from "components/button";
import { EditIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { getCurrentUser, isReadonly } from "components/user/UserContext";

const Field = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex flex-col">
      <p className="font-bold">{label}</p>
      <p>{value}</p>
    </div>
  );
};

const ModificationDetailsFields = ({
  modificationItem,
}: {
  modificationItem: ModificationItem;
}) => {
  const effectiveDateValue = modificationItem.effectiveDate
    ? formatDateForDisplay(getDateEst(modificationItem.effectiveDate))
    : "--/--/----";

  const labelPrefix = modificationItem.modificationType === "amendment" ? "Amendment" : "Renewal";

  return (
    <div className="flex flex-col p-1 gap-2">
      <div className="flex justify-between w-full">
        <Field label={`${labelPrefix} Title`} value={modificationItem.name} />
        <Field label="Effective Date" value={effectiveDateValue} />
        <Field label="Status" value={modificationItem.status ?? "-"} />
      </div>
      <div className="w-full">
        <Field label="Demonstration ID" value={modificationItem.medicaidId || "-"} />
      </div>
      <div className="w-full">
        <Field label={`${labelPrefix} Description`} value={modificationItem.description || "-"} />
      </div>
      <div className="w-full">
        <Field label="Signature Level" value={modificationItem.signatureLevel || "-"} />
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
  const isReadonlyUser = isReadonly(currentUser);

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
