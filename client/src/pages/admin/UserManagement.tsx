import React from "react";
import { UserManagementTable } from "components/table/tables/UserManagementTable";

export const USER_MANAGEMENT_TEST_ID = "user-management";

export const UserManagement: React.FC = () => {
  return (
    <div data-testid={USER_MANAGEMENT_TEST_ID}>
      <UserManagementTable />
    </div>
  );
};
