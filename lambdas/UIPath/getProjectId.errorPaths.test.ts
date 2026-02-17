import { describe, expect, it, vi } from "vitest";

type SetupOptions = {
  baseUrl?: string;
  tenant?: string;
  responseData?: unknown;
};

async function setup(options: SetupOptions = {}) {
  const {
    baseUrl = "https://govcloud.uipath.us",
    tenant = "globalalliant/Dev",
    responseData = {},
  } = options;

  const uipathGetRequestMock = vi.fn().mockResolvedValue({ data: responseData });
  const getProjectIdMock = vi.fn(() => {
    throw new Error("cache miss");
  });
  const setProjectIdMock = vi.fn();
  const logInfoMock = vi.fn();

  vi.resetModules();
  vi.doMock("./uipathClient", () => ({
    UIPATH_BASE_URL: baseUrl,
    UIPATH_TENANT: tenant,
    uipathGetRequest: uipathGetRequestMock,
    getProjectId: getProjectIdMock,
    setProjectId: setProjectIdMock,
  }));
  vi.doMock("./log", () => ({
    log: {
      info: logInfoMock,
    },
  }));

  const { getProjectIdByName } = await import("./getProjectId");

  return {
    getProjectIdByName,
    uipathGetRequestMock,
    getProjectIdMock,
    setProjectIdMock,
    logInfoMock,
  };
}

describe("getProjectIdByName error paths", () => {
  it("throws when UiPath configuration is missing", async () => {
    const { getProjectIdByName, uipathGetRequestMock } = await setup({
      baseUrl: "",
    });

    await expect(getProjectIdByName("token-123", "demosOCR")).rejects.toThrow(
      "Missing UiPath base URL or tenant configuration."
    );
    expect(uipathGetRequestMock).not.toHaveBeenCalled();
  });

  it("throws when no projects are returned", async () => {
    const { getProjectIdByName } = await setup({
      responseData: {},
    });

    await expect(getProjectIdByName("token-123", "demosOCR")).rejects.toThrow(
      "No projects returned."
    );
  });

  it("throws when matching project is missing an id", async () => {
    const { getProjectIdByName } = await setup({
      responseData: {
        projects: [{ name: "demosOCR" }],
      },
    });

    await expect(getProjectIdByName("token-123", "demosOCR")).rejects.toThrow(
      "Project demosOCR is missing an id."
    );
  });
});
