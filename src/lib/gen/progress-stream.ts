export interface ServerSentEvent {
  event: string;
  data: unknown;
}

export async function consumeServerSentEvents(
  response: Response,
  onEvent: (event: ServerSentEvent) => void,
): Promise<void> {
  if (!response.body) throw new Error("Generation response has no stream");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  function consumeBlock(block: string) {
    let event = "message";
    const data: string[] = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
    }
    if (data.length > 0) {
      onEvent({ event, data: JSON.parse(data.join("\n")) });
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";
    blocks.forEach(consumeBlock);
    if (done) break;
  }
  if (buffer.trim()) consumeBlock(buffer);
}
