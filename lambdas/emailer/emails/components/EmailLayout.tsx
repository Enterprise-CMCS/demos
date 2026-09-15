import { Body, Container, Head, Html } from "@react-email/components";
import type { ReactNode } from "react";

const bodyStyle = {
  backgroundColor: "#ffffff",
  color: "#111827",
  fontFamily: "Arial, sans-serif",
  margin: "0",
};

const containerStyle = {
  margin: "0 auto",
  maxWidth: "640px",
  padding: "24px",
  width: "100%",
};

export function EmailLayout({ children }: { children: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>{children}</Container>
      </Body>
    </Html>
  );
}
