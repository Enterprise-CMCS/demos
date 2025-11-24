import { dbReset } from "./dbReset";

import { runShell } from "../lib/runCommand";
import { getSecret } from "../lib/getSecret";

import path from "path";
import fs from "fs";

jest.mock("../lib/runCommand");
jest.mock("../lib/getSecret");

const mockDBData = {
  username: "test",
  password: "fake", // pragma: allowlist secret
  host: "host",
  port: 1234,
  dbname: "hostDB",
};

jest.mock("@aws-sdk/client-s3", () => {
  const actual = jest.requireActual("@aws-sdk/client-s3");
  return {
    ...actual,
    S3Client: jest.fn(() => ({
      send: jest.fn(async (command) => {
        if (
          command instanceof actual.ListBucketsCommand
        ) {
          return {Buckets: [{Name: "cleanBucket"}]};
        }
        return {};
      }),
    })),
  };
});

describe("runMigration", () => {
  beforeEach(() => {
    jest.spyOn(console, "error");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should successfully make call to reset the database", async () => {
    const mockStageName = "dev";
    const targetDB = "demos";

    const gs = getSecret as jest.Mock;
    const mockDataString = JSON.stringify(mockDBData);
    gs.mockResolvedValueOnce(mockDataString);

    await dbReset(mockStageName);

    expect(runShell).toHaveBeenCalledWith(
      "db-reset",
      "npm ci && npm run seed:reset",
      expect.objectContaining({
        cwd: "../server",
        env: expect.objectContaining({
          DATABASE_URL: `postgresql://${mockDBData.username}:${mockDBData.password}@${mockDBData.host}:${mockDBData.port}/${targetDB}?schema=demos_app`,
          ALLOW_SEED: "true",
        }),
      })
    );
  });

  test("should prevent any env except dev and test", async () => {
    const mockStageNames = ["dev", "test", "impl", "prod", "fake", "unit-test"];

    const gs = getSecret as jest.Mock;
    const mockDataString = JSON.stringify(mockDBData);
    gs.mockResolvedValue(mockDataString);

    const rs = runShell as jest.Mock;
    rs.mockResolvedValue(null);

    const responses = [];

    for (const stage of mockStageNames) {
      responses.push(await dbReset(stage));
    }
    expect(responses.length).toEqual(mockStageNames.length);
    expect(responses).toEqual([null, null, 1, 1, 1, 1]);
  });

  test("should exit with status 1 if failing to get secret", async () => {
    const gs = getSecret as jest.Mock;
    gs.mockResolvedValue(null);

    const exitCode = await dbReset("dev");

    expect(exitCode).toEqual(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("unable to retrieve secret data"));
  });

  test("should exit with status 1 if secret is invalid", async () => {
    const gs = getSecret as jest.Mock;
    gs.mockResolvedValue("{}");

    const exitCode = await dbReset("dev");

    expect(exitCode).toEqual(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("db secret data not found"));
  });

  test("should use proper path if absPath is defined", async () => {
    const gs = getSecret as jest.Mock;
    const mockDataString = JSON.stringify(mockDBData);
    gs.mockResolvedValue(mockDataString);

    const mockPath = "/mock/absolute/path";
    const spyPathResolve = jest.spyOn(path, "resolve").mockImplementation((path) => path);
    const spyPathJoin = jest.spyOn(path, "join");
    jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);

    const exitCode = await dbReset("dev", mockPath);

    expect(exitCode).toEqual(null);
    expect(runShell).toHaveBeenCalled();

    expect(spyPathResolve).toHaveBeenCalledWith(mockPath);
    expect(spyPathJoin).toHaveBeenCalledWith(mockPath, "server");
  });

  test("should exit with status 1 if the absPath doesn't exist", async () => {
    const gs = getSecret as jest.Mock;
    const mockDataString = JSON.stringify(mockDBData);
    gs.mockResolvedValue(mockDataString);

    const mockPath = "/mock/absolute/path";
    jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);

    const exitCode = await dbReset("dev", mockPath);

    expect(exitCode).toEqual(1);
    expect(runShell).not.toHaveBeenCalled();
  });
});
