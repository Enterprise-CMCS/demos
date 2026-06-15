import React from "react";

import { Textarea } from "components/input";
import { Button } from "components/button";
import { CommentVisibility } from "./Comment";

export const COMMENT_BOX_TEXT_AREA_NAME = "textarea-comment-box";
export const ADD_COMMENT_BUTTON_NAME = "button-add-comment";

export const CommentBoxTextArea = ({
  addComment,
  currentComment,
  setCurrentComment,
  commentVisibility,
  isSubmitting,
}: {
  addComment: (commentText: string) => void;
  currentComment: string;
  setCurrentComment: (value: string) => void;
  commentVisibility: CommentVisibility;
  isSubmitting: boolean;
}) => {
  const handleAddComment = () => {
    if (!isSubmitting && currentComment.trim() !== "") {
      addComment(currentComment);
    }
  };

  const textareaLabel = commentVisibility === "public" ? "Comments" : "CMS Internal Comments";

  return (
    <div className="flex flex-col gap-1">
      <Textarea
        label={textareaLabel}
        value={currentComment}
        name={COMMENT_BOX_TEXT_AREA_NAME}
        onChange={setCurrentComment}
        onEnterPress={handleAddComment}
      />
      <Button
        name={ADD_COMMENT_BUTTON_NAME}
        data-testid={ADD_COMMENT_BUTTON_NAME}
        onClick={handleAddComment}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Adding Comment... " : "Add Comment"}
      </Button>
    </div>
  );
};
