// components/application/phases/ConceptPhase.tsx
import React, { useMemo, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ConceptPreSubmissionUploadDialog } from "components/dialog/document/ConceptPreSubmissionUploadDialog";
import { RemoveDocumentDialog } from "components/dialog/document/DocumentDialog";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { Option } from "components/input/select/Select";
import { tw } from "tags/tw";

import { gql, useMutation, useQuery } from "@apollo/client";

// ---------- TEMP: replace with real GraphQL ----------
// These are temporary stub queries to prevent Apollo Client errors
// Replace with actual GraphQL queries when backend schema is ready
//
// TODO: Move to /queries/documentQueries.ts when ready
// TODO: Work with team to update server-side schema to support:
//   1. documents(demonstrationId: $demonstrationId, phase: "concept")
//   2. Current server only supports documents(bundleTypeId: String)
//   3. Need to add demonstrationId and phase parameters to documents query
//   4. This would enable phase-specific document filtering per demonstration
const GET_CONCEPT_DOCUMENTS = gql`
  query GetConceptDocuments($demonstrationId: ID!) {
    conceptDocuments: documents(demonstrationId: $demonstrationId, phase: "concept") {
      id
      title
      uploadedAt
      sizeMB
    }
  }
`;

const COMPLETE_CONCEPT_PHASE = gql`
  mutation CompleteConceptPhase($input: CompleteConceptPhaseInput!) {
    completeConceptPhase(input: $input) {
      id
      success
    }
  }
`;
// ----------------------------------------------------

type Props = {
  bundleId: string; // demonstration/bundle identifier for uploads
  demonstrationId: string; // parent demonstration id for phase completion
};

const STYLES = {
  grid: tw`grid grid-cols-1 md:grid-cols-2 gap-xl`,
  panel: tw`bg-surface-secondary rounded-2xl p-lg border border-border-subtle`,
  panelTitle: tw`text-lg font-bold mb-sm`,
  helper: tw`text-sm text-text-placeholder mb-md`,
  list: tw`mt-md space-y-sm`,
  fileRow: tw`border border-border-fields rounded-lg p-sm flex items-start justify-between`,
  fileMeta: tw`text-[12px] text-text-placeholder mt-1`,
  stepHeader: tw`text-[12px] font-bold uppercase tracking-wide text-text-placeholder mb-xs`,
  actions: tw`mt-xl flex items-center justify-end gap-sm`,
};

const DEMONSTRATION_TYPE_OPTIONS: Option[] = [
  { label: "Section 1115", value: "1115" },
  { label: "Section 1915(b)", value: "1915b" },
  { label: "Section 1915(c)", value: "1915c" },
];

export const ConceptPhase: React.FC<Props> = ({ bundleId, demonstrationId }) => {
  // Upload modal
  const [isUploadOpen, setUploadOpen] = useState(false);

  // Delete modal
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const [isRemoveOpen, setRemoveOpen] = useState(false);

  // Right side fields
  const [dateSubmitted, setDateSubmitted] = useState<string>("");
  const [demoType, setDemoType] = useState<string>("");

  // Data
  const { data, loading, refetch } = useQuery(GET_CONCEPT_DOCUMENTS, {
    variables: { demonstrationId },
    fetchPolicy: "cache-and-network",
    // Skip the query until we have a proper backend implementation
    skip: true,
  });
  const [completePhase, { loading: finishing }] = useMutation(COMPLETE_CONCEPT_PHASE, {
    onCompleted: () => refetch(),
  });

  const documents = useMemo(() => {
    // Shape this to your real data
    // For now, return empty array since we're skipping the query
    return (data?.conceptDocuments ?? []) as Array<{
      id: string;
      title: string;
      uploadedAt?: string;
      sizeMB?: number;
    }>;
  }, [data]);

  const onDelete = (id: string) => {
    setRemoveIds([id]);
    setRemoveOpen(true);
  };

  const onFinish = async () => {
    await completePhase({
      variables: {
        input: {
          demonstrationId,
          dateSubmitted,
          demonstrationTypeRequested: demoType,
        },
      },
    });
  };

  return (
    <div>
      {/* Phase header is part of the parent page; ConceptPhase renders the content area */}
      <h2 className="sr-only">Concept</h2>

      <div className={STYLES.grid}>
        {/* STEP 1 — UPLOAD */}
        <section className={STYLES.panel} aria-labelledby="concept-upload-title">
          <div className={STYLES.stepHeader}>Step 1 - Upload</div>
          <h3 id="concept-upload-title" className={STYLES.panelTitle}>
            UPLOAD
          </h3>
          <p className={STYLES.helper}>
            Upload the Pre-Submission Document describing your demonstration.
          </p>

          <SecondaryButton onClick={() => setUploadOpen(true)} name="button-open-upload-modal">
            Upload
          </SecondaryButton>

          {/* Uploaded file list */}
          <div className={STYLES.list}>
            {loading && <div className="text-sm text-text-placeholder">Loading documents…</div>}
            {!loading && documents.length === 0 && (
              <div className="text-sm text-text-placeholder">No documents yet.</div>
            )}
            {documents.map((doc) => (
              <div key={doc.id} className={STYLES.fileRow}>
                <div>
                  <div className="font-medium">{doc.title}</div>
                  <div className={STYLES.fileMeta}>
                    {doc.uploadedAt ? doc.uploadedAt : "--/--/----"}
                    {typeof doc.sizeMB === "number" ? ` • ${doc.sizeMB.toFixed(1)} MB` : null}
                  </div>
                </div>
                <button
                  className="text-sm underline"
                  onClick={() => onDelete(doc.id)}
                  aria-label={`Delete ${doc.title}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* STEP 2 — VERIFY/COMPLETE */}
        <section className={STYLES.panel} aria-labelledby="concept-verify-title">
          <div className={STYLES.stepHeader}>Step 2 - Verify/Complete</div>
          <h3 id="concept-verify-title" className={STYLES.panelTitle}>
            VERIFY/COMPLETE
          </h3>
          <p className={STYLES.helper}>
            Verify that the document is uploaded/accurate and that all required fields are filled.
          </p>

          <div className="space-y-md">
            {/* Date Submitted */}
            <div>
              <label className="block text-sm font-bold mb-xs">
                <span className="text-text-warn mr-1">*</span>Date Submitted
              </label>
              <input
                type="date"
                value={dateSubmitted}
                onChange={(e) => setDateSubmitted(e.target.value)}
                className="w-full border border-border-fields px-xs py-xs text-sm rounded"
                aria-required="true"
              />
            </div>

            {/* Demonstration Type(s) Requested */}
            <AutoCompleteSelect
              id="demo-type"
              label="Demonstration Type(s) Requested"
              options={DEMONSTRATION_TYPE_OPTIONS}
              value={demoType}
              onSelect={(v) => setDemoType(String(v))}
            />
          </div>

          <div className={STYLES.actions}>
            <SecondaryButton
              name="button-skip-concept"
              onClick={() => {
                /* TODO: wire skip action */
              }}
            >
              Skip
            </SecondaryButton>
            <Button name="button-finish-concept" onClick={onFinish} disabled={finishing}>
              {finishing ? "Saving…" : "Finish"}
            </Button>
          </div>
        </section>
      </div>

      {/* Upload modal (phase-aware wrapper) */}
      <ConceptPreSubmissionUploadDialog
        isOpen={isUploadOpen}
        onClose={() => {
          setUploadOpen(false);
          refetch();
        }}
        bundleId={bundleId}
        // Ensure the phase list and the global Documents tab both refresh after upload
        refetchQueries={["GetConceptDocuments", "GetDemonstrationDocuments"]}
      />

      {/* Delete confirmation */}
      <RemoveDocumentDialog
        isOpen={isRemoveOpen}
        documentIds={removeIds}
        onClose={() => {
          setRemoveOpen(false);
          refetch();
        }}
      />
    </div>
  );
};
