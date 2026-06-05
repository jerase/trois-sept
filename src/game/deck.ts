import { Card, SUITS, RANKS, Suit, Rank } from '@/types'

/** Create a single card */
export function makeCard(suit: Suit, rank: Rank): Card {
  return { suit, rank, id: `${suit}${rank}` }
}

/** Create a full 32-card deck (4 suits × 8 ranks) */
export function makeDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makeCard(suit, rank))
    }
  }
  return deck
}

/** Fisher-Yates shuffle — returns a new array, does not mutate */
export function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Deal cards for a new donne:
 * - 7 cards to each player
 * - Remaining 18 cards form the draw pile
 */
export function deal(deck: Card[]): {
  playerHand: Card[]
  aiHand: Card[]
  drawPile: Card[]
} {
  const shuffled = shuffle(deck)
  return {
    playerHand: shuffled.slice(0, 7),
    aiHand: shuffled.slice(7, 14),
    drawPile: shuffled.slice(14),
  }
}
