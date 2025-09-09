import { getOutputValue } from "./getOutputValue";

describe("getOutputValue", () => {
  test("should get the proper value", () => {
    const outputData = { parent: { child: "someValue", other: "other" } };
    const output = getOutputValue(outputData, "parent", "child");
    expect(output).toEqual("someValue");
  });
  test("should exit the script if the value is missing", () => {
    // @ts-expect-error prevent error on invalid mock exit
    jest.spyOn(process, "exit").mockImplementation(() => "exit");

    const outputData = { parent: { child: "someValue", other: "other" } };
    const output = getOutputValue(outputData, "parent", "missing");
    expect(output).toEqual("exit");
  });
});
