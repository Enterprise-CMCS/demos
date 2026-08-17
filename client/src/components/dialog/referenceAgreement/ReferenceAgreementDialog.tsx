import React from "react";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { Button } from "components/button";
import { tw } from "tags/tw";
import { Checkbox } from "components/input";
import { useDownloadReference } from "hooks/useDownloadReference";
import { ReferenceAgreementDocument } from "./ReferenceAgreementDocument";
import { Reference, ReferenceAgreement } from "demos-server";
import { Spinner } from "components/loading/Spinner";

const STYLES = {
  checkbox: tw`flex items-center p-1 cursor-pointer`,
};

const EMAIL_AGREEMENT_LABEL =
  "\u00A0Receive an email with the Accepted 'Point and Click Agreement'";

export const ReferenceAgreementDialog = ({
  reference,
}: {
  reference: Pick<Reference, "id"> & {
    agreement: Pick<ReferenceAgreement, "id" | "name" | "createdAt">;
  };
}) => {
  const { closeDialog } = useDialog();
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [emailAgreement, setEmailAgreement] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const { downloadReference } = useDownloadReference();

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
              await downloadReference({
                id: reference.id,
                acceptedAgreementId: reference.agreement.id,
                emailAgreement,
              });
              closeDialog();
            } catch {
              // useDownloadReference reports download errors to the user.
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
        <label className={STYLES.checkbox}>
          <Checkbox
            name="checkbox-accept-terms"
            checked={termsAccepted}
            onChange={() => setTermsAccepted((prev) => !prev)}
          />
          <span className="text-sm text-text-font">&nbsp;I accept the terms</span>
        </label>
        <label className={STYLES.checkbox}>
          <Checkbox
            name="checkbox-email-agreement"
            checked={emailAgreement}
            onChange={() => setEmailAgreement((prev) => !prev)}
          />
          <span className="text-sm text-text-font">{EMAIL_AGREEMENT_LABEL}</span>
        </label>
      </>
    </BaseDialog>
  );
};
