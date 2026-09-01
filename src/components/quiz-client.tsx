"use client";

import { useState } from "react";
import type { QuestionType } from "@/lib/schemas";

export interface PublicQuestion {
  id: string;
  type: QuestionType;
  question: string;
  choices?: string[];
  answer: string;
  explanation: string;
}

interface QuizClientProps {
  questions: PublicQuestion[];
}

export function QuizClient({ questions }: QuizClientProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, i) => {
        return (
          <div
            key={q.id}
            className="rounded-3xl border-2 border-surface-border bg-surface p-5 shadow-sm"
          >
            <p className="font-display text-sm font-semibold text-muted">
              Question {i + 1}
            </p>
            <p className="mt-1 text-lg">{q.question}</p>

            {q.choices && q.choices.length > 0 ? (
              <fieldset className="mt-3 flex flex-col gap-2">
                <legend className="sr-only">{q.question}</legend>
                {q.choices.map((choice) => (
                  <label
                    key={choice}
                    className="flex items-center gap-3 rounded-2xl border-2 border-surface-border bg-background px-4 py-2.5 has-[:checked]:border-brand has-[:checked]:bg-brand/5"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={choice}
                      checked={answers[q.id] === choice}
                      onChange={() =>
                        setAnswers((a) => ({ ...a, [q.id]: choice }))
                      }
                      className="accent-brand"
                    />
                    <span>{choice}</span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                }
                rows={3}
                aria-label={`Your answer to question ${i + 1}`}
                placeholder="Type your answer…"
                className="mt-3 w-full rounded-2xl border-2 border-surface-border bg-background p-3 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
              />
            )}

            <div className="mt-3">
              <button
                type="button"
                onClick={() =>
                  setRevealed((current) => ({
                    ...current,
                    [q.id]: !current[q.id],
                  }))
                }
                className="text-sm text-muted underline underline-offset-2 hover:text-brand focus-visible:outline-none"
              >
                {revealed[q.id] ? "Hide answer" : "Show answer"}
              </button>
            </div>

            {revealed[q.id] && (
              <div className="mt-4 rounded-2xl bg-brand/5 p-4">
                <p>
                  <span className="font-semibold">Answer:</span> {q.answer}
                </p>
                <p className="mt-1 text-foreground/80">{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
