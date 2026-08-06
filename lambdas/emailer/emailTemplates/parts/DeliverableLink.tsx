import { Link } from "@react-email/components";

export function DeliverableLink({
  href,
  includeNextSteps = true,
}: {
  href: string;
  includeNextSteps?: boolean;
}) {
  return (
    <>
      {includeNextSteps
        ? "View this deliverable and any required next steps in the DEMOS system: "
        : "View this deliverable in the DEMOS system: "}
      <Link href={href}>{href}</Link>.
    </>
  );
}
