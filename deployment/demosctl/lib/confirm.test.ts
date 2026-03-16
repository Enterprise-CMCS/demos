// confirm.test.ts
import { Mock } from "vitest";
import { confirm } from "./confirm";
import readline from "readline";

vi.mock("readline");

describe("confirm", () => {
  let questionMock: Mock;

  beforeEach(() => {
    questionMock = vi.fn();
    // @ts-expect-error ignore invalid mock
    readline.createInterface.mockReturnValue({
      question: questionMock,
      close: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("returns true for matching string (non-strict, case-insensitive)", async () => {
    questionMock.mockImplementationOnce((_msg, callback) => callback("YES"));

    const result = await confirm("Are you sure?", ["yes", "y"]);
    expect(result).toBe(true);
    expect(questionMock).toHaveBeenCalledWith("Are you sure?", expect.any(Function));
  });

  test("returns false for non-matching string (non-strict)", async () => {
    questionMock.mockImplementationOnce((_msg, callback) => callback("nope"));

    const result = await confirm("Are you sure?", ["yes", "y"]);
    expect(result).toBe(false);
  });

  test("respects strict matching", async () => {
    questionMock.mockImplementation((_msg, callback) => callback("YES"));

    const result = await confirm("Are you sure?", ["YES"], true);
    expect(result).toBe(true);

    const falseResult = await confirm("Are you sure?", ["yes"], true);
    expect(falseResult).toBe(false); // because strict match is case-sensitive
  });

  test("trims whitespace from input", async () => {
    questionMock.mockImplementationOnce((_msg, callback) => callback("  y  "));

    const result = await confirm("Are you sure?", ["y"]);
    expect(result).toBe(true);
  });
});
