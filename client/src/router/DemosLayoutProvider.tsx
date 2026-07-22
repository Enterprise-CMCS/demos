import React from "react";
import { Outlet } from "react-router-dom";
import { PrimaryLayout } from "layout/PrimaryLayout";

export const DemosLayoutProvider = () => (
  <PrimaryLayout>
    <Outlet />
  </PrimaryLayout>
);
