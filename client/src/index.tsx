import React from "react";
import { DemosApp } from "./DemosApp";
import { createRoot } from "react-dom/client";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

import "./public/css/index.css";

function getCspNonce(): string | undefined {
  const meta = document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null;
  // Also support a global if your HTML injector sets it
  // @ts-expect-error - runtime global optionally defined by hosting layer
  const globalNonce = (window && (window as any).__CSP_NONCE__) as string | undefined;
  return meta?.content || globalNonce || undefined;
}

const emotionCache = createCache({ key: "mui", nonce: getCspNonce() });


createRoot(document.querySelector("body")!).render(
  <React.StrictMode>
    <CacheProvider value={emotionCache}>
      <DemosApp />
    </CacheProvider>
  </React.StrictMode>
);
