import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  uipathGetRequestMock: vi.fn(),
  getProjectIdMock: vi.fn(),
  setProjectIdMock: vi.fn(),
  logInfoMock: vi.fn(),
}));

vi.mock("./uipathClient", () => ({
  UIPATH_BASE_URL: "https://govcloud.uipath.us",
  UIPATH_TENANT: "globalalliant/Dev",
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

describe("getProjectIdByName", () => {
  beforeEach(() => {
    mocks.uipathGetRequestMock.mockReset();
    mocks.getProjectIdMock.mockReset();
    mocks.setProjectIdMock.mockReset();
    mocks.logInfoMock.mockReset();
  });

  it("returns cached project id without calling UiPath projects endpoint", async () => {
    mocks.getProjectIdMock.mockReturnValue("cached-project-id");

    await expect(getProjectIdByName("token-123", "demosOCR")).resolves.toBe("cached-project-id");

    expect(mocks.uipathGetRequestMock).not.toHaveBeenCalled();
    expect(mocks.setProjectIdMock).not.toHaveBeenCalled();
  });

  it("fetches project id by name and caches it", async () => {
    mocks.getProjectIdMock.mockImplementation(() => {
      throw new Error("cache miss");
    });
    mocks.uipathGetRequestMock.mockResolvedValue({
      data: {
        projects: [
          { id: "project-1", name: "example" },
          { id: "project-2", name: "demosOCR" },
        ],
      },
    });

    await expect(getProjectIdByName("token-123", "demosOCR")).resolves.toBe("project-2");

    expect(mocks.uipathGetRequestMock).toHaveBeenCalledWith(
      "https://govcloud.uipath.us/globalalliant/Dev/du_/api/framework/projects/",
      "token-123"
    );
    expect(mocks.setProjectIdMock).toHaveBeenCalledWith("project-2");
  });

  it("throws when project name is not found", async () => {
    mocks.getProjectIdMock.mockImplementation(() => {
      throw new Error("cache miss");
    });
    mocks.uipathGetRequestMock.mockResolvedValue({
      data: {
        projects: [{ id: "project-1", name: "example" }],
      },
    });

    await expect(getProjectIdByName("token-123", "demosOCR")).rejects.toThrow(
      "No project found with name demosOCR"
    );
  });
});
