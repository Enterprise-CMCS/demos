import React, { useEffect, useMemo, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TextInput } from "components/input/TextInput";
import { useToast } from "components/toast";
import { formatDate } from "util/formatDate";

import { gql, useMutation, useQuery } from "@apollo/client";

import { CreateExtensionInput, UpdateExtensionInput } from "demos-server";
import { createFormDataWithDates } from "hooks/useDialogForm";

import { BaseModificationDialog, BaseModificationDialogProps } from "./BaseModificationDialog";

export const EXTENSION_DIALOG_QUERY = gql`
  query ExtensionDialog($id: ID!) {
    extension(id: $id) {
      id
      name
      description
      effectiveDate
      expirationDate
      status
      currentPhaseName
      demonstration {
        id
        name
      }
    }
  }
`;

export const CREATE_EXTENSION_MUTATION = gql`
  mutation CreateExtension($input: CreateExtensionInput!) {
    createExtension(input: $input) {
      id
    }
  }
`;

const UPDATE_EXTENSION_MUTATION = gql`
  mutation UpdateExtension($id: ID!, $input: UpdateExtensionInput!) {
    updateExtension(id: $id, input: $input) {
      id
    }
  }
`;

interface ExtensionQueryData {
  extension: {
    id: string;
    name: string;
    description: string | null;
    effectiveDate: string | null;
    expirationDate: string | null;
    status: string;
    currentPhaseName: string | null;
    demonstration: {
      id: string;
      name: string | null;
      __typename?: string;
    } | null;
  } | null;
}

type Props = Pick<BaseModificationDialogProps, "isOpen" | "onClose" | "mode" | "demonstrationId" | "data"> & {
  extensionId?: string | null;
  mode?: "add" | "view" | "edit";
};

const FORM_ID = "extension-dialog-form";

export const ExtensionDialog: React.FC<Props> = ({
  isOpen = true,
  onClose,
  mode = "view",
  extensionId,
  demonstrationId,
  data,
}) => {
  const { showSuccess, showError } = useToast();
  const [createExtensionMutation] = useMutation(CREATE_EXTENSION_MUTATION);
  const [updateExtensionMutation, { loading: isSaving }] = useMutation(UPDATE_EXTENSION_MUTATION);

  if (mode === "add") {
    const handleExtensionSubmit = async (extensionData: Record<string, unknown>) => {
      const { demonstrationId, name, description } = extensionData as {
        demonstrationId?: string;
        name?: string;
        description?: unknown;
      };

      if (!demonstrationId || !name) {
        throw new Error("Demonstration ID and name are required to create an extension.");
      }

      const input: CreateExtensionInput = {
        demonstrationId,
        name,
        description:
          typeof description === "string" && description.length === 0
            ? null
            : (description as string | null) ?? null,
      };

      try {
        const result = await createExtensionMutation({ variables: { input } });
        const createdId = result.data?.createExtension?.id;

        if (!createdId) {
          showError("Create extension failed — check the console for details.");
          // eslint-disable-next-line no-console
          console.error("createExtension returned empty payload", result.data);
          return;
        }

        showSuccess("Extension created successfully!");
        onClose();
      } catch (error) {
        console.error(error);
        showError("Failed to create extension. Please try again.");
      }
    };

    const getExtensionFormData = (
      baseData: Record<string, unknown>,
      effectiveDate?: string,
      expirationDate?: string
    ) => createFormDataWithDates(baseData, effectiveDate, expirationDate);

    return (
      <BaseModificationDialog
        isOpen={isOpen}
        onClose={onClose}
        mode={mode}
        entityId={extensionId ?? undefined}
        demonstrationId={demonstrationId}
        data={data}
        entityType="extension"
        onSubmit={handleExtensionSubmit}
        getFormData={getExtensionFormData}
      />
    );
  }

  const isReadOnly = mode !== "edit";
  const hasExtensionId = Boolean(extensionId);

  const { data: queryData, loading, error } = useQuery<ExtensionQueryData>(EXTENSION_DIALOG_QUERY, {
    variables: { id: extensionId as string },
    skip: !hasExtensionId,
    fetchPolicy: "cache-first",
  });

  const extension = queryData?.extension;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  useEffect(() => {
    if (!extension) {
      return;
    }

    setTitle(extension.name ?? "");
    setDescription(extension.description ?? "");
    setEffectiveDate(extension.effectiveDate ? extension.effectiveDate.slice(0, 10) : "");
    setExpirationDate(extension.expirationDate ? extension.expirationDate.slice(0, 10) : "");
  }, [extension]);

  const effectiveDateDisplay = useMemo(() => {
    if (!extension?.effectiveDate) return "--/--/----";
    return formatDate(new Date(extension.effectiveDate));
  }, [extension?.effectiveDate]);

  const expirationDateDisplay = useMemo(() => {
    if (!extension?.expirationDate) return "--/--/----";
    return formatDate(new Date(extension.expirationDate));
  }, [extension?.expirationDate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!extensionId) {
      return;
    }

    const input: UpdateExtensionInput = {
      name: title,
      description: description.trim().length === 0 ? null : description,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
    };

    try {
      await updateExtensionMutation({
        variables: {
          id: extensionId,
          input,
        },
      });
      showSuccess("Extension updated successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      showError("Failed to update extension. Please try again.");
    }
  };

  const renderContent = () => {
    if (!hasExtensionId) {
      return <p className="text-sm text-text-font">No extension selected.</p>;
    }

    if (loading) {
      return <p className="text-sm text-text-font">Loading extension…</p>;
    }

    if (error) {
      return <p className="text-sm text-text-warn">Failed to load extension.</p>;
    }

    if (!extension) {
      return <p className="text-sm text-text-font">Extension not found.</p>;
    }

    return (
      <form id={FORM_ID} className="space-y-6" onSubmit={handleSubmit}>
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-font uppercase tracking-wide">Overview</h3>
          <TextInput
            name="extension-title"
            label="Extension Title"
            isRequired
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            isDisabled={isReadOnly}
          />
          <TextInput
            name="extension-demonstration"
            label="Demonstration"
            value={extension.demonstration?.name ?? "--"}
            isDisabled
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput
              name="extension-status"
              label="Status"
              value={extension.status}
              isDisabled
            />
            <TextInput
              name="extension-phase"
              label="Current Phase"
              value={extension.currentPhaseName ?? "--"}
              isDisabled
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-font uppercase tracking-wide">Timeline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-sm">
              <label className="text-text-font font-bold text-field-label flex gap-0-5" htmlFor="extension-effective-date">
                Effective Date
              </label>
              {isReadOnly ? (
                <input
                  id="extension-effective-date"
                  data-testid="extension-effective-date-display"
                  value={effectiveDateDisplay}
                  readOnly
                  className="border border-border-fields rounded px-2 py-1 bg-surface-secondary text-text-font"
                />
              ) : (
                <input
                  id="extension-effective-date"
                  type="date"
                  className="border border-border-fields rounded px-2 py-1"
                  value={effectiveDate}
                  onChange={(event) => setEffectiveDate(event.target.value)}
                />
              )}
            </div>
            <div className="flex flex-col gap-sm">
              <label className="text-text-font font-bold text-field-label flex gap-0-5" htmlFor="extension-expiration-date">
                Expiration Date
              </label>
              {isReadOnly ? (
                <input
                  id="extension-expiration-date"
                  data-testid="extension-expiration-date-display"
                  value={expirationDateDisplay}
                  readOnly
                  className="border border-border-fields rounded px-2 py-1 bg-surface-secondary text-text-font"
                />
              ) : (
                <input
                  id="extension-expiration-date"
                  type="date"
                  className="border border-border-fields rounded px-2 py-1"
                  value={expirationDate}
                  onChange={(event) => setExpirationDate(event.target.value)}
                />
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-font uppercase tracking-wide">Description</h3>
          <textarea
            id="extension-description"
            className="w-full border border-border-fields rounded px-2 py-1 text-sm min-h-[120px]"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            readOnly={isReadOnly}
            placeholder="Add a description"
          />
        </section>
      </form>
    );
  };

  const actions = isReadOnly ? (
    <SecondaryButton name="close-extension-dialog" size="small" onClick={onClose}>
      Close
    </SecondaryButton>
  ) : (
    <>
      <SecondaryButton name="cancel-extension-dialog" size="small" onClick={onClose}>
        Cancel
      </SecondaryButton>
      <Button
        name="save-extension-dialog"
        size="small"
        type="submit"
        form={FORM_ID}
        disabled={isSaving || title.trim().length === 0}
      >
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </>
  );

  const showInfoBanner = hasExtensionId && !loading && !error && Boolean(extension);

  return (
    <BaseDialog title={extension?.name ?? "Extension Details"} isOpen={isOpen} onClose={onClose} actions={actions}>
      {showInfoBanner && (
        <p className="text-sm italic text-text-placeholder mb-2">Expanded details coming soon.</p>
      )}
      {renderContent()}
    </BaseDialog>
  );
};
