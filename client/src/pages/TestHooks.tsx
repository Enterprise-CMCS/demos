import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { useUserOperations } from "../hooks/useUserOperations";
import { userMocks } from "hooks/userMocks";
import { PrimaryButton } from "components/button/PrimaryButton";
import { TextInput } from "components";

const TestUserOperationsHook: React.FC = () => {
  const userOperations = useUserOperations();

  return (
    <div className="p-md flex gap-sm">
      <TextInput label="ID (try initials of spongebob characters)" name="userId"/>
      <PrimaryButton onClick={() => userOperations.getUserById.trigger((document.getElementsByName("userId")[0] as HTMLInputElement).value)}>
        Get User By ID
      </PrimaryButton>
      <PrimaryButton onClick={() => userOperations.getAllUsers.trigger()}>
      Get All Users
      </PrimaryButton>
      <div>
        Get User By ID Response:
        {userOperations.getUserById.data ? (
          <div>
            <pre>{JSON.stringify(userOperations.getUserById.data, null, 2)}</pre>
          </div>
        ) : (
          <div>
            No user found with ID {(document.getElementsByName("userId")[0] as HTMLInputElement)?.value || ""}
          </div>
        )}
      </div>
      <div>
        Get All Users Response:
        {userOperations.getAllUsers.data ? (
          <div>
            <pre>{JSON.stringify(userOperations.getAllUsers.data, null, 2)}</pre>
          </div>
        ) : (
          <div>
            No users found!
          </div>
        )}
      </div>
    </div>
  );
};

export const TestHooks: React.FC = () => (
  <MockedProvider mocks={userMocks} addTypename={false}>
    <TestUserOperationsHook />
  </MockedProvider>
);
