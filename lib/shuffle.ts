/**
 * Fisher-Yates shuffle. `array.sort(() => Math.random() - 0.5)` (the
 * previous approach) is NOT a uniform shuffle — engines' sort algorithms
 * make biased comparator-based "shuffles" systematically favor certain
 * orderings, which is why the same choice kept landing in the same
 * position across consecutive questions.
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
