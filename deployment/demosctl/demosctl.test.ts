/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { buildClient } from "./commands/buildClient";
import { buildServer } from "./commands/buildServer";
import { getCoreOutputs } from "./commands/getCoreOutputs";
import { fullDeploy } from "./commands/fullDeploy";
import { addCloudfrontRedirect } from "./commands/addCloudfrontRedirect";
import { up } from "./commands/up";
import { down } from "./commands/down";
import { runMigration } from "./commands/runMigration";
import { testMigration } from "./commands/testMigration";
import { dataFix, dataFixLint } from "./commands/dataFix";
import { main } from "./demosctl";

vi.mock("./commands/buildClient");
vi.mock("./commands/buildServer");
vi.mock("./commands/getCoreOutputs");
vi.mock("./commands/fullDeploy");
vi.mock("./commands/addCloudfrontRedirect");
vi.mock("./commands/up");
vi.mock("./commands/down");
vi.mock("./commands/runMigration");
vi.mock("./commands/testMigration");
vi.mock("./commands/dataFix");

const expectFunc = async (command: string, func: Function, stage: string, additional: any[] = [], empty: boolean = false) => {
  process.argv = ["", "", command, stage, ...additional];
  await main();
  if (empty) {
    expect(func).toHaveBeenCalled();
  } else {
    expect(func).toHaveBeenCalledWith(stage, ...additional);
  }
};

describe("demosctl root", () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv;
    vi.resetAllMocks();
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test("should run the proper commands", async () => {
    const mockStageName = "unit-test";

    await expectFunc("build:client", buildClient, mockStageName, [false]);
    await expectFunc("build:server", buildServer, mockStageName, [], true);
    await expectFunc("deploy:core", getCoreOutputs, mockStageName);
    await expectFunc("deploy:all", fullDeploy, mockStageName);
    await expectFunc("deploy:add-cloudfront-redirect", addCloudfrontRedirect, mockStageName);
    await expectFunc("up", up, mockStageName);
    await expectFunc("down", down, mockStageName);
    await expectFunc("migrate", runMigration, mockStageName, ["something"]);
    await expectFunc("test-migration", testMigration, mockStageName, ["something"]);

    expect(buildClient).toHaveBeenCalledTimes(1);
    expect(buildServer).toHaveBeenCalledTimes(1);
    expect(getCoreOutputs).toHaveBeenCalledTimes(1);
    expect(fullDeploy).toHaveBeenCalledTimes(1);
    expect(addCloudfrontRedirect).toHaveBeenCalledTimes(1);
    expect(up).toHaveBeenCalledTimes(1);
    expect(down).toHaveBeenCalledTimes(1);
    expect(runMigration).toHaveBeenCalledTimes(1);
    expect(testMigration).toHaveBeenCalledTimes(1);
  });

  test.each([0, 1] as const)("should return data-fix:lint exit code %s", async (exitCode) => {
    vi.mocked(dataFixLint).mockResolvedValueOnce(exitCode);
    process.argv = ["", "", "data-fix:lint", "all"];

    expect(await main()).toEqual(exitCode);
    expect(dataFixLint).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(dataFix).not.toHaveBeenCalled();
  });

  test("should pass an optional folder to data-fix:lint", async () => {
    vi.mocked(dataFixLint).mockResolvedValueOnce(0);
    process.argv = ["", "", "data-fix:lint", "all", "some/dir"];
    expect(await main()).toEqual(0);
    expect(dataFixLint).toHaveBeenCalledExactlyOnceWith("some/dir");
    expect(dataFix).not.toHaveBeenCalled();
  });

  test("should require all for data-fix:lint", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    process.argv = ["", "", "data-fix:lint", "some/dir"];
    const resp = await main();

    expect(console.error).toHaveBeenCalledWith("usage: data-fix:lint all [dir]");
    expect(dataFixLint).not.toHaveBeenCalled();
    expect(dataFix).not.toHaveBeenCalled();
    expect(resp).toEqual(1);
  });

  test.each([
    { apply: false, exitCode: 0 },
    { apply: false, exitCode: 1 },
    { apply: true, exitCode: 0 },
    { apply: true, exitCode: 1 },
  ])("should pass Jenkins metadata with apply=$apply and return exit code $exitCode", async ({ apply, exitCode }) => {
    vi.stubEnv("APPROVED_BY", "test-approver");
    vi.stubEnv("APPLIED_BY", "test-user");
    vi.stubEnv("GIT_COMMIT", "test-commit");
    vi.stubEnv("BUILD_URL", "https://example.invalid/build/1");
    vi.mocked(dataFix).mockResolvedValueOnce(exitCode);
    process.argv = ["", "", "data-fix", "dev", "example.sql", ...(apply ? ["--apply"] : [])];
    expect(await main()).toEqual(exitCode);
    expect(dataFix).toHaveBeenCalledExactlyOnceWith("dev", "example.sql", {
      apply, approvedBy: "test-approver", appliedBy: "test-user",
      gitCommit: "test-commit", buildUrl: "https://example.invalid/build/1",
    });
    expect(dataFixLint).not.toHaveBeenCalled();
  });

  test.each([[], ["--apply"], ["example.sql", "--unknown"], ["example.sql", "--apply", "extra"]])("should reject invalid data-fix arguments %j", async (...args) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.argv = ["", "", "data-fix", "dev", ...args];
    expect(await main()).toEqual(1);
    expect(console.error).toHaveBeenCalledWith("usage: data-fix <env> <file> [--apply]");
    expect(dataFix).not.toHaveBeenCalled();
    expect(dataFixLint).not.toHaveBeenCalled();
  });

  test("should require a stage name", async () => {
    // @ts-expect-error prevent error on invalid mock exit
    vi.spyOn(process, "exit").mockImplementation(() => "exit");

    process.argv = ["", "", "build:client"];
    await main();

    expect(process.exit).toHaveBeenCalled();
  });

  test("should properly handle an unknown command", async () => {
    vi.spyOn(console, "error");

    process.argv = ["", "", "fake-command", "unit-test"];
    const resp = await main();

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Unknown command"));
    expect(resp).toEqual(1);
  });
});
