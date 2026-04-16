import React from "react";

import { IconButton } from "components/button/IconButton";
import { MenuCollapseRightIcon } from "components/icons/Navigation/MenuCollapseRightIcon";
import { Textarea } from "components/input";

export const COMMENT_BOX_NAME = "comment-box";
export const COMMENT_BOX_TEXT_AREA_NAME = "textarea-comment-box";

const CommentBoxHeader = () => (
  <div className="flex items-center justify-between pb-1 border-b border-gray-dark">
    <span className="text-lg font-bold uppercase text-brand">Comments</span>
    <IconButton size={"small"} name="collapse-comments" icon={<MenuCollapseRightIcon width={10} height={10} />} onClick={() => {}} aria-label="Collapse comments" />
  </div>
);

const CommentBoxTextArea = () => {
  return (
    <div className="flex-1">
      <Textarea label="Comments" initialValue="" name={COMMENT_BOX_TEXT_AREA_NAME} onChange={() => {}} />
    </div>
  );
};

const CommentBoxHistory = () => (
  <>
    <span className="font-semibold">Comment History</span>
    <span className="text-sm text-gray-500">No comments yet.</span>
  </>
);

export const CommentBox = () => {
  return (
    <div className="flex flex-col gap-1 bg-gray p-1 min-h-full" data-testid={COMMENT_BOX_NAME}>
      <CommentBoxHeader />
      <CommentBoxTextArea />
      <CommentBoxHistory />
    </div>
  );
};
