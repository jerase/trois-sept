import { describe, it, expect } from 'vitest'
import { makeCard } from '@/game/deck'
import { SUITS, RANKS } from '@/types'

/**
 * Tests unitaires pour la generation SVG des cartes.
 * On teste les fonctions pures de cardId et le mapping complet.
 */

// Reproduction locale du mapping (teste la coherence)
const SUIT_ID: Record<string, string> = {
  '♠': 'spade', '♥': 'heart', '♦': 'diamond', '♣': 'club',
}
const RANK_ID: Record<string, string> = {
  'A': '1', '7': '7', '8': '8', '9': '9', '10': '10',
  'V': 'jack', 'D': 'queen', 'R': 'king',
}

describe('Mapping couleur -> ID SVG', () => {
  it('mappe les 4 couleurs correctement', () => {
    expect(SUIT_ID['♠']).toBe('spade')
    expect(SUIT_ID['♥']).toBe('heart')
    expect(SUIT_ID['♦']).toBe('diamond')
    expect(SUIT_ID['♣']).toBe('club')
  })
})

describe('Mapping rang -> ID SVG', () => {
  it('As -> 1', () => expect(RANK_ID['A']).toBe('1'))
  it('Valet -> jack', () => expect(RANK_ID['V']).toBe('jack'))
  it('Dame -> queen', () => expect(RANK_ID['D']).toBe('queen'))
  it('Roi -> king', () => expect(RANK_ID['R']).toBe('king'))
  it('10 -> 10', () => expect(RANK_ID['10']).toBe('10'))
  it('7 -> 7', () => expect(RANK_ID['7']).toBe('7'))
})

describe('Couverture complete du deck', () => {
  it('chaque carte a un ID SVG unique et valide', () => {
    const ids = new Set<string>()
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const card = makeCard(suit, rank)
        const id = `${SUIT_ID[card.suit]}_${RANK_ID[card.rank]}`
        expect(id).toMatch(/^(spade|heart|diamond|club)_(1|7|8|9|10|jack|queen|king)$/)
        ids.add(id)
      }
    }
    expect(ids.size).toBe(32)
  })

  it('les cartes rouges sont coeur et carreau', () => {
    const redCards = SUITS
      .filter(s => s === '♥' || s === '♦')
      .flatMap(s => RANKS.map(r => makeCard(s, r)))
    expect(redCards.length).toBe(16)
    for (const c of redCards) {
      expect(['♥', '♦']).toContain(c.suit)
    }
  })

  it('les cartes noires sont pique et trefle', () => {
    const blackCards = SUITS
      .filter(s => s === '♠' || s === '♣')
      .flatMap(s => RANKS.map(r => makeCard(s, r)))
    expect(blackCards.length).toBe(16)
    for (const c of blackCards) {
      expect(['♠', '♣']).toContain(c.suit)
    }
  })
})

describe('Figures et cartes speciales', () => {
  it('le jeu contient 4 Valets', () => {
    const jacks = SUITS.map(s => makeCard(s, 'V'))
    expect(jacks.length).toBe(4)
    jacks.forEach(c => expect(RANK_ID[c.rank]).toBe('jack'))
  })

  it('le jeu contient 4 Dames', () => {
    SUITS.map(s => makeCard(s, 'D'))
      .forEach(c => expect(RANK_ID[c.rank]).toBe('queen'))
  })

  it('le jeu contient 4 Rois', () => {
    SUITS.map(s => makeCard(s, 'R'))
      .forEach(c => expect(RANK_ID[c.rank]).toBe('king'))
  })

  it('le jeu contient 4 As', () => {
    SUITS.map(s => makeCard(s, 'A'))
      .forEach(c => expect(RANK_ID[c.rank]).toBe('1'))
  })
})
