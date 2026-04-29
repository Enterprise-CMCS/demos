import React, { useState } from "react";

import { MenuCollapseRightIcon } from "components/icons/Navigation/MenuCollapseRightIcon";
import { CommentIcon } from "components/icons";
import { SecondaryButton } from "components/button";
import { getCurrentUser } from "components/user/UserContext";
import { PersonType } from "demos-server";
import { CommentBoxTabs } from "./CommentBoxTabs";
import { CommentBoxTextArea } from "./CommentBoxTextArea";
import { CommentBoxHistory } from "./CommentBoxHistory";
import { CommentBoxComment, CommentVisibility } from "./Comment";

export { CommentVisibility } from "./Comment";
export { COMMENT_BOX_TEXT_AREA_NAME, ADD_COMMENT_BUTTON_NAME } from "./CommentBoxTextArea";

export const COMMENT_BOX_NAME = "comment-box";
export const COLLAPSE_COMMENTS_BUTTON_NAME = "button-collapse-comments";
export const COMMENT_BOX_TABS_NAME = "comment-box-tabs";

const CommentBoxHeader = ({ onCollapse }: { onCollapse: () => void }) => (
  <div className="flex items-center justify-between pb-1 border-b border-gray-dark">
    <div className="flex gap-0-5 justify-center items-center">
      <span className="text-lg font-bold uppercase text-brand">Comments</span>
      <CommentIcon className="text-action" />
    </div>
    <SecondaryButton size="small" name={COLLAPSE_COMMENTS_BUTTON_NAME} data-testid={COLLAPSE_COMMENTS_BUTTON_NAME} onClick={onCollapse} aria-label="Collapse comments">
      <MenuCollapseRightIcon className="w-[20px] h-[20px]" />
    </SecondaryButton>
  </div>
);

export const CommentBox = () => {
  const { currentUser } = getCurrentUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [comments, setComments] = useState<CommentBoxComment[]>([]);
  const [currentComment, setCurrentComment] = useState("");
  const [commentVisibility, setCommentVisibility] = useState<CommentVisibility>("public");

  if (!currentUser) {
    return null;
  }

  const userPersonType: PersonType = currentUser.person.personType;
  const isCmsOrAdminUser = userPersonType === "demos-cms-user" || userPersonType === "demos-admin";

  const addComment = (newComment: CommentBoxComment) => {
    // TODO: Eventually we will replace this with the actual API call to save the comment,
    // and we might want to handle the visibility differently depending on the API design.
    // For now, we are just adding it to the local state with the visibility included.
    console.log("Adding comment:", newComment);
    setComments((prevComments) => [newComment, ...prevComments]);
  };

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
    <div className="flex flex-col gap-1 bg-gray-primary-layout p-1 min-h-full min-w-87.5 max-w-87.5" data-testid={COMMENT_BOX_NAME}>
      <CommentBoxHeader onCollapse={() => setIsCollapsed(true)} />
      {isCmsOrAdminUser && <CommentBoxTabs setCommentVisibility={setCommentVisibility} />}
      <CommentBoxTextArea addComment={addComment} currentComment={currentComment} setCurrentComment={setCurrentComment} commentVisibility={commentVisibility} />
      <CommentBoxHistory comments={comments} />
    </div>
  );
};
