import { runCommand } from "../lib/runCommand";
import { down } from "./down";
import { confirm } from "../lib/confirm";

jest.mock("../lib/runCommand");
jest.mock("../lib/confirm");

describe("down", () => {
  beforeEach(() => {
    //@ts-expect-error ignore invalid mock
    jest.spyOn(process, "exit").mockImplementation(() => "exit");
  });

  afterEach(() => {
    // @ts-expect-error ignore invalid mock
    (process.exit as jest.Mock).mockRestore();
  });

  test("should run the cdk destroy command on the proper env", async () => {
    const mockStageName = "unit-test";

    const c = confirm as jest.Mock;
    c.mockResolvedValue(true);

    const rc = runCommand as jest.Mock;

    await down(mockStageName);

    expect(rc).toHaveBeenCalledWith("down", "npx", expect.arrayContaining(["destroy", `stage=${mockStageName}`]));
  });

  test("should prevent running against main envs", async () => {
    const mockStageNames = ["prod", "impl", "test", "dev"];
    for (const stage of mockStageNames) {
      await down(stage);
    }
    expect(process.exit).toHaveBeenCalledTimes(4);
  });

  test("should exit if user doesn't confirm with 'yes'", async () => {
    const mockStageName = "unit-test";

    const c = confirm as jest.Mock;
    c.mockResolvedValue(false);

    await down(mockStageName);

    expect(process.exit).toHaveBeenCalledTimes(1);
  });

  test("should show error when destroy fails", async () => {
    const mockStageName = "unit-test";

    const c = confirm as jest.Mock;
    c.mockResolvedValue(true);

    const rc = runCommand as jest.Mock;
    rc.mockRejectedValue("there was an error");

    jest.spyOn(console, "error");

    await down(mockStageName);

    expect(rc).toHaveBeenCalledWith("down", "npx", expect.arrayContaining(["destroy", `stage=${mockStageName}`]));

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("there was an error"));
  });
});
