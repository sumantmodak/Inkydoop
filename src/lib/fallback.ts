import type { FrontPage, Story, VocabularyItem } from "@/lib/schemas";

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

/** Safe, static story + vocabulary so the story view renders before storage (§6.3). */
export const FALLBACK_STORY: Story = {
  title: "The Lantern in the Attic",
  genre: "adventure",
  theme: "curiosity",
  paragraphs: [
    "Maya climbed the creaky stairs to the attic. Dust floated in the afternoon light like tiny stars.",
    "In the corner, she found an old lantern. Its glass was cracked, but it still felt special.",
    "Maya polished the lantern gently with her sleeve. Slowly, a soft glow appeared inside.",
    "The glow flickered, then steadied, filling the attic with warm golden light.",
    "She carried the lantern downstairs to show her grandmother, who smiled with surprise.",
    "\u201cThat lantern belonged to your great-grandfather,\u201d Grandma said. \u201cHe was a curious explorer, just like you.\u201d",
  ],
  readingTimeMin: 1,
  targetWords: ["attic", "lantern", "polished", "flickered", "curious"],
  artDirection: {
    style: "soft watercolor children's-book illustration, warm golden light",
    characters: [
      { name: "Maya", look: "girl, about 9, curly brown hair, yellow sweater" },
    ],
    setting: "a dusty sunlit attic",
  },
  images: [
    {
      role: "cover",
      afterParagraph: -1,
      alt: "A girl holding a glowing lantern in a dusty attic",
      blobPath: "sample/cover.webp",
    },
    {
      role: "scene",
      afterParagraph: 1,
      alt: "An old cracked lantern resting in a corner",
      blobPath: "sample/scene-1.webp",
    },
    {
      role: "scene",
      afterParagraph: 3,
      alt: "A lantern glowing with warm golden light",
      blobPath: "sample/scene-2.webp",
    },
  ],
};

export const FALLBACK_VOCABULARY: VocabularyItem[] = [
  {
    word: "attic",
    pos: "noun",
    definition: "a room just below the roof of a house",
    exampleFromStory: "Maya climbed the creaky stairs to the attic.",
    synonyms: ["loft"],
    antonyms: ["cellar"],
  },
  {
    word: "lantern",
    pos: "noun",
    definition: "a light inside a case that you can carry",
    exampleFromStory: "In the corner, she found an old lantern.",
    synonyms: ["lamp"],
    antonyms: [],
  },
  {
    word: "polished",
    pos: "verb",
    definition: "rubbed something to make it smooth and shiny",
    exampleFromStory: "Maya polished the lantern gently with her sleeve.",
    synonyms: ["shined", "buffed"],
    antonyms: [],
  },
  {
    word: "flickered",
    pos: "verb",
    definition: "shone with a light that was not steady",
    exampleFromStory: "The glow flickered, then steadied.",
    synonyms: ["flashed"],
    antonyms: [],
  },
  {
    word: "curious",
    pos: "adjective",
    definition: "wanting to learn or know more about something",
    exampleFromStory: "He was a curious explorer, just like you.",
    synonyms: ["inquisitive"],
    antonyms: ["uninterested"],
  },
];
