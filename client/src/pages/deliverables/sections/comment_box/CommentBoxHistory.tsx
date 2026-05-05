import React from "react";

import { Comment, CommentBoxComment } from "./Comment";

export const CommentBoxHistory = ({ comments }: { comments: CommentBoxComment[] }) => (
  <div className="flex flex-col gap-1">
    <span className="font-semibold">Comment History</span>
    {comments.length ? comments.map((comment, index) => (
      <Comment key={index} comment={comment} />
    )) : <span className="text-sm text-text-placeholder italic">No comments yet.</span>
    }
  </div>
);
