import React from "react";

import { Textarea } from "components/input";
import { Button } from "components/button";
import { getCurrentUser } from "components/user/UserContext";
import { CommentBoxComment, CommentVisibility } from "./Comment";

export const COMMENT_BOX_TEXT_AREA_NAME = "textarea-comment-box";
export const ADD_COMMENT_BUTTON_NAME = "button-add-comment";

export const CommentBoxTextArea = ({ addComment, currentComment, setCurrentComment, commentVisibility }:
  { addComment: (newComment: CommentBoxComment) => void;
    currentComment: string;
    setCurrentComment: (value: string) => void;
    commentVisibility: CommentVisibility;
  }) => {
  const { currentUser } = getCurrentUser();

  if (!currentUser) {
    throw new Error("Current user is required to render CommentBoxTextArea");
  }

  const handleAddComment = () => {
    if (currentComment.trim() !== "") {
      addComment({
        commentText: currentComment,
        userFullName: currentUser.person.fullName,
        timestamp: new Date(),
        commentVisibility,
      });
      setCurrentComment("");
    }
  };

  const textareaLabel = commentVisibility === "public" ? "Comments" : "CMS Internal Comments";

  return (
    <div className="flex-1 flex flex-col gap-1">
      <Textarea label={textareaLabel} value={currentComment} name={COMMENT_BOX_TEXT_AREA_NAME} onChange={setCurrentComment} onEnterPress={handleAddComment} />
      <Button name={ADD_COMMENT_BUTTON_NAME} data-testid={ADD_COMMENT_BUTTON_NAME} onClick={handleAddComment}>Add Comment</Button>
    </div>
  );
};
