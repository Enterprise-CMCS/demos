import React from "react";
import { Body, Container, Head, Html, Preview } from "@react-email/components";

const bodyStyle = {
  backgroundColor: "#ffffff",
  color: "#111827",
  fontFamily: "Arial, sans-serif",
  margin: "0",
};

const containerStyle = {
  margin: "0 auto",
  padding: "24px",
  width: "100%",
  maxWidth: "640px",
};

export function EmailLayout({ preview, children }) {
  return React.createElement(
    Html,
    { lang: "en" },
    React.createElement(Head),
    React.createElement(Preview, null, preview),
    React.createElement(
      Body,
      { style: bodyStyle },
      React.createElement(Container, { style: containerStyle }, children),
    ),
  );
}
