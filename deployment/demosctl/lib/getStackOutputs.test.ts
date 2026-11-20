import { getStackOutputs } from "./getStackOutputs";

const mockCloudformationSend = vi.fn().mockImplementation(() => ({ Stacks: [] }));

vi.mock(import("@aws-sdk/client-cloudformation"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    CloudFormationClient: vi.fn().mockImplementation(function () {
      return {
        send: mockCloudformationSend,
      };
    }),
  };
});

describe("getStackOutputs", () => {
  test("should throw when the stack cannot be found", async () => {
    await expect(() => getStackOutputs("invalid-stack")).rejects.toThrow(
      `CloudFormation stack 'invalid-stack' was not found`,
    );
  });

  test("should return proper values from a valid stack", async () => {
    mockCloudformationSend.mockImplementationOnce(() => ({
      Stacks: [
        {
          Outputs: [
            { OutputKey: "output1", OutputValue: "output-value-1" },
            { OutputKey: "output2", OutputValue: "output-value-2" },
          ],
        },
      ],
    }));

    const outputs = await getStackOutputs("unit-test-stack");
    expect(outputs).toEqual({ output1: "output-value-1", output2: "output-value-2" });
  });

  test("should properly handle empty outputs", async () => {
    mockCloudformationSend.mockImplementationOnce(() => ({
      Stacks: [
        {
          Outputs: [],
        },
      ],
    }));

    const outputs = await getStackOutputs("unit-test-stack");
    expect(outputs).toEqual({});

    mockCloudformationSend.mockImplementationOnce(() => ({
      Stacks: [{}],
    }));

    const outputs2 = await getStackOutputs("unit-test-stack");
    expect(outputs2).toEqual({});

    mockCloudformationSend.mockImplementationOnce(() => ({
      Stacks: [
        {
          Outputs: [{ OutputKey: "output1" }],
        },
      ],
    }));

    const outputs3 = await getStackOutputs("unit-test-stack");
    expect(outputs3).toEqual({});
  });
});
