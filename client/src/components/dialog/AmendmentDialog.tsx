import React, { useEffect, useMemo, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TextInput } from "components/input/TextInput";
import { useToast } from "components/toast";
import { formatDate } from "util/formatDate";

import { gql, useMutation, useQuery } from "@apollo/client";
import { UpdateAmendmentInput } from "demos-server";

export const AMENDMENT_DIALOG_QUERY = gql`
  query AmendmentDialog($id: ID!) {
    amendment(id: $id) {
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

const UPDATE_AMENDMENT_MUTATION = gql`
  mutation UpdateAmendment($id: ID!, $input: UpdateAmendmentInput!) {
    updateAmendment(id: $id, input: $input) {
      id
    }
  }
`;

interface AmendmentQueryData {
  amendment: {
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

// TODO: CHOP THIS UP TO EDIT.

interface AmendmentDialogProps {
  amendmentId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  mode?: "view" | "edit";
}

const FORM_ID = "amendment-dialog-form";

// Using this for the view mode.
// We should break down to the CreateDemonstrationDialog pattern.
// It should be noted that EDIT IS NOT something that we have gotten to yet.
// This is just a YOLO from AI that may or may not work.
export const AmendmentDialog: React.FC<AmendmentDialogProps> = ({
  amendmentId,
  isOpen,
  onClose,
  mode = "view",
}) => {
  const isReadOnly = mode !== "edit";
  const hasAmendmentId = Boolean(amendmentId);
  const { showSuccess, showError } = useToast();
  const { data, loading, error } = useQuery<AmendmentQueryData>(AMENDMENT_DIALOG_QUERY, {
    variables: { id: amendmentId as string },
    skip: !hasAmendmentId,
    fetchPolicy: "cache-first",
  });

  const [updateAmendmentMutation, { loading: isSaving }] = useMutation(UPDATE_AMENDMENT_MUTATION);

  const amendment = data?.amendment;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  useEffect(() => {
    if (!amendment) {
      return;
    }

    setTitle(amendment.name ?? "");
    setDescription(amendment.description ?? "");
    setEffectiveDate(amendment.effectiveDate ? amendment.effectiveDate.slice(0, 10) : "");
    setExpirationDate(amendment.expirationDate ? amendment.expirationDate.slice(0, 10) : "");
  }, [amendment]);

  const effectiveDateDisplay = useMemo(() => {
    if (!amendment?.effectiveDate) return "--/--/----";
    return formatDate(new Date(amendment.effectiveDate));
  }, [amendment?.effectiveDate]);

  const expirationDateDisplay = useMemo(() => {
    if (!amendment?.expirationDate) return "--/--/----";
    return formatDate(new Date(amendment.expirationDate));
  }, [amendment?.expirationDate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!amendmentId) {
      return;
    }

    const input: UpdateAmendmentInput = {
      name: title,
      description: description.trim().length === 0 ? null : description,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
    };

    try {
      await updateAmendmentMutation({
        variables: {
          id: amendmentId,
          input,
        },
      });
      showSuccess("Amendment updated successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      showError("Failed to update amendment. Please try again.");
    }
  };

  const renderContent = () => {
    if (!hasAmendmentId) {
      return <p className="text-sm text-text-font">No amendment selected.</p>;
    }

    if (loading) {
      return <p className="text-sm text-text-font">Loading amendment…</p>;
    }

    if (error) {
      return <p className="text-sm text-text-warn">Failed to load amendment.</p>;
    }

    if (!amendment) {
      return <p className="text-sm text-text-font">Amendment not found.</p>;
    }

    return (
      <form id={FORM_ID} className="space-y-6" onSubmit={handleSubmit}>
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-font uppercase tracking-wide">Overview</h3>
          <TextInput
            name="amendment-title"
            label="Amendment Title"
            isRequired
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            isDisabled={isReadOnly}
          />
          <TextInput
            name="amendment-demonstration"
            label="Demonstration"
            value={amendment.demonstration?.name ?? "--"}
            isDisabled
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput
              name="amendment-status"
              label="Status"
              value={amendment.status}
              isDisabled
            />
            <TextInput
              name="amendment-phase"
              label="Current Phase"
              value={amendment.currentPhaseName ?? "--"}
              isDisabled
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-font uppercase tracking-wide">Timeline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-sm">
              <label className="text-text-font font-bold text-field-label flex gap-0-5" htmlFor="amendment-effective-date">
                Effective Date
              </label>
              {isReadOnly ? (
                <input
                  id="amendment-effective-date"
                  data-testid="amendment-effective-date-display"
                  value={effectiveDateDisplay}
                  readOnly
                  className="border border-border-fields rounded px-2 py-1 bg-surface-secondary text-text-font"
                />
              ) : (
                <input
                  id="amendment-effective-date"
                  type="date"
                  className="border border-border-fields rounded px-2 py-1"
                  value={effectiveDate}
                  onChange={(event) => setEffectiveDate(event.target.value)}
                />
              )}
            </div>
            <div className="flex flex-col gap-sm">
              <label className="text-text-font font-bold text-field-label flex gap-0-5" htmlFor="amendment-expiration-date">
                Expiration Date
              </label>
              {isReadOnly ? (
                <input
                  id="amendment-expiration-date"
                  data-testid="amendment-expiration-date-display"
                  value={expirationDateDisplay}
                  readOnly
                  className="border border-border-fields rounded px-2 py-1 bg-surface-secondary text-text-font"
                />
              ) : (
                <input
                  id="amendment-expiration-date"
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
            id="amendment-description"
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
    <SecondaryButton
      data-testid="close-amendment-dialog"
      name="close-amendment-dialog"
      size="small"
      onClick={onClose}
    >
      Close
    </SecondaryButton>
  ) : (
    <>
      <SecondaryButton name="cancel-amendment-dialog" size="small" onClick={onClose}>
        Cancel
      </SecondaryButton>
      <Button
        name="save-amendment-dialog"
        size="small"
        type="submit"
        form={FORM_ID}
        disabled={isSaving || title.trim().length === 0}
        onClick={() => {}}
      >
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </>
  );

  const showInfoBanner = hasAmendmentId && !loading && !error && Boolean(amendment);

  return (
    <BaseDialog title={amendment?.name ?? "Amendment Details"} isOpen={isOpen} onClose={onClose} actions={actions}>
      {showInfoBanner && (
        <p className="text-sm italic text-text-placeholder mb-2">Expanded details coming soon.</p>
      )}
      {renderContent()}
    </BaseDialog>
  );
};
