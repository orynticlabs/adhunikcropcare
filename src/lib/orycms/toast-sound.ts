export function playOryCMSToastSound() {
  if (typeof window === "undefined") return

  const audio = new Audio("/mixkit-correct-answer-tone-2870.wav")
  audio.volume = 0.35
  void audio.play().catch(() => undefined)
}
