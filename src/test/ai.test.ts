import { describe, it, expect } from 'vitest'
import { aiChooseCard } from '@/game/ai'
import { makeCard } from '@/game/deck'

describe('aiChooseCard — leading (no leadCard)', () => {
  it('plays the strongest card', () => {
    const hand = [makeCard('♠', '7'), makeCard('♥', '10'), makeCard('♦', 'R')]
    const chosen = aiChooseCard(hand, null)
    expect(chosen.rank).toBe('10')
  })

  it('with single card, plays that card', () => {
    const hand = [makeCard('♠', 'A')]
    expect(aiChooseCard(hand, null)).toEqual(hand[0])
  })
})

describe('aiChooseCard — responding, same suit, can beat', () => {
  it('cuts with minimum winning card', () => {
    // Lead: ♠9. AI has ♠10 (beats) and ♠A (doesn't beat 9 — wait, A rank=2 which is > 1).
    // 10 has order 0, 9 has order 1 — 10 beats 9.
    // A has order 2 — doesn't beat 9.
    // So AI should play ♠10 (weakest winning = highest RANK_ORDER among winners)
    const hand = [makeCard('♠', '10'), makeCard('♠', 'A'), makeCard('♥', '7')]
    const chosen = aiChooseCard(hand, makeCard('♠', '9'))
    expect(chosen.suit).toBe('♠')
    expect(chosen.rank).toBe('10')
  })
})

describe('aiChooseCard — responding, same suit, cannot beat', () => {
  it('discards weakest of same suit', () => {
    // Lead: ♠10 (strongest). AI has ♠7 and ♠8 — neither beats 10.
    // Discard ♠7 (rank order 7, weakest)
    const hand = [makeCard('♠', '7'), makeCard('♠', '8'), makeCard('♥', 'A')]
    const chosen = aiChooseCard(hand, makeCard('♠', '10'))
    expect(chosen.suit).toBe('♠')
    expect(chosen.rank).toBe('7')
  })
})

describe('aiChooseCard — responding, no lead suit', () => {
  it('discards the globally weakest card', () => {
    // No ♠ cards. Discards ♥7 (weakest overall)
    const hand = [makeCard('♥', '7'), makeCard('♦', 'A'), makeCard('♣', '9')]
    const chosen = aiChooseCard(hand, makeCard('♠', '9'))
    expect(chosen.suit).toBe('♥')
    expect(chosen.rank).toBe('7')
  })
})

describe('aiChooseCard — edge cases', () => {
  it('throws when hand is empty', () => {
    expect(() => aiChooseCard([], null)).toThrow()
  })
})
