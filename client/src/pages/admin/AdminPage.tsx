import React from "react";
import { useSearchParams } from "react-router-dom";
import { ProfileIcon, LabelIcon, LoginIcon } from "components/icons";
import { Tab, VerticalTabs } from "layout/Tabs";
import { UserManagement } from "./UserManagement";
import { TypeTagManagement } from "./TypeTagManagement";
import { LoginHistory } from "./LoginHistory";
import { isTypeTagSelected } from "./useTypeTagSelection";
import { Card } from "components/card/Card";

const TABS = {
  USER_MANAGEMENT: "user-management",
  TYPE_TAG_MANAGEMENT: "type-tag-management",
  LOGIN_HISTORY: "login-history",
};

export const AdminPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  return (
    <Card title="Admin">
      <VerticalTabs
        defaultValue={
          isTypeTagSelected(searchParams) ? TABS.TYPE_TAG_MANAGEMENT : TABS.USER_MANAGEMENT
        }
      >
        <Tab value={TABS.USER_MANAGEMENT} label="User Management" icon={<ProfileIcon />}>
          <UserManagement />
        </Tab>
        <Tab value={TABS.LOGIN_HISTORY} label="Login History" icon={<LoginIcon />}>
          <LoginHistory />
        </Tab>
        <Tab value={TABS.TYPE_TAG_MANAGEMENT} label="Type/Tag Management" icon={<LabelIcon />}>
          <TypeTagManagement />
        </Tab>
      </VerticalTabs>
    </Card>
  );
};
