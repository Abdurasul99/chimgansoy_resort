import { describe, expect, it, vi } from "vitest";

const { deliverRequest, insertServiceRequest, readOverrides } = vi.hoisted(() => ({
  deliverRequest: vi.fn(async () => ({ telegramOk: true, emailOk: true })),
  insertServiceRequest: vi.fn(async () => 1),
  readOverrides: vi.fn(async () => ({
    customServices: [
      {
        slug: "test-service",
        title: "Test service",
        description: "Test",
        hidden: false,
        formFields: [],
      },
    ],
  })),
}));

vi.mock("@/lib/site-overrides", async (original) => ({
  ...(await original<typeof import("@/lib/site-overrides")>()),
  readOverrides,
}));

vi.mock("@/lib/request-delivery", async (original) => ({
  ...(await original<typeof import("@/lib/request-delivery")>()),
  deliverRequest,
}));

vi.mock("@/lib/db", () => ({ insertServiceRequest }));

import { submitServiceRequest } from "@/app/actions/service-request";

describe("dynamic service request legal consent validation", () => {
  it("rejects a request without personal-data consent", async () => {
    const form = new FormData();
    form.set("locale", "en");
    form.set("slug", "test-service");
    form.set("name", "Alex");
    form.set("phone", "+998901234567");
    form.set("offerConsent", "on");

    const result = await submitServiceRequest({}, form);

    expect(result).toEqual({ error: expect.stringMatching(/personal data/i) });
    expect(deliverRequest).not.toHaveBeenCalled();
    expect(insertServiceRequest).not.toHaveBeenCalled();
  });
});
