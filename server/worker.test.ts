import { describe, expect, it, vi } from "vitest";
import { narrate } from "./worker";
import { originalStory } from "../src/lib/story";
const req = (body: unknown = { name: "Explorer", difficulty: "medium" }) =>
  new Request("https://plot-twist.test/api/narrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://plot-twist.test",
      "CF-Connecting-IP": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
describe("narrator endpoint", () => {
  it("returns a complete original story without a key", async () => {
    const res = await narrate(req(), {});
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      mode: "original",
      story: originalStory,
    });
  });
  it("never calls a paid model even if misconfigured", async () => {
    const provider = vi.fn();
    await narrate(
      req(),
      { APINEX_API_KEY: "test", APINEX_MODEL: "paid-model" },
      provider,
    );
    expect(provider).not.toHaveBeenCalled();
  });
  it("rejects bad input and cross-origin requests", async () => {
    expect(
      (await narrate(req({ name: "<script>", difficulty: "medium" }), {}))
        .status,
    ).toBe(400);
    const r = req();
    r.headers.set("Origin", "https://other.test");
    expect((await narrate(r, {})).status).toBe(403);
  });
  it("rejects oversized bodies and non-POST methods", async () => {
    expect((await narrate(req({ name: "x".repeat(600) }), {})).status).toBe(
      413,
    );
    expect(
      (await narrate(new Request("https://plot-twist.test/api/narrate"), {}))
        .status,
    ).toBe(405);
  });
  it("validates live responses before using them", async () => {
    const provider = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(originalStory) } }],
          }),
        ),
      );
    const res = await narrate(req(), { APINEX_API_KEY: "test" }, provider);
    expect(((await res.json()) as { mode: string }).mode).toBe("ai");
    const body = JSON.parse(provider.mock.calls[0][1].body);
    expect(body.model.startsWith("free/")).toBe(true);
    expect(body.messages).toHaveLength(2);
  });
  it("uses original narration on invalid JSON or provider failure", async () => {
    const provider = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ choices: [{ message: { content: "not json" } }] }),
        ),
      );
    const res = await narrate(
      req({ name: "Another", difficulty: "easy" }),
      { APINEX_API_KEY: "test" },
      provider,
    );
    expect(((await res.json()) as { mode: string }).mode).toBe("original");
  });
});
