import React from "react";
import { ProfileIcon, LabelIcon } from "components/icons";
import { Tab, VerticalTabs } from "layout/Tabs";
import { UserManagement } from "./UserManagement";
import { TypeTagManagement } from "./TypeTagManagement";

const TABS = {
  USER_MANAGEMENT: "user-management",
  TYPE_TAG_MANAGEMENT: "type-tag-management",
};

export const AdminPage: React.FC = () => {
  return (
    <VerticalTabs defaultValue={TABS.USER_MANAGEMENT}>
      <Tab value={TABS.USER_MANAGEMENT} label="User Management" icon={<ProfileIcon />}>
        <UserManagement />
      </Tab>
      <Tab value={TABS.TYPE_TAG_MANAGEMENT} label="Type/Tag Management" icon={<LabelIcon />}>
        <TypeTagManagement />
      </Tab>
    </VerticalTabs>
  );
};
