import React from "react";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { Button } from "components/button";
import { tw } from "tags/tw";
import { Checkbox } from "components/input";
import { useSubmitReferenceAgreement } from "hooks/useSubmitReferenceAgreement";
import { useToast } from "components/toast";
import { ReferenceAgreementDocument } from "./ReferenceAgreementDocument";
import { Reference, ReferenceAgreement } from "demos-server";
import { Spinner } from "components/loading/Spinner";

const STYLES = {
  termsCheckbox: tw`flex items-center gap-[8px] p-1 cursor-pointer`,
};

export const ReferenceAgreementDialog = ({
  reference,
}: {
  reference: Pick<Reference, "id"> & {
    agreement: Pick<ReferenceAgreement, "id" | "name" | "createdAt">;
  };
}) => {
  const { closeDialog } = useDialog();
  const { showWarning } = useToast();
  const [emailRequested, setEmailRequested] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const submitReferenceAgreement = useSubmitReferenceAgreement();

  return (
    <BaseDialog
      title="Point and Click Agreement"
      onClose={closeDialog}
      maxWidthClass="max-w-[600px]"
      dialogHasChanges={false}
      actionButton={
        <Button
          disabled={!termsAccepted || isDownloading}
          name={"button-download-reference"}
          onClick={async () => {
            setIsDownloading(true); // where spinner will engage.
            try {
              const result = await submitReferenceAgreement({
                id: reference.id,
                acceptedAgreementId: reference.agreement.id,
                emailRequested,
              });
              closeDialog();
              if (result.emailRequestStatus === "FAILED") {
                showWarning(
                  "Your agreement was accepted, but we couldn't queue the terms and conditions email."
                );
              } else if (result.emailRequestStatus === "DISABLED") {
                showWarning(
                  "Your agreement was accepted, but email notifications are currently disabled."
                );
              }
            } catch {
              // useSubmitReferenceAgreement reports submission errors to the user.
              setIsDownloading(false);
            }
          }}
        >
          <span className="relative inline-flex items-center justify-center">
            <span className={isDownloading ? "invisible" : ""}>Download</span>
            {isDownloading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner />
              </span>
            )}
          </span>
        </Button>
      }
    >
      <>
        <p data-testid="reference-agreement-instructions">
          View the demonstration type and then accept and download the technical specifications of
          the National Stewards Terms and Conditions &quot;Point and Click&quot; Agreement below
        </p>
        <ReferenceAgreementDocument agreement={reference.agreement} />
        <label className={STYLES.termsCheckbox}>
          <Checkbox
            name="checkbox-accept-terms"
            checked={termsAccepted}
            onChange={() => setTermsAccepted((prev) => !prev)}
          />
          <span className="text-sm text-text-font">I accept the terms</span>
        </label>
        <label className={STYLES.termsCheckbox}>
          <Checkbox
            name="checkbox-email-agreement"
            checked={emailRequested}
            onChange={() => setEmailRequested((prev) => !prev)}
          />
          <span className="text-sm text-text-font">
            Receive an email with the Accepted 'Point and Click Agreement'
          </span>
        </label>
      </>
    </BaseDialog>
  );
};
