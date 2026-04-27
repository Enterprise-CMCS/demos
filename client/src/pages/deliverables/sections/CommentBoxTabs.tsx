import React from "react";

import { HorizontalSectionTabs, Tab } from "layout/Tabs";
import { COMMENT_BOX_TABS_NAME } from "./CommentBox";

const TABS = {
  PUBLIC: "public",
  PRIVATE: "private",
};

export const CommentBoxTabs = () => (
  <div data-testid={COMMENT_BOX_TABS_NAME}>
    <HorizontalSectionTabs defaultValue={TABS.PUBLIC}>
      <Tab label="Public" value={TABS.PUBLIC}>
        <div>Public Comments</div>
      </Tab>
      <Tab label="Private" value={TABS.PRIVATE}>
        <div>Private Comments</div>
      </Tab>
    </HorizontalSectionTabs>
  </div>
);
