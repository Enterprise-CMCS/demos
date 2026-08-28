import { Link } from "@react-email/components";

export function DeliverableLink({
  href,
  includeNextSteps = true,
}: {
  href: string;
  includeNextSteps?: boolean;
}) {
  const prompt = includeNextSteps
    ? "View this deliverable and any required next steps in the DEMOS system: "
    : "View this deliverable in the DEMOS system: ";

  return (
    <>
      {prompt}
      <Link href={href}>{href}</Link>.
    </>
  );
}
