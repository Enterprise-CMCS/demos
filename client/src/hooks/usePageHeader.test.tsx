import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { usePageHeader } from "./usePageHeader";
import { HeaderConfigProvider, useHeaderConfig } from "components/header/HeaderConfigContext";

// ✅ Tiny header that only renders the content from the context
const TestHeader = () => {
  const { effectiveContent } = useHeaderConfig();
  return <div data-testid="header-slot">{effectiveContent}</div>;
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HeaderConfigProvider defaultLowerContent={null}>
    <TestHeader />
    {children}
  </HeaderConfigProvider>
);

describe("usePageHeader hook", () => {
  it("sets header content on mount, updates on rerender, and clears on unmount", async () => {
    const { rerender, unmount } = renderHook(({ content }) => usePageHeader(content), {
      initialProps: { content: <div data-testid="header-content">Test Header Content</div> },
      wrapper,
    });

    await waitFor(() => {
      expect(document.querySelector("[data-testid='header-content']")?.textContent).toBe(
        "Test Header Content"
      );
    });

    rerender({ content: <div data-testid="header-content">New Header Content</div> });

    await waitFor(() => {
      expect(document.querySelector("[data-testid='header-content']")?.textContent).toBe(
        "New Header Content"
      );
    });

    unmount();

    await waitFor(() => {
      expect(document.querySelector("[data-testid='header-content']")).not.toBeInTheDocument();
    });
  });
});
