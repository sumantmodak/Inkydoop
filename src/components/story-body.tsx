"use client";

import { useEffect, useRef, useState } from "react";
import type {
  StoryImage as StoryImageType,
  VocabularyItem,
} from "@/lib/schemas";
import { StoryImage } from "@/components/story-image";

interface StoryBodyProps {
  paragraphs: string[];
  images: StoryImageType[];
  vocabulary: VocabularyItem[];
}

interface Popover {
  word: string;
  pos?: string;
  definition?: string;
  loading: boolean;
  top: number;
  left: number;
}

function normalize(word: string): string {
  return word.replace(/[^a-zA-Z']/g, "").toLowerCase();
}

async function lookupWord(word: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const def = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;
    return typeof def === "string" ? def : null;
  } catch {
    return null;
  }
}

export function StoryBody({ paragraphs, images, vocabulary }: StoryBodyProps) {
  const [popover, setPopover] = useState<Popover | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastWord = useRef<HTMLButtonElement | null>(null);

  const vocabMap = new Map(vocabulary.map((v) => [normalize(v.word), v]));

  useEffect(() => {
    if (!popover) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPopover(null);
        lastWord.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popover]);

  function close() {
    setPopover(null);
    lastWord.current?.focus();
  }

  function onWordClick(
    e: React.MouseEvent<HTMLButtonElement>,
    display: string,
  ) {
    const button = e.currentTarget;
    lastWord.current = button;
    const rect = button.getBoundingClientRect();
    const top = rect.bottom + 8;
    const left = Math.min(rect.left, window.innerWidth - 288);
    const key = normalize(display);
    const vocab = vocabMap.get(key);

    if (vocab) {
      setPopover({
        word: vocab.word,
        pos: vocab.pos,
        definition: vocab.definition,
        loading: false,
        top,
        left: Math.max(8, left),
      });
      return;
    }

    setPopover({ word: display, loading: true, top, left: Math.max(8, left) });
    lookupWord(key).then((def) => {
      setPopover((p) =>
        p && normalize(p.word) === key
          ? { ...p, loading: false, definition: def ?? "No definition found." }
          : p,
      );
    });
  }

  function renderParagraph(text: string, pIndex: number) {
    const tokens = text.split(/(\s+)/);
    return (
      <p key={`p-${pIndex}`} className="text-lg leading-relaxed">
        {tokens.map((token, i) => {
          if (/^\s+$/.test(token) || token === "") return token;
          const key = normalize(token);
          const isVocab = key.length > 0 && vocabMap.has(key);
          return (
            <button
              key={i}
              type="button"
              tabIndex={isVocab ? 0 : -1}
              onClick={(e) => onWordClick(e, token)}
              className={
                isVocab
                  ? "rounded font-semibold text-sky-700 underline decoration-dotted underline-offset-2 hover:bg-sky-100 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:text-sky-300 dark:hover:bg-sky-950/50"
                  : "rounded hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:hover:bg-slate-800"
              }
            >
              {token}
            </button>
          );
        })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {paragraphs.map((text, i) => (
        <div key={i} className="flex flex-col gap-5">
          {renderParagraph(text, i)}
          {images
            .filter((img) => img.role === "scene" && img.afterParagraph === i)
            .map((img, j) => (
              <StoryImage
                key={`img-${i}-${j}`}
                alt={img.alt}
                className="h-48 w-full rounded-xl"
              />
            ))}
        </div>
      ))}

      {popover && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={close}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            role="dialog"
            aria-label={`Definition of ${popover.word}`}
            style={{ top: popover.top, left: popover.left }}
            className="fixed z-20 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-lg font-bold">{popover.word}</span>
              {popover.pos && (
                <span className="text-xs text-slate-500 italic dark:text-slate-400">
                  {popover.pos}
                </span>
              )}
            </div>
            <p
              className="mt-1 text-slate-700 dark:text-slate-300"
              aria-live="polite"
            >
              {popover.loading ? "Looking it up\u2026" : popover.definition}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="mt-3 rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}
