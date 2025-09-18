import { PutParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { deleteSecureStrings, storeSecureString } from "./parameters";

jest.mock("@aws-sdk/client-ssm");

describe("parameters", () => {
  test("create proper SecureString parameter", async () => {
    const sendMock = jest.fn().mockResolvedValue({});
    (SSMClient as jest.Mock).mockImplementation(() => ({ send: sendMock }));
    const commandSPy = jest.spyOn(require("@aws-sdk/client-ssm"), "PutParameterCommand");

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
    const sendMock = jest.fn().mockResolvedValue({});
    (SSMClient as jest.Mock).mockImplementation(() => ({ send: sendMock }));
    const commandSPy = jest.spyOn(require("@aws-sdk/client-ssm"), "DeleteParametersCommand");

    await deleteSecureStrings("unit-test", ["myRole", "myRole2"]);

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(commandSPy).toHaveBeenCalledWith(
      expect.objectContaining({
        Names: ["/demos/unit-test/db-temp-password/myRole", "/demos/unit-test/db-temp-password/myRole2"],
      })
    );
  });
});
