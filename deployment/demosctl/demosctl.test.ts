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

jest.mock("./commands/buildClient");
jest.mock("./commands/buildServer");
jest.mock("./commands/getCoreOutputs");
jest.mock("./commands/fullDeploy");
jest.mock("./commands/addCloudfrontRedirect");
jest.mock("./commands/up");
jest.mock("./commands/down");
jest.mock("./commands/runMigration");
jest.mock("./commands/testMigration");

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
    jest.spyOn(process, "exit").mockImplementation(() => "exit");

    process.argv = ["", "", "build:client"];
    main();

    expect(process.exit).toHaveBeenCalled();
  });

  test("should require a stage name", async () => {
    // @ts-expect-error prevent error on invalid mock exit
    jest.spyOn(process, "exit").mockImplementation(() => "exit");
    jest.spyOn(console, "error");

    process.argv = ["", "", "fake-command", "unit-test"];
    main();

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Unknown command"));
    expect(process.exit).toHaveBeenCalled();
  });
});
