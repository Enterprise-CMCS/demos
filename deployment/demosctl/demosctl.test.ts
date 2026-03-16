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

const expectFunc = (command: string, func: Function, stage: string, additional: any[] = [], empty: boolean = false) => {
  process.argv = ["", "", command, stage, ...additional];
  main();
  if (empty) {
    expect(func).toHaveBeenCalled();
  } else {
    expect(func).toHaveBeenCalledWith(stage, ...additional);
  }
};

describe("demosctl root", () => {
  test("should run the proper commands", async () => {
    const mockStageName = "unit-test";

    expectFunc("build:client", buildClient, mockStageName, [false]);
    expectFunc("build:server", buildServer, mockStageName, [], true);
    expectFunc("deploy:core", getCoreOutputs, mockStageName);
    expectFunc("deploy:all", fullDeploy, mockStageName);
    expectFunc("deploy:add-cloudfront-redirect", addCloudfrontRedirect, mockStageName);
    expectFunc("up", up, mockStageName);
    expectFunc("down", down, mockStageName);
    expectFunc("migrate", runMigration, mockStageName, ["something"]);
    expectFunc("test-migration", testMigration, mockStageName, ["something"]);

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

  test("should require a stage name", async () => {
    // @ts-expect-error prevent error on invalid mock exit
    vi.spyOn(process, "exit").mockImplementation(() => "exit");

    process.argv = ["", "", "build:client"];
    main();

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
