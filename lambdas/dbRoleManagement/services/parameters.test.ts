import { PutParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import * as ssm from "@aws-sdk/client-ssm";
import { deleteSecureStrings, storeSecureString } from "./parameters";
import { Mock } from "vitest";

vi.mock("@aws-sdk/client-ssm");

describe("parameters", () => {
  test("create proper SecureString parameter", async () => {
    const sendMock = vi.fn().mockResolvedValue({});
    (SSMClient as Mock).mockImplementation(function() { return { send: sendMock }});
    const commandSPy = vi.spyOn(ssm, "PutParameterCommand");

    await storeSecureString("unit-test", "myRole", "mockSecret");

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(commandSPy).toHaveBeenCalledWith(
      expect.objectContaining({
        Name: "/demos/unit-test/db-temp-password/myRole",
        Value: "mockSecret",
        Type: "SecureString",
      })
    );
  });

  test("delete proper SecureString parameter", async () => {
    const sendMock = vi.fn().mockResolvedValue({});
    (SSMClient as Mock).mockImplementation(function() { return { send: sendMock }});
    const commandSPy = vi.spyOn(ssm, "DeleteParametersCommand");

    await deleteSecureStrings("unit-test", ["myRole", "myRole2"]);

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(commandSPy).toHaveBeenCalledWith(
      expect.objectContaining({
        Names: ["/demos/unit-test/db-temp-password/myRole", "/demos/unit-test/db-temp-password/myRole2"],
      })
    );
  });
});
