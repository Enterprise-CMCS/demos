import { CloudFormationCustomResourceEvent, Context } from "aws-lambda";
import { handler } from ".";

import { applyRoleChanges, deleteAllRoles } from "./services/roles";

jest.mock("./services/roles");

const mockContext = {
  invokedFunctionArn: "arn:aws:lambda:region:accountid:function:function-name",
} as Context;

const mockRoles = [
  {
    name: "unit_test",
    memberships: ["demos_read"],
  },
  {
    name: "demos_test",
    memberships: ["demos_write"],
    systemRole: true,
  },
];

describe("handler", () => {
  test("should call the proper handler based on request type", async () => {
    await handler(
      {
        RequestType: "Create",
        ResourceProperties: {
          roles: mockRoles,
          ServiceToken: "mocktoken",
        },
        ServiceToken: "mocktoken",
        ResponseURL: "https://mock.url",
        StackId: "unit-test",
        RequestId: "123-456-789-101112",
        LogicalResourceId: "123",
        ResourceType: "custom",
      } as CloudFormationCustomResourceEvent,
      mockContext
    );

    expect(applyRoleChanges).toHaveBeenCalledTimes(1);
    expect(applyRoleChanges).toHaveBeenCalledWith(mockRoles);

    jest.clearAllMocks();

    await handler(
      {
        RequestType: "Update",
        ResourceProperties: {
          roles: mockRoles,
          ServiceToken: "mocktoken",
        },
        OldResourceProperties: {
          roles: mockRoles,
          ServiceToken: "mocktoken",
        },
        ServiceToken: "mocktoken",
        ResponseURL: "https://mock.url",
        StackId: "unit-test",
        RequestId: "123-456-789-101112",
        LogicalResourceId: "123",
        ResourceType: "custom",
        PhysicalResourceId: "mock",
      } as CloudFormationCustomResourceEvent,
      mockContext
    );

    expect(applyRoleChanges).toHaveBeenCalledTimes(1);
    expect(applyRoleChanges).toHaveBeenCalledWith(mockRoles, mockRoles);

    jest.clearAllMocks();

    await handler(
      {
        RequestType: "Delete",
        ResourceProperties: {
          roles: mockRoles,
          ServiceToken: "mocktoken",
        },
        ServiceToken: "mocktoken",
        ResponseURL: "https://mock.url",
        StackId: "unit-test",
        RequestId: "123-456-789-101112",
        LogicalResourceId: "123",
        ResourceType: "custom",
        PhysicalResourceId: "mock",
      } as CloudFormationCustomResourceEvent,
      mockContext
    );

    expect(deleteAllRoles).toHaveBeenCalledTimes(1);
    expect(deleteAllRoles).toHaveBeenCalledWith(mockRoles);
  });

  test("should throw error if roles are not defined", async () => {
    await expect(
      handler(
        {
          RequestType: "Create",
          ResourceProperties: {
            ServiceToken: "mocktoken",
          },
          ServiceToken: "mocktoken",
          ResponseURL: "https://mock.url",
          StackId: "unit-test",
          RequestId: "123-456-789-101112",
          LogicalResourceId: "123",
          ResourceType: "custom",
        } as CloudFormationCustomResourceEvent,
        mockContext
      )
    ).rejects.toThrow("the array of roles must be defined");
  });

  test("should handle an invalid request type", async () => {
    await expect(
      handler(
        // @ts-expect-error
        {
          RequestType: "invalid",
          ResourceProperties: {
            roles: mockRoles,
            ServiceToken: "mocktoken",
          },
          ServiceToken: "mocktoken",
          ResponseURL: "https://mock.url",
          StackId: "unit-test",
          RequestId: "123-456-789-101112",
          LogicalResourceId: "123",
          ResourceType: "custom",
        } as CloudFormationCustomResourceEvent,
        mockContext
      )
    ).rejects.toThrow("invalid request type: invalid");
  });
});
