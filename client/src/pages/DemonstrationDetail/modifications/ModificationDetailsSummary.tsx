import React from "react";
import { ModificationItem } from "./ModificationTabs";
import { formatDate } from "util/formatDate";

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
    ? formatDate(modificationItem.effectiveDate)
    : "--/--/----";

  const labelPrefix = modificationItem.modificationType === "amendment" ? "Amendment" : "Extension";

  return (
    <div className="flex flex-col p-1">
      <div className="flex justify-between w-full">
        <Field label={`${labelPrefix} Title`} value={modificationItem.name} />
        <Field label="Effective Date" value={effectiveDateValue} />
        <Field label="Status" value={modificationItem.status ?? ""} />
      </div>
      {modificationItem.description && (
        <div className="w-full">
          <Field label={`${labelPrefix} Description`} value={modificationItem.description} />
        </div>
      )}
      {modificationItem.signatureLevel && (
        <div className="w-full">
          <Field label="Signature Level" value={modificationItem.signatureLevel} />
        </div>
      )}
    </div>
  );
};

export const ModificationDetailsSummary = ({
  modificationItem,
}: {
  modificationItem: ModificationItem;
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold text-brand pb-1 border-b border-border-rules">
        SUMMARY DETAILS
      </h2>
      <ModificationDetailsFields modificationItem={modificationItem} />
    </div>
  );
};
