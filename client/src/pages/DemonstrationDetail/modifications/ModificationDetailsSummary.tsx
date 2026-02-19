import React from "react";
import { ModificationItem } from "./ModificationTabs";

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
  return (
    <div className="flex flex-col p-1">
      <div className="flex justify-between w-full">
        <Field label="Name" value={modificationItem.name} />
        <Field label="Effective Date" value="TODO" />
        <Field label="Status" value={modificationItem.status ?? ""} />
      </div>
      {modificationItem.description && (
        <div className="w-full">
          <Field label="Description" value={modificationItem.description} />
        </div>
      )}
      <div className="w-full">
        <Field label="Signature Level" value="TODO" />
      </div>
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
