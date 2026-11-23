import React from "react";
import { PersonType } from "demos-server";

import { Textarea } from "components/input";
import { Button } from "components/button";
import { getCurrentUser } from "components/user/UserContext";
import { CommentVisibility } from "./Comment";

export const COMMENT_BOX_TEXT_AREA_NAME = "textarea-comment-box";
export const ADD_COMMENT_BUTTON_NAME = "button-add-comment";

const getTextareaLabel = (personType: PersonType, commentVisibility: CommentVisibility) => {
  if (personType === "demos-state-user") return "Comments to CMS";
  return commentVisibility === "public" ? "State Comments" : "CMS Internal Comments";
};

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
  const { currentUser } = getCurrentUser();

  const handleAddComment = () => {
    if (!isSubmitting && currentComment.trim() !== "") {
      addComment(currentComment);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Textarea
        label={getTextareaLabel(currentUser.person.personType, commentVisibility)}
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
