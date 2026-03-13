import { configuredDistributionExists } from "./checkCloudfront";

vi.mock(import ("@aws-sdk/client-cloudfront"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    CloudFrontClient: vi.fn().mockImplementation(function () {return {
      send: vi.fn(async (command) => {
        if (
          command instanceof actual.ListDistributionsCommand
        ) {
          return { DistributionList: { Items: [{Comment: "Env Name: test"}, {Comment: "Env Name: dev"}]} };
        }
        return {};
      }),
    }}),
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
