import React from "react";

import { HorizontalSectionTabs, Tab } from "layout/Tabs";
import { COMMENT_BOX_TABS_NAME, CommentVisibility } from "./CommentBox";
import { AlertIcon } from "components/icons";

const TABS = {
  PUBLIC: "public",
  PRIVATE: "private",
};

export const CommentBoxTabs = (
  {setCommentVisibility}: {setCommentVisibility: (newCommentVisibility: CommentVisibility) => void}
) => (
  <div data-testid={COMMENT_BOX_TABS_NAME}>
    <HorizontalSectionTabs defaultValue={TABS.PUBLIC} onSelect={(value) => setCommentVisibility(value as CommentVisibility)}>
      <Tab label="Public" value={TABS.PUBLIC}>
        <div className="bg-alt-lightest">
          <AlertIcon /> These comments wil be visible to the state
        </div>
      </Tab>
      <Tab label="Private" value={TABS.PRIVATE}>
        <div>Private Comments</div>
      </Tab>
    </HorizontalSectionTabs>
  </div>
);
