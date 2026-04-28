import React, { useState } from "react";

import { MenuCollapseRightIcon } from "components/icons/Navigation/MenuCollapseRightIcon";
import { Textarea } from "components/input";
import { CommentIcon } from "components/icons";
import { Button, SecondaryButton } from "components/button";
import { getCurrentUser } from "components/user/UserContext";
import { PersonType } from "demos-server";
import { CommentBoxTabs } from "./CommentBoxTabs";
import { format } from "date-fns";

export const COMMENT_BOX_NAME = "comment-box";
export const COMMENT_BOX_TEXT_AREA_NAME = "textarea-comment-box";
export const COLLAPSE_COMMENTS_BUTTON_NAME = "button-collapse-comments";
export const COMMENT_BOX_TABS_NAME = "comment-box-tabs";
export const ADD_COMMENT_BUTTON_NAME = "button-add-comment";

interface CommentBoxComment {
  comment: string;
  userFullName: string;
  timestamp: Date;
  commentVisibility?: CommentVisibility;
}

export type CommentVisibility = "public" | "private";

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

const  CommentBoxTextArea = ({ addComment, currentComment, setCurrentComment }: { addComment: (newComment: CommentBoxComment) => void; currentComment: string; setCurrentComment: (value: string) => void }) => {
  const {currentUser} = getCurrentUser();

  if (!currentUser) {
    throw new Error("Current user is required to render CommentBoxTextArea");
  }

  const handleAddComment = () => {
    if (currentComment.trim() !== "") {
      addComment({
        comment: currentComment,
        userFullName: currentUser.person.fullName,
        timestamp: new Date(),
      });
      setCurrentComment("");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-1">
      <Textarea label="Comments" value={currentComment} name={COMMENT_BOX_TEXT_AREA_NAME} onChange={setCurrentComment} />
      <Button name={ADD_COMMENT_BUTTON_NAME} data-testid={ADD_COMMENT_BUTTON_NAME} onClick={handleAddComment}>Add Comment</Button>
    </div>
  );
};

const Comment = ({ comment }: { comment: CommentBoxComment }) => {
  const formattedDate = format(comment.timestamp, "MM/dd/yyyy, hh:mm:ss a");

  return (
    <div className="p-1 bg-gray-secondary-layout rounded">
      {comment.userFullName} - {formattedDate}
      {comment.comment}
    </div>
  );
};

const CommentBoxHistory = ({comments}: {comments: CommentBoxComment[]}) => (
  <>
    <span className="font-semibold">Comment History</span>
    {comments ? comments.map((comment, index) => (
      <Comment key={index} comment={comment} />
    )) :<span className="text-sm text-gray-500">No comments yet.</span>
    }
  </>
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
    const commentWithVisibility = { ...newComment, commentVisibility };
    // TODO: Eventually we will replace this with the actual API call to save the comment,
    // and we might want to handle the visibility differently depending on the API design.
    // For now, we are just adding it to the local state with the visibility included.
    console.log("Adding comment:", commentWithVisibility);
    setComments((prevComments) => [...prevComments, commentWithVisibility]);
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
    <div className="flex flex-col gap-1 bg-gray-primary-layout p-1 min-h-full min-w-87.5" data-testid={COMMENT_BOX_NAME}>
      <CommentBoxHeader onCollapse={() => setIsCollapsed(true)} />
      {isCmsOrAdminUser && <CommentBoxTabs setCommentVisibility={setCommentVisibility} />}
      <CommentBoxTextArea addComment={addComment} currentComment={currentComment} setCurrentComment={setCurrentComment} />
      <CommentBoxHistory comments={comments} />
    </div>
  );
};
