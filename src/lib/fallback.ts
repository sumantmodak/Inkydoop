import type { FrontPage } from "@/lib/schemas";

/** Safe, static front-page content so the page never renders empty (§6.3). */
export const FALLBACK_FRONT_PAGE: FrontPage = {
  wordOfTheDay: {
    word: "curious",
    pos: "adjective",
    pronunciation: "KYOOR-ee-us",
    definition: "wanting to learn or know more about something",
    examples: [
      "The curious kitten peeked inside the open box.",
      "She was curious about how rainbows are made.",
    ],
  },
  interestingSentences: [
    {
      text: "The wind tiptoed through the tall grass.",
      tag: "personification",
    },
    { text: "Waves whispered against the warm sand.", tag: "alliteration" },
    { text: "The city sparkled like a bowl of stars.", tag: "simile" },
    { text: "Morning light spilled across the quiet room.", tag: "imagery" },
  ],
};
