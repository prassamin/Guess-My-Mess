export const playAudio = (sound: "join" | "leave" | "correct_guess" | "round_start" | "round_end" | "tick") => {
  if (typeof window !== "undefined") {
    const audio = new Audio(`/music/${sound}.mp3`);
    audio.play().catch(e => console.log("Audio play failed:", e));
  }
};
