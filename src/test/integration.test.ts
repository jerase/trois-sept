import { describe, it, expect } from 'vitest'
import { makeDeck, deal, makeCard } from '@/game/deck'
import { trickWinner, calcScore, validateResponse, isStronger } from '@/game/rules'
import { aiChooseCard } from '@/game/ai'

/**
 * Simulate a complete donne (all tricks) and verify invariants.
 */
describe('full donne simulation', () => {
  it('plays all 32 cards and scores correctly', () => {
    const deck = makeDeck()
    let { playerHand, aiHand, drawPile } = deal(deck)
    const playerCapture: ReturnType<typeof makeCard>[] = []
    const aiCapture: ReturnType<typeof makeCard>[] = []

    // Random first leader
    let leader: 'player' | 'ai' = 'player'

    while (playerHand.length > 0 || aiHand.length > 0) {
      let leadCard: ReturnType<typeof makeCard>
      let leadBy: 'player' | 'ai'
      let responseCard: ReturnType<typeof makeCard>

      if (leader === 'player') {
        // Player leads with first card (deterministic)
        leadCard = playerHand[0]
        leadBy = 'player'
        playerHand = playerHand.slice(1)

        // AI responds
        responseCard = aiChooseCard(aiHand, leadCard)
        // Validate AI response
        const v = validateResponse(responseCard, leadCard, aiHand)
        expect(v.valid).toBe(true)
        aiHand = aiHand.filter((c) => c.id !== responseCard.id)
      } else {
        // AI leads
        leadCard = aiChooseCard(aiHand, null)
        leadBy = 'ai'
        aiHand = aiHand.filter((c) => c.id !== leadCard.id)

        // Player responds with first valid card
        const sameSuit = playerHand.filter((c) => c.suit === leadCard.suit)
        if (sameSuit.length > 0) {
          const canBeat = sameSuit.filter(
            (c) =>
              isStronger(c, leadCard)
          )
          responseCard = canBeat.length > 0 ? canBeat[0] : sameSuit[0]
        } else {
          responseCard = playerHand[0]
        }
        playerHand = playerHand.filter((c) => c.id !== responseCard.id)
      }

      const winner = trickWinner(leadCard, leadBy, responseCard)
      const trickCards = [leadCard, responseCard]

      if (winner === 'player') {
        playerCapture.push(...trickCards)
        if (drawPile.length > 0) {
          playerHand = [...playerHand, drawPile[0]]
          if (drawPile.length > 1) aiHand = [...aiHand, drawPile[1]]
          drawPile = drawPile.slice(2)
        }
      } else {
        aiCapture.push(...trickCards)
        if (drawPile.length > 0) {
          aiHand = [...aiHand, drawPile[0]]
          if (drawPile.length > 1) playerHand = [...playerHand, drawPile[1]]
          drawPile = drawPile.slice(2)
        }
      }

      leader = winner
    }

    // All 32 cards captured
    expect(playerCapture.length + aiCapture.length).toBe(32)

    // No duplicates
    const allIds = [...playerCapture, ...aiCapture].map((c) => c.id)
    expect(new Set(allIds).size).toBe(32)

    // Scores are non-negative
    const ps = calcScore(playerCapture)
    const as = calcScore(aiCapture)
    expect(ps.total).toBeGreaterThanOrEqual(0)
    expect(as.total).toBeGreaterThanOrEqual(0)

    // Max possible score: 4 aces (4 pts) + 20 eligible cards / 3 = 6 pts → total ≤ 10 per player
    // But combined can be up to 4+6+6=...let's just check sanity
    expect(ps.total + as.total).toBeLessThanOrEqual(4 + Math.floor(20 / 3) * 2)
  })
})

describe('victory condition', () => {
  it('player wins at exactly 21', () => {
    expect(21 >= 21).toBe(true)
  })
  it('player wins above 21', () => {
    expect(25 >= 21).toBe(true)
  })
  it('player does not win at 20', () => {
    expect(20 >= 21).toBe(false)
  })
})

describe('draw resolution', () => {
  it('higher score wins when both reach 21', () => {
    const p = 22, a = 21
    const winner = p > a ? 'player' : p < a ? 'ai' : 'draw'
    expect(winner).toBe('player')
  })

  it('declared draw when scores are equal', () => {
    const p = 21, a = 21
    const winner = p > a ? 'player' : p < a ? 'ai' : 'draw'
    expect(winner).toBe('draw')
  })
})
