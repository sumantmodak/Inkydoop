"use client";

import { useState } from "react";

export interface VocabQuestion {
  word: string;
  answer: string;
  options: string[];
}

interface VocabQuizProps {
  questions: VocabQuestion[];
}

function summaryMessage(score: number, total: number): string {
  if (score === total) return "Amazing! A perfect score!";
  if (score >= total * 0.6) return "Great work! Keep it up!";
  return "Nice try — practice makes perfect!";
}

export function VocabQuiz({ questions }: VocabQuizProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (questions.length === 0) return null;

  const question = questions[index];
  const answered = selected !== null;
  const isCorrect = selected === question.answer;

  function choose(option: string) {
    if (answered) return;
    setSelected(option);
    if (option === question.answer) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= questions.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="rounded-3xl border-2 border-surface-border bg-surface p-6 text-center shadow-sm">
        <p className="font-display text-2xl font-bold text-brand">
          You got {score} of {questions.length}!
        </p>
        <p className="mt-2 text-foreground/80">
          {summaryMessage(score, questions.length)}
        </p>
        <button
          type="button"
          onClick={restart}
          className="font-display mt-5 rounded-full bg-brand px-6 py-2 font-semibold text-white transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
        >
          Play again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border-2 border-surface-border bg-surface p-6 shadow-sm">
      <p className="font-display text-sm font-semibold text-muted">
        Question {index + 1} of {questions.length}
      </p>
      <p className="mt-1 text-lg">
        What does{" "}
        <span className="font-display font-bold text-brand">
          {question.word}
        </span>{" "}
        mean?
      </p>

      <div
        role="group"
        aria-label={`Choices for ${question.word}`}
        className="mt-4 flex flex-col gap-3"
      >
        {question.options.map((option) => {
          const isAnswer = option === question.answer;
          const isPicked = option === selected;
          let tone =
            "border-surface-border bg-background hover:border-brand/50 hover:bg-brand/5";
          if (answered && isAnswer) {
            tone =
              "border-mint bg-mint/15 text-emerald-800 dark:text-emerald-200";
          } else if (answered && isPicked) {
            tone = "border-coral bg-coral/15 text-rose-800 dark:text-rose-200";
          } else if (answered) {
            tone = "border-surface-border bg-background opacity-60";
          }
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              disabled={answered}
              className={`rounded-2xl border-2 px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none ${tone}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-4 min-h-6">
        {answered &&
          (isCorrect ? (
            <p className="font-display font-semibold text-emerald-600 dark:text-emerald-400">
              Great job!
            </p>
          ) : (
            <p className="text-foreground/80">
              Not quite — {question.word} means{" "}
              <span className="font-semibold">{question.answer}</span>
            </p>
          ))}
      </div>

      {answered && (
        <button
          type="button"
          onClick={next}
          className="font-display mt-4 rounded-full bg-brand px-6 py-2 font-semibold text-white transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
        >
          {index + 1 >= questions.length ? "See results" : "Next word"}
        </button>
      )}
    </div>
  );
}
