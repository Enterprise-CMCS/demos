// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { SelectManyReferenceConfigurationsResult } from "../referenceConfiguration/queries";
import { ReferenceConfigurationStatus } from "../../types";

// Functions under test
import { validateReferenceDownloadRequest } from "./validateReferenceDownloadRequest";

// Mock imports
vi.mock("../referenceConfiguration/queries", () => ({
  selectReferenceConfiguration: vi.fn(),
}));

vi.mock("../../log", () => ({
  log: {
    info: vi.fn(),
  },
}));

import { selectReferenceConfiguration } from "../referenceConfiguration/queries";
import { log } from "../../log";

describe("validateReferenceDownloadRequest", () => {
  const testReferenceConfigurationId = "reference-configuration-1";
  const testReferenceAgreementId = "reference-agreement-1";

  const mockActiveConfigWithoutAgreement: DeepPartial<SelectManyReferenceConfigurationsResult> = {
    id: testReferenceConfigurationId,
    statusId: "Active" satisfies ReferenceConfigurationStatus,
    referenceAgreement: null,
    reference: { id: "reference-1", s3Path: "some/path" },
  };

  const mockActiveConfigWithAgreement: DeepPartial<SelectManyReferenceConfigurationsResult> = {
    id: testReferenceConfigurationId,
    statusId: "Active" satisfies ReferenceConfigurationStatus,
    referenceAgreement: { id: testReferenceAgreementId },
    reference: { id: "reference-1", s3Path: "some/path" },
  };

  const mockInactiveConfigWithAgreement: DeepPartial<SelectManyReferenceConfigurationsResult> = {
    id: testReferenceConfigurationId,
    statusId: "Inactive" satisfies ReferenceConfigurationStatus,
    referenceAgreement: { id: testReferenceAgreementId },
    reference: { id: "reference-1", s3Path: "some/path" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws REFERENCE_NOT_FOUND if the reference configuration does not exist", async () => {
    vi.mocked(selectReferenceConfiguration).mockResolvedValueOnce(null);

    await expect(
      validateReferenceDownloadRequest(testReferenceConfigurationId)
    ).rejects.toMatchObject({
      message: `Reference configuration ${testReferenceConfigurationId} not found.`,
      extensions: { code: "REFERENCE_NOT_FOUND" },
    });
    expect(log.info).toHaveBeenCalledExactlyOnceWith(
      `Reference "${testReferenceConfigurationId}" was requested, but could not be found.`
    );
  });

  it("throws REFERENCE_NOT_ACTIVE if the reference configuration is not active", async () => {
    vi.mocked(selectReferenceConfiguration).mockResolvedValueOnce(
      mockInactiveConfigWithAgreement as SelectManyReferenceConfigurationsResult
    );

    await expect(
      validateReferenceDownloadRequest(testReferenceConfigurationId)
    ).rejects.toMatchObject({
      message: `Reference configuration ${testReferenceConfigurationId} not found.`,
      extensions: { code: "REFERENCE_NOT_ACTIVE" },
    });
    expect(log.info).toHaveBeenCalledExactlyOnceWith(
      `Reference "${testReferenceConfigurationId}" was requested, but is inactive.`
    );
  });

  it("throws REFERENCE_AGREEMENT_ERROR if no agreement is required but one is provided", async () => {
    vi.mocked(selectReferenceConfiguration).mockResolvedValueOnce(
      mockActiveConfigWithoutAgreement as SelectManyReferenceConfigurationsResult
    );

    await expect(
      validateReferenceDownloadRequest(testReferenceConfigurationId, "unexpected-agreement-id")
    ).rejects.toMatchObject({
      message: "Cannot download requested reference using provided agreement ID.",
      extensions: { code: "REFERENCE_AGREEMENT_ERROR" },
    });
    expect(log.info).toHaveBeenCalledExactlyOnceWith(
      `Reference "${testReferenceConfigurationId}" was requested using agreement "unexpected-agreement-id", ` +
        "but reference does not require agreement."
    );
  });

  it("throws REFERENCE_AGREEMENT_ERROR if an agreement is required but none is provided", async () => {
    vi.mocked(selectReferenceConfiguration).mockResolvedValueOnce(
      mockActiveConfigWithAgreement as SelectManyReferenceConfigurationsResult
    );

    await expect(
      validateReferenceDownloadRequest(testReferenceConfigurationId)
    ).rejects.toMatchObject({
      message: "Cannot download requested reference using provided agreement ID.",
      extensions: { code: "REFERENCE_AGREEMENT_ERROR" },
    });
    expect(log.info).toHaveBeenCalledExactlyOnceWith(
      `Reference "${testReferenceConfigurationId}" was requested without an agreement, ` +
        `but an agreement with ID "${testReferenceAgreementId}" is required.`
    );
  });

  it("throws REFERENCE_AGREEMENT_ERROR if the wrong agreement ID is provided", async () => {
    vi.mocked(selectReferenceConfiguration).mockResolvedValueOnce(
      mockActiveConfigWithAgreement as SelectManyReferenceConfigurationsResult
    );

    await expect(
      validateReferenceDownloadRequest(testReferenceConfigurationId, "wrong-agreement-id")
    ).rejects.toMatchObject({
      message: "Cannot download requested reference using provided agreement ID.",
      extensions: { code: "REFERENCE_AGREEMENT_ERROR" },
    });
    expect(log.info).toHaveBeenCalledExactlyOnceWith(
      `Reference "${testReferenceConfigurationId}" was requested using agreement "wrong-agreement-id" ` +
        `but the agreement required is "${testReferenceAgreementId}".`
    );
  });

  it("returns what is returned if nothing throws", async () => {
    vi.mocked(selectReferenceConfiguration).mockResolvedValueOnce(
      mockActiveConfigWithoutAgreement as SelectManyReferenceConfigurationsResult
    );

    const result = await validateReferenceDownloadRequest(testReferenceConfigurationId);
    expect(result).toBe(mockActiveConfigWithoutAgreement);
  });
});
