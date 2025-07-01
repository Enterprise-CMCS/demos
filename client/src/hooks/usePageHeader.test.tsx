// src/hooks/usePageHeader.test.tsx
import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { usePageHeader } from "./usePageHeader";
import { HeaderConfigProvider } from "components/header/HeaderConfigContext";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HeaderConfigProvider defaultLowerContent={null}>{children}</HeaderConfigProvider>
);

describe("usePageHeader hook", () => {
  it("sets header content on mount and clears on unmount", async () => {
    const { rerender, unmount } = renderHook(
      ({ content }) => usePageHeader(content),
      {
        initialProps: { content: <div>Test Header Content</div> },
        wrapper,
      }
    );

    // Wait for initial header content to appear
    await waitFor(() => {
      expect(document.body.textContent).toContain("Test Header Content");
    });

    // Rerender with new header content
    rerender({ content: <div>New Header Content</div> });

    await waitFor(() => {
      expect(document.body.textContent).toContain("New Header Content");
    });

    // Unmount hook and expect header content to be cleared
    unmount();

    await waitFor(() => {
      expect(document.body.textContent).not.toContain("New Header Content");
    });
  });
});
