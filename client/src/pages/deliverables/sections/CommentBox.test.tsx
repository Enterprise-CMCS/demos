import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COLLAPSE_COMMENTS_BUTTON_NAME, COMMENT_BOX_NAME, COMMENT_BOX_TABS_NAME, COMMENT_BOX_TEXT_AREA_NAME, CommentBox } from "./CommentBox";
import { TestProvider } from "test-utils/TestProvider";
import { developmentMockUser } from "mock-data/userMocks";
import { PersonType } from "demos-server";
import { CurrentUser } from "components/user/UserContext";


const renderCommentBox = (personType?: PersonType) => {
  const currentUser: CurrentUser = {...developmentMockUser, person: { ...developmentMockUser.person, personType: personType || developmentMockUser.person.personType } };
  render(<TestProvider currentUser={currentUser}><CommentBox /></TestProvider>);
};

describe("CommentBox", () => {
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
});
