import { describe, it, expect } from 'vitest'
import { makeCard, makeDeck, shuffle, deal } from '@/game/deck'
import { SUITS, RANKS } from '@/types'

describe('makeCard', () => {
  it('creates a card with correct suit, rank and id', () => {
    const card = makeCard('♠', '10')
    expect(card.suit).toBe('♠')
    expect(card.rank).toBe('10')
    expect(card.id).toBe('♠10')
  })
})

describe('makeDeck', () => {
  it('produces exactly 32 cards', () => {
    expect(makeDeck()).toHaveLength(32)
  })

  it('contains each combination of suit and rank exactly once', () => {
    const deck = makeDeck()
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const count = deck.filter((c) => c.suit === suit && c.rank === rank).length
        expect(count).toBe(1)
      }
    }
  })

  it('produces cards with unique ids', () => {
    const deck = makeDeck()
    const ids = new Set(deck.map((c) => c.id))
    expect(ids.size).toBe(32)
  })
})

describe('shuffle', () => {
  it('returns same number of cards', () => {
    const deck = makeDeck()
    expect(shuffle(deck)).toHaveLength(32)
  })

  it('does not mutate the original array', () => {
    const deck = makeDeck()
    const original = [...deck]
    shuffle(deck)
    expect(deck).toEqual(original)
  })

  it('contains all the same cards', () => {
    const deck = makeDeck()
    const shuffled = shuffle(deck)
    const deckIds = new Set(deck.map((c) => c.id))
    const shuffledIds = new Set(shuffled.map((c) => c.id))
    expect(shuffledIds).toEqual(deckIds)
  })

  it('usually changes order (may rarely fail by chance)', () => {
    const deck = makeDeck()
    // Run multiple shuffles; at least one should differ
    const results = Array.from({ length: 10 }, () => shuffle(deck).map((c) => c.id).join(','))
    const unique = new Set(results)
    expect(unique.size).toBeGreaterThan(1)
  })
})

describe('deal', () => {
  it('deals 7 cards to player, 7 to AI, 18 in pile', () => {
    const { playerHand, aiHand, drawPile } = deal(makeDeck())
    expect(playerHand).toHaveLength(7)
    expect(aiHand).toHaveLength(7)
    expect(drawPile).toHaveLength(18)
  })

  it('deals 32 unique cards total', () => {
    const { playerHand, aiHand, drawPile } = deal(makeDeck())
    const all = [...playerHand, ...aiHand, ...drawPile]
    const ids = new Set(all.map((c) => c.id))
    expect(ids.size).toBe(32)
  })
})
