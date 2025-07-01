import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { usePageHeader } from "./usePageHeader";
import { HeaderConfigProvider } from "components/header/HeaderConfigContext";
import { Header } from "components/header/Header";

// Include Header so we can see the output of setHeaderConfig
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HeaderConfigProvider defaultLowerContent={null}>
    <Header />
    {children}
  </HeaderConfigProvider>
);

describe("usePageHeader hook", () => {
  it("sets header content on mount, updates on rerender, and clears on unmount", async () => {
    const { rerender, unmount } = renderHook(
      ({ content }) => usePageHeader(content),
      {
        initialProps: { content: <div data-testid="header-content">Test Header Content</div> },
        wrapper,
      }
    );

    // Wait for initial header content
    await waitFor(() => {
      expect(document.querySelector("[data-testid='header-content']")?.textContent).toBe(
        "Test Header Content"
      );
    });

    // Rerender with new content
    rerender({ content: <div data-testid="header-content">New Header Content</div> });

    await waitFor(() => {
      expect(document.querySelector("[data-testid='header-content']")?.textContent).toBe(
        "New Header Content"
      );
    });

    // Unmount the hook and verify the header content is cleared
    unmount();

    await waitFor(() => {
      expect(document.querySelector("[data-testid='header-content']")).not.toBeInTheDocument();
    });
  });
});
