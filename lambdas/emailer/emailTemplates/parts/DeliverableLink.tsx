import { Link } from "@react-email/components";

export function DeliverableLink({ href }: { href: string }) {
  return (
    <>
      View this deliverable and any required next steps in the DEMOS system: <Link href={href}>{href}</Link>.
    </>
  );
}
