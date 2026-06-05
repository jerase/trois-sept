import {
  Card,
  Rank,
  RANK_ORDER,
  ELIGIBLE_RANKS,
  PlayerKey,
  ScoreBreakdown,
} from '@/types'

// ── CARD COMPARISON ──────────────────────────────────────────────────────────

/** True if `a` is stronger than `b` (lower index in RANK_ORDER) */
export function isStronger(a: Card, b: Card): boolean {
  return RANK_ORDER[a.rank] < RANK_ORDER[b.rank]
}

/**
 * Determine which player wins the trick.
 *
 * Rules:
 * - Same suit → stronger card wins.
 * - Different suits → lead-suit card wins automatically.
 *
 * @param leadCard   Card played first (by the leader)
 * @param leadBy     Who played the lead card
 * @param responseCard  Card played second
 * @returns 'player' | 'ai'
 */
export function trickWinner(
  leadCard: Card,
  leadBy: PlayerKey,
  responseCard: Card,
): PlayerKey {
  const respondBy: PlayerKey = leadBy === 'player' ? 'ai' : 'player'

  if (leadCard.suit === responseCard.suit) {
    return isStronger(leadCard, responseCard) ? leadBy : respondBy
  }
  // Different suits: lead suit always wins
  return leadBy
}

// ── PLAY VALIDATION ──────────────────────────────────────────────────────────

export type PlayValidation =
  | { valid: true }
  | { valid: false; reason: string }

/**
 * Validate whether a player can legally play `card` in response to `leadCard`.
 *
 * Rules:
 * 1. If the player has any card of the lead suit, they MUST play that suit.
 * 2. Among same-suit cards, if any beat the lead card, the player MUST play
 *    one that beats it (obligation to "couper").
 * 3. If the player has no card of the lead suit, they may play anything.
 */
export function validateResponse(
  card: Card,
  leadCard: Card,
  hand: Card[],
): PlayValidation {
  const sameSuit = hand.filter((c) => c.suit === leadCard.suit)

  if (sameSuit.length > 0) {
    // Must follow suit
    if (card.suit !== leadCard.suit) {
      return {
        valid: false,
        reason: `Vous devez fournir la couleur ${leadCard.suit} (${suitName(leadCard.suit)}).`,
      }
    }

    // Must cut (play a stronger card) if able
    const canBeat = sameSuit.filter((c) => isStronger(c, leadCard))
    if (canBeat.length > 0 && !isStronger(card, leadCard)) {
      return {
        valid: false,
        reason: `Vous devez couper avec une carte plus forte que ${displayRank(leadCard.rank)}${leadCard.suit}.`,
      }
    }
  }
  // No same-suit cards: any card is legal
  return { valid: true }
}

// ── SCORING ──────────────────────────────────────────────────────────────────

/**
 * Calculate the score earned from a set of captured cards.
 *
 * - Each Ace captured = 1 point.
 * - Every complete group of 3 eligible cards (10, 9, R, D, V) = 1 point.
 */
export function calcScore(capturedCards: Card[]): ScoreBreakdown {
  let aces = 0
  let eligibleCards = 0

  for (const c of capturedCards) {
    if (c.rank === 'A') aces++
    if (ELIGIBLE_RANKS.has(c.rank as Rank)) eligibleCards++
  }

  const trioPoints = Math.floor(eligibleCards / 3)
  return {
    aces,
    eligibleCards,
    trioPoints,
    total: aces + trioPoints,
  }
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function suitName(suit: string): string {
  const names: Record<string, string> = {
    '♠': 'Pique',
    '♥': 'Cœur',
    '♦': 'Carreau',
    '♣': 'Trèfle',
  }
  return names[suit] ?? suit
}

export function displayRank(rank: Rank): string {
  return rank
}
