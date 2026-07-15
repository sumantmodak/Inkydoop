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
                  ? "rounded font-display font-semibold text-brand underline decoration-dotted decoration-2 underline-offset-2 hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                  : "rounded hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
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
                blobPath={img.blobPath}
                className="h-48 w-full rounded-2xl shadow-sm"
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
            className="animate-pop-in fixed z-20 w-72 rounded-2xl border-2 border-surface-border bg-surface p-4 shadow-xl"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-lg font-bold text-brand">
                {popover.word}
              </span>
              {popover.pos && (
                <span className="text-xs text-muted italic">{popover.pos}</span>
              )}
            </div>
            <p className="mt-1 text-foreground/90" aria-live="polite">
              {popover.loading ? "Looking it up\u2026" : popover.definition}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="font-display mt-3 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}
