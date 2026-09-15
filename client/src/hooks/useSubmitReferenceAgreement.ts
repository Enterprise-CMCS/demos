import { gql, TypedDocumentNode, useMutation } from "@apollo/client";
import { SubmitReferenceAgreementResult } from "demos-server";
import { useToast } from "components/toast";
import { useTriggerDownload } from "./useTriggerDownload";

type SubmissionVariables = { id: string; acceptedAgreementId: string; emailRequested: boolean };

export const SUBMIT_REFERENCE_AGREEMENT_MUTATION: TypedDocumentNode<
  { submitReferenceAgreement: SubmitReferenceAgreementResult },
  SubmissionVariables
> = gql`
  mutation SubmitReferenceAgreement(
    $id: ID!
    $acceptedAgreementId: ID!
    $emailRequested: Boolean!
  ) {
    submitReferenceAgreement(
      id: $id
      acceptedAgreementId: $acceptedAgreementId
      emailRequested: $emailRequested
    ) {
      downloadUrl
      emailRequestStatus
    }
  }
`;

export const useSubmitReferenceAgreement = () => {
  const { showError } = useToast();
  const { triggerDownload } = useTriggerDownload();
  const [submit] = useMutation(SUBMIT_REFERENCE_AGREEMENT_MUTATION);

  return async (variables: SubmissionVariables): Promise<SubmitReferenceAgreementResult> => {
    try {
      const { data } = await submit({ variables });
      if (!data?.submitReferenceAgreement.downloadUrl) {
        throw new Error("Missing reference download URL after agreement submission.");
      }
      triggerDownload(data.submitReferenceAgreement.downloadUrl);
      return data.submitReferenceAgreement;
    } catch (error) {
      showError("Unable to submit reference agreement.");
      throw error;
    }
  };
};
