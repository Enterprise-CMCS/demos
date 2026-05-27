import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";

import { getCurrentUser } from "components/user/UserContext";
import { PersonType } from "demos-server";
import { developmentMockUser } from "mock-data/userMocks";
import { useComments, GET_PUBLIC_COMMENTS_QUERY, GET_PRIVATE_COMMENTS_QUERY } from "./useComments";

const mockRefetchPublic = vi.fn();
const mockRefetchPrivate = vi.fn();
const mockMutate = vi.fn(() => Promise.resolve({ data: {} }));
const mockShowError = vi.fn();
const mockUseQuery = vi.fn();

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    useMutation: vi.fn(() => [mockMutate, { loading: false }]),
  };
});

vi.mock("components/user/UserContext", async () => {
  const actual = await vi.importActual("components/user/UserContext");
  return { ...actual, getCurrentUser: vi.fn() };
});

vi.mock("components/toast", async () => {
  const actual = await vi.importActual("components/toast");
  return { ...actual, useToast: vi.fn(() => ({ showError: mockShowError })) };
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

const setCurrentUserPersonType = (personType: PersonType) => {
  (getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({
    currentUser: {
      ...developmentMockUser,
      person: { ...developmentMockUser.person, personType },
    },
  });
};

const setupQueryMocks = (
  publicComments: StubComment[] = [],
  privateComments: StubComment[] = []
) => {
  mockUseQuery.mockImplementation((query: unknown) => {
    if (query === GET_PUBLIC_COMMENTS_QUERY) {
      return {
        data: { deliverable: { id: TEST_DELIVERABLE_ID, publicComments } },
        refetch: mockRefetchPublic,
      };
    }
    return {
      data: { deliverable: { id: TEST_DELIVERABLE_ID, privateComments } },
      refetch: mockRefetchPrivate,
    };
  });
};

describe("useComments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCurrentUserPersonType("demos-admin");
    setupQueryMocks();
  });

  describe("isCmsOrAdminUser", () => {
    it("returns true for admin users", () => {
      setCurrentUserPersonType("demos-admin");
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      expect(result.current.isCmsOrAdminUser).toBe(true);
    });

    it("returns true for CMS users", () => {
      setCurrentUserPersonType("demos-cms-user");
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      expect(result.current.isCmsOrAdminUser).toBe(true);
    });

    it("returns false for state users", () => {
      setCurrentUserPersonType("demos-state-user");
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      expect(result.current.isCmsOrAdminUser).toBe(false);
    });
  });

  describe("visibleComments", () => {
    it("returns public comments when visibility is 'public'", () => {
      setupQueryMocks([STUB_PUBLIC_COMMENT], [STUB_PRIVATE_COMMENT]);
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      expect(result.current.visibleComments).toHaveLength(1);
      expect(result.current.visibleComments[0].commentText).toBe("This is a public comment.");
      expect(result.current.visibleComments[0].commentVisibility).toBe("public");
    });

    it("returns private comments when visibility is 'private'", () => {
      setupQueryMocks([STUB_PUBLIC_COMMENT], [STUB_PRIVATE_COMMENT]);
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "private"));
      expect(result.current.visibleComments).toHaveLength(1);
      expect(result.current.visibleComments[0].commentText).toBe("This is a private comment.");
      expect(result.current.visibleComments[0].commentVisibility).toBe("private");
    });

    it("returns an empty list when there are no comments", () => {
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      expect(result.current.visibleComments).toEqual([]);
    });

    it("maps comment fields correctly", () => {
      setupQueryMocks([STUB_PUBLIC_COMMENT]);
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      const comment = result.current.visibleComments[0];
      expect(comment.commentText).toBe("This is a public comment.");
      expect(comment.userFullName).toBe("Jane Doe");
      expect(comment.timestamp).toEqual(new Date("2026-04-01T10:00:00Z"));
    });
  });

  describe("query skipping", () => {
    it("skips the private query for state users", () => {
      setCurrentUserPersonType("demos-state-user");
      renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      const [, options] = mockUseQuery.mock.calls.find(([q]) => q === GET_PRIVATE_COMMENTS_QUERY)!;
      expect(options.skip).toBe(true);
    });

    it("does not skip the private query for admin users", () => {
      setCurrentUserPersonType("demos-admin");
      renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      const [, options] = mockUseQuery.mock.calls.find(([q]) => q === GET_PRIVATE_COMMENTS_QUERY)!;
      expect(options.skip).toBe(false);
    });

    it("does not skip the private query for CMS users", () => {
      setCurrentUserPersonType("demos-cms-user");
      renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      const [, options] = mockUseQuery.mock.calls.find(([q]) => q === GET_PRIVATE_COMMENTS_QUERY)!;
      expect(options.skip).toBe(false);
    });
  });

  describe("addComment", () => {
    it("calls the public mutation with the correct variables", async () => {
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      await act(async () => result.current.addComment("hello world"));
      expect(mockMutate).toHaveBeenCalledWith({
        variables: { deliverableId: TEST_DELIVERABLE_ID, comment: "hello world" },
      });
    });

    it("refetches public comments after a public comment is added", async () => {
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      await act(async () => result.current.addComment("hello world"));
      expect(mockRefetchPublic).toHaveBeenCalled();
      expect(mockRefetchPrivate).not.toHaveBeenCalled();
    });

    it("calls the private mutation with the correct variables", async () => {
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "private"));
      await act(async () => result.current.addComment("internal note"));
      expect(mockMutate).toHaveBeenCalledWith({
        variables: { deliverableId: TEST_DELIVERABLE_ID, comment: "internal note" },
      });
    });

    it("refetches private comments after a private comment is added", async () => {
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "private"));
      await act(async () => result.current.addComment("internal note"));
      expect(mockRefetchPrivate).toHaveBeenCalled();
      expect(mockRefetchPublic).not.toHaveBeenCalled();
    });

    it("shows an error toast when the mutation fails", async () => {
      mockMutate.mockRejectedValueOnce(new Error("Network error"));
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      await expect(act(async () => result.current.addComment("hello"))).rejects.toThrow();
      expect(mockShowError).toHaveBeenCalledWith("Failed to add comment. Please try again.");
    });

    it("re-throws after showing the error toast", async () => {
      mockMutate.mockRejectedValueOnce(new Error("Network error"));
      const { result } = renderHook(() => useComments(TEST_DELIVERABLE_ID, "public"));
      await expect(act(async () => result.current.addComment("hello"))).rejects.toThrow(
        "Failed to add comment"
      );
    });
  });
});
