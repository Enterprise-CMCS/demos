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
        <div className="flex gap-0-5 bg-alt-lightest wrap-break-word p-1 items-center">
          <AlertIcon className="text-alt" />
          <span className="italic">These comments wil be visible to the state</span>
        </div>
      </Tab>
      <Tab label="Private" value={TABS.PRIVATE}>
        <span>{/* Empty because tabs need children */}</span>
      </Tab>
    </HorizontalSectionTabs>
  </div>
);
