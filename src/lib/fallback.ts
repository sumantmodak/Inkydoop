import type {
  DailyPack,
  FrontPage,
  Question,
  Story,
  VocabularyItem,
} from "@/lib/schemas";

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

export const FALLBACK_QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "literal",
    question: "Where did Maya find the lantern?",
    choices: ["In the attic", "In the kitchen", "In the garden", "At school"],
    answer: "In the attic",
    explanation: "Maya climbed the stairs to the attic and found it there.",
    rubric: {
      mustInclude: ["attic"],
      niceToHave: [],
      commonWrongPatterns: ["kitchen", "garden"],
    },
  },
  {
    id: "q2",
    type: "literal",
    question: "What did Maya use to polish the lantern?",
    answer: "her sleeve",
    explanation: "She polished the lantern gently with her sleeve.",
    rubric: {
      mustInclude: ["sleeve"],
      niceToHave: [],
      commonWrongPatterns: ["cloth", "water"],
    },
  },
  {
    id: "q3",
    type: "inferential",
    question: "Why do you think the lantern felt special to Maya?",
    answer:
      "It was old and glowed with a warm light, and it had belonged to her great-grandfather.",
    explanation:
      "The lantern glowed after she polished it, and Grandma said it belonged to her great-grandfather.",
    rubric: {
      mustInclude: ["it glowed or it belonged to her great-grandfather"],
      niceToHave: ["mentions it was old or a family treasure"],
      commonWrongPatterns: ["says it was brand new"],
    },
  },
  {
    id: "q4",
    type: "vocabulary-in-context",
    question: "In the story, what does “flickered” mean?",
    answer: "shone with a light that was not steady",
    explanation: "The glow flickered, then steadied — it wavered at first.",
    rubric: {
      mustInclude: ["unsteady or wavering light"],
      niceToHave: [],
      commonWrongPatterns: ["says it went out completely"],
    },
  },
  {
    id: "q5",
    type: "theme",
    question: "What is the main idea of the story?",
    answer: "Being curious can lead you to wonderful discoveries.",
    explanation:
      "Maya's curiosity led her to explore the attic and discover a family treasure.",
    rubric: {
      mustInclude: ["curiosity leads to discovery"],
      niceToHave: ["mentions exploring or family"],
      commonWrongPatterns: ["says the story is about cleaning"],
    },
  },
];

/** A complete sample pack used when no generated pack exists yet. */
export const FALLBACK_PACK: DailyPack = {
  date: "2026-07-15",
  tier: "growing",
  wordOfTheDay: FALLBACK_FRONT_PAGE.wordOfTheDay,
  interestingSentences: FALLBACK_FRONT_PAGE.interestingSentences,
  story: FALLBACK_STORY,
  vocabulary: FALLBACK_VOCABULARY,
  questions: FALLBACK_QUESTIONS,
};
