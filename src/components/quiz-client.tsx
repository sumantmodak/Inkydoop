"use client";

import { useState } from "react";
import type { Grade, GradeResult, QuestionType } from "@/lib/schemas";

export interface PublicQuestion {
  id: string;
  type: QuestionType;
  question: string;
  choices?: string[];
  answer: string;
  explanation: string;
}

const GRADE_BADGE: Record<Grade, { label: string; cls: string }> = {
  nailed_it: {
    label: "Nailed it!",
    cls: "bg-mint/25 text-emerald-800 dark:text-emerald-200",
  },
  almost: {
    label: "Almost!",
    cls: "bg-sunny/30 text-amber-800 dark:text-amber-200",
  },
  lets_look_again: {
    label: "Let's look again",
    cls: "bg-coral/25 text-rose-800 dark:text-rose-200",
  },
};

interface QuizClientProps {
  questions: PublicQuestion[];
  date: string;
}

export function QuizClient({ questions, date }: QuizClientProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, GradeResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  async function check(q: PublicQuestion) {
    const answer = (answers[q.id] ?? "").trim();
    if (!answer || loading[q.id]) return;
    setLoading((l) => ({ ...l, [q.id]: true }));
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, answer, date }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults((r) => ({ ...r, [q.id]: data as GradeResult }));
      }
    } finally {
      setLoading((l) => ({ ...l, [q.id]: false }));
    }
  }

  const gradedCount = Object.keys(results).length;
  const nailedCount = Object.values(results).filter(
    (r) => r.grade === "nailed_it",
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, i) => {
        const result = results[q.id];
        const showAnswer = revealed[q.id] || Boolean(result);
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

            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                onClick={() => check(q)}
                disabled={loading[q.id] || !(answers[q.id] ?? "").trim()}
                className="font-display rounded-full bg-brand px-5 py-2 font-semibold text-white transition-transform enabled:hover:scale-105 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
              >
                {loading[q.id] ? "Checking…" : "Check"}
              </button>
              {!result && (
                <button
                  type="button"
                  onClick={() =>
                    setRevealed((rv) => ({ ...rv, [q.id]: !rv[q.id] }))
                  }
                  className="text-sm text-muted underline underline-offset-2 hover:text-brand focus-visible:outline-none"
                >
                  {revealed[q.id] ? "Hide answer" : "Show answer"}
                </button>
              )}
            </div>

            <div aria-live="polite">
              {result && (
                <div className="mt-4">
                  <span
                    className={`font-display inline-block rounded-full px-3 py-1 text-sm font-semibold ${GRADE_BADGE[result.grade].cls}`}
                  >
                    {GRADE_BADGE[result.grade].label}
                  </span>
                  <p className="mt-2 text-foreground/90">{result.feedback}</p>
                </div>
              )}
            </div>

            {showAnswer && (
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

      {gradedCount === questions.length && questions.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-brand to-grape p-6 text-center text-white shadow-md">
          <p className="font-display text-2xl font-bold">
            You nailed {nailedCount} of {questions.length}!
          </p>
          <p className="mt-1 text-white/85">Wonderful reading today.</p>
        </div>
      )}
    </div>
  );
}
