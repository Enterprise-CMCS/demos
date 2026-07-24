import React from "react";
import { useQuery } from "@apollo/client";
import {
  GET_AMENDMENT_WORKFLOW_QUERY,
  GET_EXTENSION_WORKFLOW_QUERY,
  type ApplicationWorkflowAmendment,
  type ApplicationWorkflowExtension,
} from "components/application";
import { Loading } from "components/loading/Loading";
import { ModificationTabSideNav } from "./ModificationTabSideNav";

type SelectedModificationProps = {
  id: string;
  medicaidId: string;
  modificationType: "amendment" | "extension";
};

const SelectedAmendment = ({
  id,
  medicaidId,
}: Omit<SelectedModificationProps, "modificationType">) => {
  const { data, loading, error } = useQuery<{ amendment: ApplicationWorkflowAmendment }>(
    GET_AMENDMENT_WORKFLOW_QUERY,
    { variables: { id } }
  );

  if (loading) return <Loading />;
  if (error || !data?.amendment) {
    return <p>Error Loading Amendment Workflow: {error?.message ?? "No amendment returned."}</p>;
  }

  return (
    <ModificationTabSideNav
      modificationItem={{
        ...data.amendment,
        modificationType: "amendment",
        medicaidId,
      }}
    />
  );
};

const SelectedExtension = ({
  id,
  medicaidId,
}: Omit<SelectedModificationProps, "modificationType">) => {
  const { data, loading, error } = useQuery<{ extension: ApplicationWorkflowExtension }>(
    GET_EXTENSION_WORKFLOW_QUERY,
    { variables: { id } }
  );

  if (loading) return <Loading />;
  if (error || !data?.extension) {
    return <p>Error Loading Extension Workflow: {error?.message ?? "No extension returned."}</p>;
  }

  return (
    <ModificationTabSideNav
      modificationItem={{
        ...data.extension,
        modificationType: "extension",
        medicaidId,
      }}
    />
  );
};

export const SelectedModification = ({
  id,
  medicaidId,
  modificationType,
}: SelectedModificationProps) =>
  modificationType === "amendment" ? (
    <SelectedAmendment id={id} medicaidId={medicaidId} />
  ) : (
    <SelectedExtension id={id} medicaidId={medicaidId} />
  );
