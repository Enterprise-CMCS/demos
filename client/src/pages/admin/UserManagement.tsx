import React from "react";

export const USER_MANAGEMENT_TEST_ID = "user-management";

export const UserManagement: React.FC = () => {
  return <div data-testid={USER_MANAGEMENT_TEST_ID}>User Management</div>;
};
