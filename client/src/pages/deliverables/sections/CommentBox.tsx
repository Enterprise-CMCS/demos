import React, { useState } from "react";

import { MenuCollapseRightIcon } from "components/icons/Navigation/MenuCollapseRightIcon";
import { Textarea } from "components/input";
import { CommentIcon } from "components/icons";
import { SecondaryButton } from "components/button";
import { getCurrentUser } from "components/user/UserContext";
import { PersonType } from "demos-server";

export const COMMENT_BOX_NAME = "comment-box";
export const COMMENT_BOX_TEXT_AREA_NAME = "textarea-comment-box";
export const COLLAPSE_COMMENTS_BUTTON_NAME = "button-collapse-comments";
export const COMMENT_BOX_TABS_NAME = "comment-box-tabs";

const CommentBoxHeader = ({ onCollapse }: { onCollapse: () => void }) => (
  <div className="flex items-center justify-between pb-1 border-b border-gray-dark">
    <div className="flex gap-0-5 justify-center items-center">
      <span className="text-lg font-bold uppercase text-brand">Comments</span>
      <CommentIcon className="text-action" />
    </div>
    <SecondaryButton size="large" name={COLLAPSE_COMMENTS_BUTTON_NAME} data-testid={COLLAPSE_COMMENTS_BUTTON_NAME} onClick={onCollapse} aria-label="Collapse comments">
      <MenuCollapseRightIcon className="w-[20px] h-[20px]" />
    </SecondaryButton>
  </div>
);

const CommentBoxTextArea = ({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) => {
  return (
    <div className="flex-1">
      <Textarea label="Comments" initialValue={value} name={COMMENT_BOX_TEXT_AREA_NAME} onChange={onChange} />
    </div>
  );
};

const CommentBoxTabs = () => (
  <div data-testid={COMMENT_BOX_TABS_NAME}>
    ONLY CMS / ADMIN USERS CAN SEE THIS
    {/* TODO: implement tab content */}
  </div>
);

const CommentBoxHistory = () => (
  <>
    <span className="font-semibold">Comment History</span>
    <span className="text-sm text-gray-500">No comments yet.</span>
  </>
);

export const CommentBox = () => {
  const { currentUser } = getCurrentUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentComment, setCurrentComment] = useState("");

  if (!currentUser) {
    return null;
  }

  const userPersonType: PersonType = currentUser.person.personType;
  const isCmsOrAdminUser = userPersonType === "demos-cms-user" || userPersonType === "demos-admin";

  if (isCollapsed) {
    return (
      <SecondaryButton
        size="large"
        name={COMMENT_BOX_NAME}
        onClick={() => setIsCollapsed(false)}
        aria-label="Expand comments"
      >
        <CommentIcon className="w-[20px] h-[20px]" />
      </SecondaryButton>
    );
  }

  return (
    <div className="flex flex-col gap-1 bg-gray-primary-layout p-1 min-h-full min-w-[350px]" data-testid={COMMENT_BOX_NAME}>
      <CommentBoxHeader onCollapse={() => setIsCollapsed(true)} />
      {isCmsOrAdminUser && <CommentBoxTabs />}
      <CommentBoxTextArea value={currentComment} onChange={(e) => setCurrentComment(e.target.value)} />
      <CommentBoxHistory />
    </div>
  );
};
