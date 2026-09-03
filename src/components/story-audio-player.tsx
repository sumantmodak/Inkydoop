"use client";

import { useRef, useState } from "react";

interface StoryAudioPlayerProps {
  blobPath: string;
  title: string;
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

export function StoryAudioPlayer({ blobPath, title }: StoryAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }

  function changePlaybackRate(rate: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    setPlaybackRate(rate);
  }

  return (
    <section
      aria-labelledby="story-audio-heading"
      onContextMenu={(event) => event.preventDefault()}
      className="mx-auto mt-8 max-w-2xl border-l-4 border-brand bg-brand/5 px-4 py-4 sm:px-5"
    >
      <audio
        ref={audioRef}
        preload="metadata"
        aria-label={`Audio narration of ${title}`}
        src={`/api/audio?path=${encodeURIComponent(blobPath)}`}
        controlsList="nodownload noplaybackrate"
        onContextMenu={(event) => event.preventDefault()}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={
            playing ? "Pause story narration" : "Play story narration"
          }
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none"
        >
          {playing ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="currentColor"
            >
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="currentColor"
            >
              <path d="m8 5 11 7-11 7V5z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="min-w-0">
              <p className="font-display text-xs font-bold tracking-wide text-brand uppercase">
                Story narration
              </p>
              <h2
                id="story-audio-heading"
                className="font-display truncate text-sm font-bold sm:text-base"
              >
                Listen to {title}
              </h2>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Seek story narration"
            className="mt-2 h-2 w-full cursor-pointer accent-brand"
          />
        </div>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute story narration" : "Mute story narration"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand hover:bg-brand/10 focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            {muted ? (
              <path d="m16 9 5 5M21 9l-5 5" />
            ) : (
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" />
            )}
          </svg>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-brand/10 pt-3">
        <span className="mr-1 text-xs font-semibold text-muted">Speed</span>
        {PLAYBACK_RATES.map((rate) => (
          <button
            key={rate}
            type="button"
            onClick={() => changePlaybackRate(rate)}
            aria-label={`Set playback speed to ${rate}x`}
            aria-pressed={playbackRate === rate}
            className={`font-display min-h-8 min-w-10 rounded-full px-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none ${
              playbackRate === rate
                ? "bg-brand text-white"
                : "bg-surface text-brand hover:bg-brand/10"
            }`}
          >
            {rate}x
          </button>
        ))}
      </div>
    </section>
  );
}
