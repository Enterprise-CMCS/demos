import { renderEmail } from "./renderEmail";

it("renders the ticket subject and reference/agreement details in HTML and plain text", async () => {
  const email = await renderEmail("Terms And Conditions Requested", {
    recipients: { to: ["registered@example.test"] },
    reference: { name: "Technical Specifications.pdf" },
    agreement: { name: "Accepted Terms.pdf" },
  });
  expect(email.subject).toBe("CMS DEMOS: National Measure Stewards Terms and Conditions");
  expect(email.to).toEqual(["registered@example.test"]);
  for (const body of [email.text, email.html]) {
    expect(body).toContain("Hello,");
    expect(body).toContain(
      "At your request, we are attaching the National Measure Stewards Terms and Conditions for"
    );
    expect(body).toContain("Technical Specifications.pdf");
    expect(body).toContain("to which you have agreed.");
    expect(body).toContain("Thank you,");
    expect(body).toContain("DEMOS Notifications");
    expect(body.toLowerCase()).toContain("reference material file name:");
    expect(body.toLowerCase()).toContain("associated terms and conditions:");
    expect(body).toContain("Accepted Terms.pdf");
  }
});
