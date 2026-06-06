/**
 * Tests de non-régression — carte mise de côté (règle d'annonce)
 */
import { describe, it, expect } from 'vitest'
import { makeCard } from '@/game/deck'
import { type PlayerState, type Card } from '@/types'

// ── Reproduction des fonctions pures du hook ──────────────────────────────────

function makePlayer(hand: Card[]): PlayerState {
  return { hand, capturedCards: [], score: 0, asideCard: null, awaitingSuit: null }
}

function computeAwaitingSuit(
  leadCard: Card,
  leadBy: 'player' | 'ai',
  responseCard: Card,
): { playerAwaits: string | null; aiAwaits: string | null } {
  const respondBy = leadBy === 'player' ? 'ai' : 'player'
  const defaussed = responseCard.suit !== leadCard.suit
  return {
    playerAwaits: respondBy === 'player' && defaussed ? leadCard.suit : null,
    aiAwaits:     respondBy === 'ai'     && defaussed ? leadCard.suit : null,
  }
}

function drawFor(ps: PlayerState, card: Card): PlayerState {
  if (ps.awaitingSuit && card.suit === ps.awaitingSuit) {
    return { ...ps, asideCard: card, awaitingSuit: null }
  }
  return { ...ps, hand: [...ps.hand, card], awaitingSuit: null }
}

function reintegrateAside(ps: PlayerState): PlayerState {
  if (!ps.asideCard) return ps
  return { ...ps, hand: [...ps.hand, ps.asideCard], asideCard: null }
}

// ── Tests computeAwaitingSuit ─────────────────────────────────────────────────

describe('computeAwaitingSuit', () => {
  it("l'IA doit surveiller la couleur quand elle se défausse", () => {
    const lead     = makeCard('♠', 'D')   // Joueur mène Dame de Pique
    const response = makeCard('♣', '8')  // IA joue Trèfle (pas de Pique)
    const { aiAwaits, playerAwaits } = computeAwaitingSuit(lead, 'player', response)
    expect(aiAwaits).toBe('♠')
    expect(playerAwaits).toBeNull()
  })

  it('le joueur doit surveiller la couleur quand il se défausse', () => {
    const lead     = makeCard('♥', 'R')   // IA mène Roi de Cœur
    const response = makeCard('♦', 'V')  // Joueur joue Carreau (pas de Cœur)
    const { playerAwaits, aiAwaits } = computeAwaitingSuit(lead, 'ai', response)
    expect(playerAwaits).toBe('♥')
    expect(aiAwaits).toBeNull()
  })

  it('aucune surveillance si le répondant a fourni la couleur', () => {
    const lead     = makeCard('♠', '10')
    const response = makeCard('♠', '7')
    const { playerAwaits, aiAwaits } = computeAwaitingSuit(lead, 'player', response)
    expect(playerAwaits).toBeNull()
    expect(aiAwaits).toBeNull()
  })
})

// ── Tests drawFor ─────────────────────────────────────────────────────────────

describe('drawFor — pioche avec awaitingSuit', () => {
  it('met la carte de côté si elle correspond à la couleur surveillée', () => {
    const ps = { ...makePlayer([makeCard('♣', '7')]), awaitingSuit: '♠' as const }
    const drawn = makeCard('♠', '9')
    const result = drawFor(ps, drawn)
    expect(result.asideCard?.id).toBe('♠9')
    expect(result.hand).toHaveLength(1) // main inchangée
    expect(result.awaitingSuit).toBeNull()
  })

  it('met dans la main si la couleur ne correspond pas', () => {
    const ps = { ...makePlayer([makeCard('♣', '7')]), awaitingSuit: '♠' as const }
    const drawn = makeCard('♥', 'A')
    const result = drawFor(ps, drawn)
    expect(result.asideCard).toBeNull()
    expect(result.hand).toHaveLength(2)
    expect(result.awaitingSuit).toBeNull()
  })

  it('met dans la main si pas de couleur surveillée', () => {
    const ps = makePlayer([makeCard('♣', '7')])
    const drawn = makeCard('♠', '10')
    const result = drawFor(ps, drawn)
    expect(result.asideCard).toBeNull()
    expect(result.hand).toHaveLength(2)
  })

  it('efface awaitingSuit même si pas de match', () => {
    const ps = { ...makePlayer([]), awaitingSuit: '♥' as const }
    const drawn = makeCard('♦', '8')
    const result = drawFor(ps, drawn)
    expect(result.awaitingSuit).toBeNull()
  })
})

// ── Tests reintegrateAside ────────────────────────────────────────────────────

describe('reintegrateAside — réintégration au pli suivant', () => {
  it('la carte de côté rejoint la main', () => {
    const aside = makeCard('♠', 'R')
    const ps = { ...makePlayer([makeCard('♣', '8')]), asideCard: aside }
    const result = reintegrateAside(ps)
    expect(result.hand).toHaveLength(2)
    expect(result.hand.some(c => c.id === '♠R')).toBe(true)
    expect(result.asideCard).toBeNull()
  })

  it('ne modifie rien si pas de carte de côté', () => {
    const ps = makePlayer([makeCard('♣', '8'), makeCard('♥', '7')])
    const result = reintegrateAside(ps)
    expect(result.hand).toHaveLength(2)
    expect(result.asideCard).toBeNull()
  })
})

// ── Tests scénarios complets ──────────────────────────────────────────────────

describe('Scénario complet — Exemple 1 (specs)', () => {
  // Joueur A joue Dame de Pique
  // Joueur B (IA) joue 8 de Trèfle (pas de Pique)
  // → IA surveille ♠ à la prochaine pioche
  // Pioche : IA reçoit 9 de Pique → mise de côté
  // Pli suivant : 9 de Pique réintégré dans la main de l'IA

  it('flux complet exemple 1', () => {
    // Pli : joueur mène ♠D, IA répond ♣8
    const { aiAwaits } = computeAwaitingSuit(makeCard('♠', 'D'), 'player', makeCard('♣', '8'))
    expect(aiAwaits).toBe('♠')

    // Pioche : IA reçoit ♠9
    let aiState = { ...makePlayer([makeCard('♥', '7')]), awaitingSuit: aiAwaits as import('@/types').Suit }
    aiState = drawFor(aiState, makeCard('♠', '9'))
    expect(aiState.asideCard?.id).toBe('♠9')
    expect(aiState.hand).toHaveLength(1) // ♥7 toujours là, ♠9 de côté

    // Début pli suivant : réintégration
    aiState = reintegrateAside(aiState)
    expect(aiState.hand).toHaveLength(2)
    expect(aiState.hand.some(c => c.id === '♠9')).toBe(true)
    expect(aiState.asideCard).toBeNull()
  })
})

describe('Scénario complet — Exemple 2 (specs)', () => {
  // Joueur A (IA) joue Roi de Cœur
  // Joueur B (joueur) joue Valet de Carreau (pas de Cœur)
  // → Joueur surveille ♥ à la prochaine pioche
  // Pioche : joueur reçoit As de Cœur → mise de côté
  // Pli suivant : As de Cœur réintégré

  it('flux complet exemple 2', () => {
    const { playerAwaits } = computeAwaitingSuit(makeCard('♥', 'R'), 'ai', makeCard('♦', 'V'))
    expect(playerAwaits).toBe('♥')

    let ps = { ...makePlayer([makeCard('♠', '8'), makeCard('♦', '7')]), awaitingSuit: playerAwaits as import('@/types').Suit }
    ps = drawFor(ps, makeCard('♥', 'A'))
    expect(ps.asideCard?.id).toBe('♥A')
    expect(ps.hand).toHaveLength(2) // ♠8 et ♦7, ♥A de côté

    ps = reintegrateAside(ps)
    expect(ps.hand).toHaveLength(3)
    expect(ps.hand.some(c => c.id === '♥A')).toBe(true)
    expect(ps.asideCard).toBeNull()
  })
})

describe('Cas limites', () => {
  it('pas de mise de côté si la pioche tombe sur une autre couleur', () => {
    const { aiAwaits } = computeAwaitingSuit(makeCard('♠', '10'), 'player', makeCard('♦', '8'))
    let ai = { ...makePlayer([]), awaitingSuit: aiAwaits as import('@/types').Suit }
    ai = drawFor(ai, makeCard('♥', 'R')) // pioche ♥ alors qu'on surveille ♠
    expect(ai.asideCard).toBeNull()
    expect(ai.hand).toHaveLength(1)
  })

  it('pas de surveillance si le répondant n avait pas à défausser (même couleur)', () => {
    const { playerAwaits, aiAwaits } =
      computeAwaitingSuit(makeCard('♣', '9'), 'player', makeCard('♣', 'D'))
    expect(playerAwaits).toBeNull()
    expect(aiAwaits).toBeNull()
  })

  it('une seule carte de côté maximum : la deuxième pioche ne remplace pas', () => {
    // Si asideCard est déjà définie, une nouvelle pioche va en main (awaitingSuit = null)
    const aside = makeCard('♣', 'R')
    let ps = {
      ...makePlayer([]),
      asideCard: aside as import('@/types').Card,
      awaitingSuit: null as import('@/types').Suit | null,
    }
    ps = drawFor(ps, makeCard('♣', '9'))
    // La nouvelle pioche va en main car awaitingSuit est null
    expect(ps.asideCard?.id).toBe('♣R') // inchangée
    expect(ps.hand).toHaveLength(1)      // ♣9 en main
  })
})
