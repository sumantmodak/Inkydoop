import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StoryAudioPlayer } from "./story-audio-player";

afterEach(cleanup);

describe("StoryAudioPlayer", () => {
  it("renders accessible custom controls for the approved audio route", () => {
    render(
      <StoryAudioPlayer blobPath="pack id/narration.mp3" title="The Lantern" />,
    );

    const audio = screen.getByLabelText("Audio narration of The Lantern");
    expect(audio).toHaveAttribute(
      "src",
      "/api/audio?path=pack%20id%2Fnarration.mp3",
    );
    expect(audio).not.toHaveAttribute("controls");
    expect(audio).toHaveAttribute("controlsList", "nodownload noplaybackrate");
    expect(
      screen.getByRole("button", { name: "Play story narration" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Set playback speed to 1x" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Listen to The Lantern")).toBeInTheDocument();
  });

  it("changes the audio playback rate", () => {
    render(
      <StoryAudioPlayer blobPath="pack/narration.mp3" title="The Lantern" />,
    );
    const audio = screen.getByLabelText(
      "Audio narration of The Lantern",
    ) as HTMLAudioElement;

    fireEvent.click(
      screen.getByRole("button", { name: "Set playback speed to 1.25x" }),
    );

    expect(audio.playbackRate).toBe(1.25);
    expect(
      screen.getByRole("button", { name: "Set playback speed to 1.25x" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
