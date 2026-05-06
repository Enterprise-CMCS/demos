import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  COLLAPSE_COMMENTS_BUTTON_NAME,
  COMMENT_BOX_NAME,
  COMMENT_BOX_TABS_NAME,
  COMMENT_BOX_TEXT_AREA_NAME,
  ADD_COMMENT_BUTTON_NAME,
  CommentBox,
} from ".";
import { TestProvider } from "test-utils/TestProvider";
import { developmentMockUser } from "mock-data/userMocks";
import { PersonType } from "demos-server";
import { CurrentUser } from "components/user/UserContext";
import { CommentBoxComment } from "./Comment";
import { getComments } from "./getComments";

vi.mock("./getComments");

const STUB_COMMENTS: CommentBoxComment[] = [
  {
    commentText: "This is a public comment.",
    userFullName: "Jane Doe",
    timestamp: new Date("2026-04-01T10:00:00"),
    commentVisibility: "public",
  },
  {
    commentText: "This is a private comment.",
    userFullName: "John Smith",
    timestamp: new Date("2026-04-02T09:00:00"),
    commentVisibility: "private",
  },
];

const renderCommentBox = (personType?: PersonType) => {
  const currentUser: CurrentUser = {
    ...developmentMockUser,
    person: {
      ...developmentMockUser.person,
      personType: personType || developmentMockUser.person.personType,
    },
  };
  render(
    <TestProvider currentUser={currentUser}>
      <CommentBox />
    </TestProvider>
  );
};

describe("CommentBox", () => {
  beforeEach(() => {
    vi.mocked(getComments).mockReturnValue([]);
  });
  it("renders without crashing", () => {
    renderCommentBox();
    expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument();
  });

  it("shows the full comment box by default", () => {
    renderCommentBox();
    expect(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME)).toBeInTheDocument();
    expect(screen.getByText("Comment History")).toBeInTheDocument();
  });

  it("collapses to a single icon button when the collapse button is clicked", async () => {
    renderCommentBox();

    await userEvent.click(screen.getByTestId(COLLAPSE_COMMENTS_BUTTON_NAME));

    expect(screen.queryByTestId(COMMENT_BOX_TEXT_AREA_NAME)).not.toBeInTheDocument();
    expect(screen.queryByText("Comment History")).not.toBeInTheDocument();
    expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument();
  });

  it("expands back when the collapsed icon button is clicked", async () => {
    renderCommentBox();

    await userEvent.click(screen.getByTestId(COLLAPSE_COMMENTS_BUTTON_NAME));
    await userEvent.click(screen.getByTestId(COMMENT_BOX_NAME));

    expect(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME)).toBeInTheDocument();
    expect(screen.getByText("Comment History")).toBeInTheDocument();
  });

  it("still renders the testid in collapsed state", async () => {
    renderCommentBox();

    await userEvent.click(screen.getByTestId(COLLAPSE_COMMENTS_BUTTON_NAME));

    expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument();
  });

  it("preserves typed comment text after collapsing and expanding", async () => {
    renderCommentBox();

    await userEvent.type(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME), "my draft comment");
    await userEvent.click(screen.getByTestId(COLLAPSE_COMMENTS_BUTTON_NAME));
    await userEvent.click(screen.getByTestId(COMMENT_BOX_NAME));

    expect(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME)).toHaveValue("my draft comment");
  });

  it("renders comment box tabs for Admin users", () => {
    renderCommentBox("demos-admin");
    expect(screen.getByTestId(COMMENT_BOX_TABS_NAME)).toBeInTheDocument();
  });

  it("renders comment box tabs for CMS users", () => {
    renderCommentBox("demos-cms-user");
    expect(screen.getByTestId(COMMENT_BOX_TABS_NAME)).toBeInTheDocument();
  });

  it("does not render comment box tabs for state users", () => {
    renderCommentBox("demos-state-user");
    expect(screen.queryByTestId(COMMENT_BOX_TABS_NAME)).not.toBeInTheDocument();
  });

  it("shows 'No comments yet' when there are no comments", () => {
    renderCommentBox();
    expect(screen.getByText("No comments yet.")).toBeInTheDocument();
  });

  it("adds a comment to the history when Add Comment is clicked", async () => {
    renderCommentBox();

    await userEvent.type(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME), "hello world");
    await userEvent.click(screen.getByTestId(ADD_COMMENT_BUTTON_NAME));

    expect(screen.getByText(/hello world/)).toBeInTheDocument();
  });

  it("clears the textarea after adding a comment", async () => {
    renderCommentBox();

    await userEvent.type(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME), "hello world");
    await userEvent.click(screen.getByTestId(ADD_COMMENT_BUTTON_NAME));

    expect(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME)).toHaveValue("");
  });

  it("does not add a comment when the textarea is empty", async () => {
    renderCommentBox();

    await userEvent.click(screen.getByTestId(ADD_COMMENT_BUTTON_NAME));

    expect(screen.getByText("No comments yet.")).toBeInTheDocument();
  });

  it("does not add a comment when the textarea contains only whitespace", async () => {
    renderCommentBox();

    await userEvent.type(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME), "   ");
    await userEvent.click(screen.getByTestId(ADD_COMMENT_BUTTON_NAME));

    expect(screen.getByText("No comments yet.")).toBeInTheDocument();
  });

  it("state users only see public comments", () => {
    vi.mocked(getComments).mockReturnValue(
      STUB_COMMENTS.filter((c) => c.commentVisibility === "public")
    );
    renderCommentBox("demos-state-user");
    expect(screen.getByText("This is a public comment.")).toBeInTheDocument();
    expect(screen.queryByText("This is a private comment.")).not.toBeInTheDocument();
  });

  it("admin users see public comments on the Public tab by default", () => {
    vi.mocked(getComments).mockReturnValue(STUB_COMMENTS);
    renderCommentBox("demos-admin");
    expect(screen.getByText("This is a public comment.")).toBeInTheDocument();
    expect(screen.queryByText("This is a private comment.")).not.toBeInTheDocument();
  });

  it("admin users see private comments after switching to the Private tab", async () => {
    vi.mocked(getComments).mockReturnValue(STUB_COMMENTS);
    renderCommentBox("demos-admin");
    await userEvent.click(screen.getByTestId("button-private"));
    expect(screen.queryByText("This is a public comment.")).not.toBeInTheDocument();
    expect(screen.getByText("This is a private comment.")).toBeInTheDocument();
  });

  it("CMS users see private comments after switching to the Private tab", async () => {
    vi.mocked(getComments).mockReturnValue(STUB_COMMENTS);
    renderCommentBox("demos-cms-user");
    await userEvent.click(screen.getByTestId("button-private"));
    expect(screen.queryByText("This is a public comment.")).not.toBeInTheDocument();
    expect(screen.getByText("This is a private comment.")).toBeInTheDocument();
  });

  it("shows 'No comments yet.' when a tab has no comments", async () => {
    vi.mocked(getComments).mockReturnValue(
      STUB_COMMENTS.filter((c) => c.commentVisibility === "public")
    );
    renderCommentBox("demos-admin");
    await userEvent.click(screen.getByTestId("button-private"));
    expect(screen.getByText("No comments yet.")).toBeInTheDocument();
  });
});
