import React from "react";
import { act, renderHook } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "components/toast";
import {
  SUBMIT_REFERENCE_AGREEMENT_MUTATION,
  useSubmitReferenceAgreement,
} from "./useSubmitReferenceAgreement";
import { useTriggerDownload } from "./useTriggerDownload";

vi.mock("./useTriggerDownload", () => ({ useTriggerDownload: vi.fn() }));

it.each(["QUEUED", "FAILED", "NOT_REQUESTED", "DISABLED"])(
  "downloads the reference and exposes %s to the dialog",
  async (emailRequestStatus) => {
    const triggerDownload = vi.fn();
    vi.mocked(useTriggerDownload).mockReturnValue({ triggerDownload });
    const variables = {
      id: "configuration-id",
      acceptedAgreementId: "agreement-id",
      emailRequested: true,
    };
    const response = { downloadUrl: "https://example.test/reference", emailRequestStatus };
    const { result } = renderHook(useSubmitReferenceAgreement, {
      wrapper: ({ children }) => (
        <MockedProvider
          mocks={[
            {
              request: { query: SUBMIT_REFERENCE_AGREEMENT_MUTATION, variables },
              result: { data: { submitReferenceAgreement: response } },
            },
          ]}
        >
          <ToastProvider>{children}</ToastProvider>
        </MockedProvider>
      ),
    });
    await act(async () => {
      await expect(result.current(variables)).resolves.toEqual(response);
    });
    expect(triggerDownload).toHaveBeenCalledWith(response.downloadUrl);
  }
);
