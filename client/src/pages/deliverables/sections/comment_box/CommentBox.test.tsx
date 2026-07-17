import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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

const mockUseQuery = vi.fn();
const mockMutate = vi.fn(() => Promise.resolve({ data: {} }));

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    useMutation: vi.fn(() => [mockMutate, { loading: false }]),
  };
});

const TEST_DELIVERABLE_ID = "test-deliverable-id";

type StubComment = {
  id: string;
  content: string;
  createdAt: string;
  authorUser: { person: { fullName: string } };
};

const STUB_PUBLIC_COMMENT: StubComment = {
  id: "comment-1",
  content: "This is a public comment.",
  createdAt: "2026-04-01T10:00:00Z",
  authorUser: { person: { fullName: "Jane Doe" } },
};

const STUB_PRIVATE_COMMENT: StubComment = {
  id: "comment-2",
  content: "This is a private comment.",
  createdAt: "2026-04-02T09:00:00Z",
  authorUser: { person: { fullName: "John Smith" } },
};

const makeQueryResult = (publicComments: StubComment[] = [], privateComments?: StubComment[]) => ({
  data: {
    deliverable: {
      id: TEST_DELIVERABLE_ID,
      publicComments,
      ...(privateComments !== undefined ? { privateComments } : {}),
    },
  },
  loading: false,
  error: undefined,
  refetch: vi.fn(),
});

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
      <CommentBox deliverableId={TEST_DELIVERABLE_ID} />
    </TestProvider>
  );
};

describe("CommentBox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(makeQueryResult());
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

  it("calls the public comment mutation when Add Comment is clicked", async () => {
    renderCommentBox();

    await userEvent.type(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME), "hello world");
    await userEvent.click(screen.getByTestId(ADD_COMMENT_BUTTON_NAME));

    expect(mockMutate).toHaveBeenCalledWith({
      variables: { deliverableId: TEST_DELIVERABLE_ID, comment: "hello world" },
    });
  });

  it("clears the textarea after adding a comment", async () => {
    renderCommentBox();

    await userEvent.type(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME), "hello world");
    await userEvent.click(screen.getByTestId(ADD_COMMENT_BUTTON_NAME));

    await waitFor(() => {
      expect(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME)).toHaveValue("");
    });
  });

  it("does not call the mutation when the textarea is empty", async () => {
    renderCommentBox();

    await userEvent.click(screen.getByTestId(ADD_COMMENT_BUTTON_NAME));

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("does not call the mutation when the textarea contains only whitespace", async () => {
    renderCommentBox();

    await userEvent.type(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME), "   ");
    await userEvent.click(screen.getByTestId(ADD_COMMENT_BUTTON_NAME));

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("state users only see public comments", () => {
    mockUseQuery.mockReturnValue(makeQueryResult([STUB_PUBLIC_COMMENT]));
    renderCommentBox("demos-state-user");
    expect(screen.getByText("This is a public comment.")).toBeInTheDocument();
    expect(screen.queryByText("This is a private comment.")).not.toBeInTheDocument();
  });

  it("admin users see public comments on the Public tab by default", () => {
    mockUseQuery.mockReturnValue(makeQueryResult([STUB_PUBLIC_COMMENT], [STUB_PRIVATE_COMMENT]));
    renderCommentBox("demos-admin");
    expect(screen.getByText("This is a public comment.")).toBeInTheDocument();
    expect(screen.queryByText("This is a private comment.")).not.toBeInTheDocument();
  });

  it("admin users see private comments after switching to the Private tab", async () => {
    mockUseQuery.mockReturnValue(makeQueryResult([STUB_PUBLIC_COMMENT], [STUB_PRIVATE_COMMENT]));
    renderCommentBox("demos-admin");
    await userEvent.click(screen.getByTestId("button-private"));
    expect(screen.queryByText("This is a public comment.")).not.toBeInTheDocument();
    expect(screen.getByText("This is a private comment.")).toBeInTheDocument();
  });

  it("CMS users see private comments after switching to the Private tab", async () => {
    mockUseQuery.mockReturnValue(makeQueryResult([STUB_PUBLIC_COMMENT], [STUB_PRIVATE_COMMENT]));
    renderCommentBox("demos-cms-user");
    await userEvent.click(screen.getByTestId("button-private"));
    expect(screen.queryByText("This is a public comment.")).not.toBeInTheDocument();
    expect(screen.getByText("This is a private comment.")).toBeInTheDocument();
  });

  it("shows 'No comments yet.' when a tab has no comments", async () => {
    mockUseQuery.mockReturnValue(makeQueryResult([STUB_PUBLIC_COMMENT], []));
    renderCommentBox("demos-admin");
    await userEvent.click(screen.getByTestId("button-private"));
    expect(screen.getByText("No comments yet.")).toBeInTheDocument();
  });
});
