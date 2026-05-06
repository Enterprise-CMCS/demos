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
  padding: "24px",
  width: "100%",
  maxWidth: "640px",
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
