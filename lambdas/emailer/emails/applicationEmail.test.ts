import { describe, expect, it } from "vitest";
import { renderEmail } from "./renderEmail";

const basePayload = {
  recipients: { to: [], bcc: [{ name: "CMS Contact", address: "cms@example.com" }] },
  demonstration: { id: "demo-1", name: "Demo title", stateId: "MD" },
  application: {
    id: "app-1",
    name: "Application title",
    applicationTypeId: "Demonstration",
    statusId: "Under Review",
    statusUpdatedAt: "2026-09-15T14:30:00.000Z",
    deemedCompleteDate: "2026-09-15T04:00:00.000Z",
  },
};

describe("application emails", () => {
  for (const applicationTypeId of ["Demonstration", "Amendment", "Extension"]) {
    it.each(["Application Status Updated", "Application Deemed Complete"])(
      `renders %s for ${applicationTypeId}`,
      async (emailType) => {
        const email = await renderEmail(emailType, {
          ...basePayload,
          application: { ...basePayload.application, applicationTypeId },
        });
        expect(email.to).toEqual([]);
        expect(email.bcc).toEqual(basePayload.recipients.bcc);
        expect(email.subject).toBe(
          emailType === "Application Deemed Complete"
            ? "CMS DEMOS: Application Deemed Complete"
            : "CMS DEMOS: Application Status Changed to Under Review"
        );
        expect(email.text).toContain(`Application Type: ${applicationTypeId}`);
        expect(email.text).toContain("Demonstration: Demo title");
        expect(email.text).toContain("State: MD");
        expect(email.text).toContain("Status: Under Review");
        expect(email.html).toContain("/demonstrations/demo-1");
        if (applicationTypeId === "Demonstration") {
          expect(email.text).not.toContain("Application Title:");
        } else {
          expect(email.text).toContain("Application Title: Application title");
          expect(email.html).toContain(
            `${applicationTypeId === "Amendment" ? "amendment" : "renewal"}=app-1`
          );
        }
        expect(email.text).toContain(
          emailType === "Application Deemed Complete"
            ? "Date deemed complete: 2026-09-15"
            : "10:30:00 AM EDT"
        );
      }
    );
  }

  it("reports missing deemed-complete dates", async () => {
    await expect(
      renderEmail("Application Deemed Complete", {
        ...basePayload,
        application: { ...basePayload.application, deemedCompleteDate: undefined },
      })
    ).rejects.toThrow("Missing value for application.deemedCompleteDate");
  });

  it("escapes application titles", async () => {
    const email = await renderEmail("Application Status Updated", {
      ...basePayload,
      application: {
        ...basePayload.application,
        applicationTypeId: "Amendment",
        name: "<script>bad</script>",
      },
    });
    expect(email.html).not.toContain("<script>bad</script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
