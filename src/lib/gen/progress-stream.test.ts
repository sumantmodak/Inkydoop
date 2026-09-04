/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { consumeServerSentEvents } from "./progress-stream";

describe("consumeServerSentEvents", () => {
  it("parses typed events split across response chunks", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: {"stage":"story","status":"active"}\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            '\nevent: result\ndata: {"ok":true,"id":"pack-id"}\n\n',
          ),
        );
        controller.close();
      },
    });
    const events: { event: string; data: unknown }[] = [];

    await consumeServerSentEvents(new Response(stream), (event) =>
      events.push(event),
    );

    expect(events).toEqual([
      {
        event: "progress",
        data: { stage: "story", status: "active" },
      },
      { event: "result", data: { ok: true, id: "pack-id" } },
    ]);
  });
});
