import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DemonstrationDetail } from "pages/DemonstrationDetail/index";
import { DemosApolloProvider } from "./DemosApolloProvider";
import { DemosAuthProvider } from "./DemosAuthProvider";
import { UserProvider } from "components/user/UserContext";
import { DemonstrationsPage } from "pages/DemonstrationsPage";
import { ComponentLibrary } from "pages/debug";
import { IconLibrary } from "pages/debug/IconLibrary";
import { EventSandbox } from "pages/debug/EventSandbox";
import { AuthDebugComponent } from "components/auth/AuthDebugComponent";
import { isLocalDevelopment } from "config/env";
import { DemosLayoutProvider } from "./DemosLayoutProvider";
import { RefetchQueriesDemonstration } from "pages/debug/RefetchQueriesDemonstration/RefetchQueriesDemonstration";
import { CacheDemonstration } from "pages/debug/cacheDemonstration/CacheDemonstration";

export const DemosRouter: React.FC = () => {
  return (
    <DemosAuthProvider>
      <DemosApolloProvider>
        <UserProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<DemosLayoutProvider />}>
                <Route path="*" element={<div>404: Page Not Found</div>} />
                <Route path="/" element={<DemonstrationsPage />} />
                <Route path="demonstrations" element={<DemonstrationsPage />} />
                <Route path="demonstrations/:id" element={<DemonstrationDetail />} />

                {isLocalDevelopment() && (
                  <>
                    <Route path="components" element={<ComponentLibrary />} />
                    <Route path="icons" element={<IconLibrary />} />
                    <Route path="events" element={<EventSandbox />} />
                    <Route path="auth" element={<AuthDebugComponent />} />
                    <Route path="refetch-queries" element={<RefetchQueriesDemonstration />} />
                    <Route path="cache-demo" element={<CacheDemonstration />} />
                  </>
                )}
              </Route>
            </Routes>
          </BrowserRouter>
        </UserProvider>
      </DemosApolloProvider>
    </DemosAuthProvider>
  );
};
