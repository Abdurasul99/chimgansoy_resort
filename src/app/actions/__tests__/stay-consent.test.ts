import { describe, expect, it } from "vitest";
import { submitStayRequest } from "@/app/actions/stay-request";

function request(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.set(name, value);
  return form;
}

describe("stay request legal consent validation", () => {
  it("glamping rejects a request without personal-data consent", async () => {
    const result = await submitStayRequest(
      {},
      request({
        locale: "en",
        room: "glamping",
        consent: "on",
        offerConsent: "on",
        refundConsent: "on",
      }),
    );

    expect(result).toEqual({ error: expect.stringMatching(/personal data/i) });
  });

  it("chalet rejects a request without cancellation-policy consent", async () => {
    const result = await submitStayRequest(
      {},
      request({
        locale: "en",
        room: "cottage",
        consent: "on",
        offerConsent: "on",
        privacyConsent: "on",
      }),
    );

    expect(result).toEqual({ error: expect.stringMatching(/cancellation/i) });
  });
});
