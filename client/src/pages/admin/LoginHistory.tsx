import React from "react";
import { LoginHistoryTable } from "components/table/tables/LoginHistoryTable";

export const LOGIN_HISTORY_TEST_ID = "login-history";

export const LoginHistory: React.FC = () => {
  return (
    <div data-testid={LOGIN_HISTORY_TEST_ID}>
      <LoginHistoryTable />
    </div>
  );
};
