import { configuredDistributionExists } from "./checkCloudfront";

jest.mock("@aws-sdk/client-cloudfront", () => {
  const actual = jest.requireActual("@aws-sdk/client-cloudfront");
  return {
    ...actual,
    CloudFrontClient: jest.fn(() => ({
      send: jest.fn(async (command) => {
        if (
          command instanceof actual.ListDistributionsCommand
        ) {
          return { DistributionList: { Items: [{Comment: "Env Name: test"}, {Comment: "Env Name: dev"}]} };
        }
        return {};
      }),
    })),
  };
});

describe("checkCloudfront", () => {

  it("should return false if the configured distribution doesn't exist", async () => {
    const out = await configuredDistributionExists("unit-test")
    expect(out).toEqual(false)
  })

  it("should return true if the configured distribution does exist", async () => {
    const out = await configuredDistributionExists("dev")
    expect(out).toEqual(true)
  })

});
