import React, { useState } from "react";

import { MenuCollapseRightIcon } from "components/icons/Navigation/MenuCollapseRightIcon";
import { CommentIcon } from "components/icons";
import { SecondaryButton } from "components/button";
import { CommentBoxTabs } from "./CommentBoxTabs";
import { CommentBoxTextArea } from "./CommentBoxTextArea";
import { CommentBoxHistory } from "./CommentBoxHistory";
import { CommentVisibility } from "./Comment";
import { useComments } from "./useComments";
import { useToast } from "components/toast/ToastContext";

export const COMMENT_BOX_NAME = "comment-box";
export const COLLAPSE_COMMENTS_BUTTON_NAME = "button-collapse-comments";
export const COMMENT_BOX_TABS_NAME = "comment-box-tabs";

const CommentBoxHeader = ({ onCollapse }: { onCollapse: () => void }) => (
  <div className="flex items-center justify-between pb-1 border-b border-gray-dark">
    <div className="flex gap-0-5 justify-center items-center">
      <span className="text-lg font-bold uppercase text-brand">Comments</span>
      <CommentIcon className="text-action" />
    </div>
    <SecondaryButton
      size="small"
      name={COLLAPSE_COMMENTS_BUTTON_NAME}
      data-testid={COLLAPSE_COMMENTS_BUTTON_NAME}
      onClick={onCollapse}
      aria-label="Collapse comments"
    >
      <MenuCollapseRightIcon className="w-[20px] h-[20px]" />
    </SecondaryButton>
  </div>
);

export const CommentBox = ({ deliverableId }: { deliverableId: string }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentComment, setCurrentComment] = useState("");
  const [commentVisibility, setCommentVisibility] = useState<CommentVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showError } = useToast();

  const { isCmsOrAdminUser, visibleComments, addComment } = useComments(
    deliverableId,
    commentVisibility
  );

  const handleAddComment = async (commentText: string) => {
    try {
      setIsSubmitting(true);
      await addComment(commentText);
      setCurrentComment("");
    } catch {
      showError("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
    <div
      className="flex flex-col gap-1 bg-gray-primary-layout p-1 min-h-full min-w-87.5 max-w-87.5"
      data-testid={COMMENT_BOX_NAME}
    >
      <CommentBoxHeader onCollapse={() => setIsCollapsed(true)} />
      {isCmsOrAdminUser && <CommentBoxTabs setCommentVisibility={setCommentVisibility} />}
      <CommentBoxTextArea
        addComment={handleAddComment}
        currentComment={currentComment}
        setCurrentComment={setCurrentComment}
        commentVisibility={commentVisibility}
        isSubmitting={isSubmitting}
      />
      <CommentBoxHistory comments={visibleComments} />
    </div>
  );
};
