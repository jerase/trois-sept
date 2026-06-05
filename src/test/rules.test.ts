import { describe, it, expect } from 'vitest'
import { isStronger, trickWinner, validateResponse, calcScore } from '@/game/rules'
import { makeCard } from '@/game/deck'

// ── isStronger ────────────────────────────────────────────────────────────────

describe('isStronger', () => {
  it('10 beats 9', () => {
    expect(isStronger(makeCard('♠', '10'), makeCard('♠', '9'))).toBe(true)
  })

  it('9 beats A', () => {
    expect(isStronger(makeCard('♥', '9'), makeCard('♥', 'A'))).toBe(true)
  })

  it('A beats R', () => {
    expect(isStronger(makeCard('♦', 'A'), makeCard('♦', 'R'))).toBe(true)
  })

  it('R beats D', () => {
    expect(isStronger(makeCard('♣', 'R'), makeCard('♣', 'D'))).toBe(true)
  })

  it('D beats V', () => {
    expect(isStronger(makeCard('♠', 'D'), makeCard('♠', 'V'))).toBe(true)
  })

  it('V beats 8', () => {
    expect(isStronger(makeCard('♥', 'V'), makeCard('♥', '8'))).toBe(true)
  })

  it('8 beats 7', () => {
    expect(isStronger(makeCard('♦', '8'), makeCard('♦', '7'))).toBe(true)
  })

  it('7 does NOT beat 10', () => {
    expect(isStronger(makeCard('♠', '7'), makeCard('♠', '10'))).toBe(false)
  })

  it('same rank returns false', () => {
    expect(isStronger(makeCard('♠', 'A'), makeCard('♥', 'A'))).toBe(false)
  })
})

// ── trickWinner ───────────────────────────────────────────────────────────────

describe('trickWinner — same suit', () => {
  it('10 beats 9 (player leads with 10)', () => {
    expect(trickWinner(makeCard('♥', '10'), 'player', makeCard('♥', '9'))).toBe('player')
  })

  it('9 beats A (AI leads with 9)', () => {
    expect(trickWinner(makeCard('♠', '9'), 'ai', makeCard('♠', 'A'))).toBe('ai')
  })

  it('response wins when stronger', () => {
    expect(trickWinner(makeCard('♦', '7'), 'player', makeCard('♦', '10'))).toBe('ai')
  })
})

describe('trickWinner — different suits', () => {
  it('lead suit always wins regardless of rank', () => {
    // Player leads ♠D, AI responds ♥10 — player wins because ♠ is lead suit
    expect(trickWinner(makeCard('♠', 'D'), 'player', makeCard('♥', '10'))).toBe('player')
  })

  it('AI lead suit wins over stronger player card', () => {
    // AI leads ♣7, player responds ♥10 — AI wins because ♣ is lead suit
    expect(trickWinner(makeCard('♣', '7'), 'ai', makeCard('♥', '10'))).toBe('ai')
  })
})

// ── validateResponse ──────────────────────────────────────────────────────────

describe('validateResponse — must follow suit', () => {
  it('valid: player has lead suit and plays it', () => {
    const hand = [makeCard('♠', 'R'), makeCard('♥', '7')]
    const result = validateResponse(makeCard('♠', 'R'), makeCard('♠', '9'), hand)
    expect(result.valid).toBe(true)
  })

  it('invalid: player has lead suit but plays another', () => {
    const hand = [makeCard('♠', 'R'), makeCard('♥', '7')]
    const result = validateResponse(makeCard('♥', '7'), makeCard('♠', '9'), hand)
    expect(result.valid).toBe(false)
    expect((result as { valid: false; reason: string }).reason).toMatch(/♠/)
  })
})

describe('validateResponse — obligation to cut', () => {
  it('valid: player cuts with a stronger card', () => {
    const hand = [makeCard('♠', '10'), makeCard('♠', '7')]
    const result = validateResponse(makeCard('♠', '10'), makeCard('♠', '9'), hand)
    expect(result.valid).toBe(true)
  })

  it('invalid: player can cut but plays weaker same-suit card', () => {
    // Has ♠10 (beats ♠9) but plays ♠7
    const hand = [makeCard('♠', '10'), makeCard('♠', '7')]
    const result = validateResponse(makeCard('♠', '7'), makeCard('♠', '9'), hand)
    expect(result.valid).toBe(false)
    expect((result as { valid: false; reason: string }).reason).toMatch(/couper/)
  })

  it('valid: player cannot cut and plays weakest same-suit card', () => {
    // Lead is ♠10 (strongest), player has only ♠7 — must play it
    const hand = [makeCard('♠', '7')]
    const result = validateResponse(makeCard('♠', '7'), makeCard('♠', '10'), hand)
    expect(result.valid).toBe(true)
  })
})

describe('validateResponse — no lead suit', () => {
  it('valid: any card when no lead-suit card in hand', () => {
    const hand = [makeCard('♥', 'A'), makeCard('♦', '8')]
    const result = validateResponse(makeCard('♥', 'A'), makeCard('♠', '9'), hand)
    expect(result.valid).toBe(true)
  })
})

// ── calcScore ─────────────────────────────────────────────────────────────────

describe('calcScore', () => {
  it('0 captured = 0 points', () => {
    expect(calcScore([])).toEqual({ aces: 0, eligibleCards: 0, trioPoints: 0, total: 0 })
  })

  it('1 As = 1 point', () => {
    const score = calcScore([makeCard('♠', 'A')])
    expect(score.aces).toBe(1)
    expect(score.total).toBe(1)
  })

  it('4 As = 4 points', () => {
    const cards = SUITS.map((s) => makeCard(s, 'A'))
    const score = calcScore(cards)
    expect(score.aces).toBe(4)
    expect(score.trioPoints).toBe(0)
    expect(score.total).toBe(4)
  })

  it('3 eligible cards = 1 trio point', () => {
    const cards = [makeCard('♠', '10'), makeCard('♥', '9'), makeCard('♦', 'R')]
    const score = calcScore(cards)
    expect(score.eligibleCards).toBe(3)
    expect(score.trioPoints).toBe(1)
    expect(score.total).toBe(1)
  })

  it('8 eligible cards = 2 trio points (8÷3=2)', () => {
    const cards = [
      makeCard('♠', '10'), makeCard('♥', '10'),
      makeCard('♦', '9'), makeCard('♣', '9'),
      makeCard('♠', 'R'), makeCard('♥', 'R'),
      makeCard('♦', 'D'), makeCard('♣', 'D'),
    ]
    const score = calcScore(cards)
    expect(score.eligibleCards).toBe(8)
    expect(score.trioPoints).toBe(2)
  })

  it('spec example: 2 As + 8 eligible = 4 points', () => {
    const cards = [
      makeCard('♠', 'A'), makeCard('♥', 'A'),
      makeCard('♦', '10'), makeCard('♣', '10'),
      makeCard('♠', '9'), makeCard('♥', '9'),
      makeCard('♦', 'R'), makeCard('♣', 'R'),
      makeCard('♠', 'D'), makeCard('♥', 'D'),
    ]
    const score = calcScore(cards)
    expect(score.aces).toBe(2)
    expect(score.eligibleCards).toBe(8)
    expect(score.trioPoints).toBe(2)
    expect(score.total).toBe(4)
  })

  it('8 and 7 never contribute to score', () => {
    const cards = [
      makeCard('♠', '8'), makeCard('♥', '8'), makeCard('♦', '8'), makeCard('♣', '8'),
      makeCard('♠', '7'), makeCard('♥', '7'), makeCard('♦', '7'), makeCard('♣', '7'),
    ]
    const score = calcScore(cards)
    expect(score.total).toBe(0)
    expect(score.eligibleCards).toBe(0)
  })
})

// Helper: all suits
const SUITS = ['♠', '♥', '♦', '♣'] as const
