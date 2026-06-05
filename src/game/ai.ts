import { Card, RANK_ORDER } from '@/types'
import { isStronger } from './rules'

/**
 * Simple AI strategy.
 *
 * When leading (no leadCard):
 *   Play the strongest card in hand.
 *
 * When responding to leadCard:
 *   1. If holding same-suit cards:
 *      a. If any beat the lead → play the weakest winning card (minimum winning cut).
 *      b. Otherwise → play the weakest same-suit card (forced discard).
 *   2. No same-suit cards → play the weakest card overall (minimize loss).
 */
export function aiChooseCard(hand: Card[], leadCard: Card | null): Card {
  if (hand.length === 0) {
    throw new Error('AI has no cards to play')
  }

  if (!leadCard) {
    // Lead: play strongest card
    return hand.reduce((best, c) =>
      RANK_ORDER[c.rank] < RANK_ORDER[best.rank] ? c : best,
      hand[0],
    )
  }

  const sameSuit = hand.filter((c) => c.suit === leadCard.suit)

  if (sameSuit.length > 0) {
    // Must follow suit
    const canBeat = sameSuit.filter((c) => isStronger(c, leadCard))

    if (canBeat.length > 0) {
      // Cut with the minimum winning card
      return canBeat.reduce((weakest, c) =>
        RANK_ORDER[c.rank] > RANK_ORDER[weakest.rank] ? c : weakest,
        canBeat[0],
      )
    }

    // Cannot beat: discard weakest of same suit
    return sameSuit.reduce((weakest, c) =>
      RANK_ORDER[c.rank] > RANK_ORDER[weakest.rank] ? c : weakest,
      sameSuit[0],
    )
  }

  // No same-suit cards: discard globally weakest card
  return hand.reduce((weakest, c) =>
    RANK_ORDER[c.rank] > RANK_ORDER[weakest.rank] ? c : weakest,
    hand[0],
  )
}
