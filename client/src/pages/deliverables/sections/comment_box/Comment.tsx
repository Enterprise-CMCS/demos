import React from "react";

import { format } from "date-fns";

export type CommentVisibility = "public" | "private";

export interface CommentBoxComment {
  commentText: string;
  userFullName: string;
  timestamp: Date;
  commentVisibility?: CommentVisibility;
}

export const Comment = ({ comment }: { comment: CommentBoxComment }) => {
  const formattedDate = format(comment.timestamp, "MM/dd/yyyy, hh:mm a");

  return (
    <div className="flex flex-col bg-gray-secondary-layout rounded" data-testid="comment">
      <div className="flex justify-between">
        <span className="text-xs font-bold italic">{comment.userFullName}</span>
        <span className="text-xs text-text-placeholder italic">{formattedDate}</span>
      </div>
      <div className="text-sm">{comment.commentText}</div>
    </div>
  );
};
