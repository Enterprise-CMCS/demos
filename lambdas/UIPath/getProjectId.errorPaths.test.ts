import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  uipathGetRequestMock: vi.fn(),
  getProjectIdMock: vi.fn(),
  setProjectIdMock: vi.fn(),
  logInfoMock: vi.fn(),
  baseUrl: "https://govcloud.uipath.us",
  tenant: "globalalliant/Dev",
}));

vi.mock("./uipathClient", () => ({
  get UIPATH_BASE_URL() {
    return mocks.baseUrl;
  },
  get UIPATH_TENANT() {
    return mocks.tenant;
  },
  uipathGetRequest: mocks.uipathGetRequestMock,
  getProjectId: mocks.getProjectIdMock,
  setProjectId: mocks.setProjectIdMock,
}));

vi.mock("./log", () => ({
  log: {
    info: mocks.logInfoMock,
  },
}));

import { getProjectIdByName } from "./getProjectId";

describe("getProjectIdByName error paths", () => {
  beforeEach(() => {
    mocks.baseUrl = "https://govcloud.uipath.us";
    mocks.tenant = "globalalliant/Dev";
    mocks.uipathGetRequestMock.mockReset();
    mocks.getProjectIdMock.mockReset();
    mocks.setProjectIdMock.mockReset();
    mocks.logInfoMock.mockReset();
    mocks.getProjectIdMock.mockImplementation(() => {
      throw new Error("cache miss");
    });
  });

  it("throws when UiPath configuration is missing", async () => {
    mocks.baseUrl = "";

    await expect(getProjectIdByName("token-123", "demosOCR")).rejects.toThrow(
      "Missing UiPath base URL or tenant configuration."
    );
    expect(mocks.uipathGetRequestMock).not.toHaveBeenCalled();
  });

  it("throws when no projects are returned", async () => {
    mocks.uipathGetRequestMock.mockResolvedValue({ data: {} });

    await expect(getProjectIdByName("token-123", "demosOCR")).rejects.toThrow(
      "No projects returned."
    );
  });

  it("throws when matching project is missing an id", async () => {
    mocks.uipathGetRequestMock.mockResolvedValue({
      data: {
        projects: [{ name: "demosOCR" }],
      },
    });

    await expect(getProjectIdByName("token-123", "demosOCR")).rejects.toThrow(
      "Project demosOCR is missing an id."
    );
  });
});
