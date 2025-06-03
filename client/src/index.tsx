import React from "react";
import { DemosApp } from "./DemosApp";
import { createRoot } from "react-dom/client";

import "./public/css/index.css";


createRoot(document.querySelector("body")!).render(
  <React.StrictMode>
    <DemosApp />
  </React.StrictMode>
);
