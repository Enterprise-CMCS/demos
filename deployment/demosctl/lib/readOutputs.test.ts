import fs from "fs";
import { readOutputs } from "./readOutputs";

describe("readOutputs", () => {
  test("should return proper json object", () => {
    const spy = jest.spyOn(fs, "readFileSync").mockImplementation(
      () => `
{
  "testing": "something",
  "number": 1
}
`
    );

    const data = readOutputs("fileName.json");

    expect(spy).toHaveBeenCalledWith("fileName.json", "utf8");
    expect(data).toEqual({ testing: "something", number: 1 });
  });
});
