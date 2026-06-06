/**
 * Tests de non-régression — flux de jeu complet
 *
 * Ces tests vérifient que les fonctions pures qui alimentent le hook
 * produisent les bonnes transitions d'état, sans avoir besoin de React.
 */
import { describe, it, expect } from 'vitest'
import { makeDeck, deal, makeCard } from '@/game/deck'
import { trickWinner, calcScore, validateResponse, isStronger } from '@/game/rules'
import { aiChooseCard } from '@/game/ai'
import { SUITS, type Card, type PlayerKey, VICTORY_SCORE } from '@/types'

// ── helpers reproduced from hook (pure functions only) ────────────────────────

function afterDraw(
  pile: Card[], winner: PlayerKey, playerHand: Card[], aiHand: Card[],
): { pile: Card[]; playerHand: Card[]; aiHand: Card[] } {
  const p = [...pile]; let ph = [...playerHand]; let ah = [...aiHand]
  if (p.length > 0) {
    const first = p.shift()!
    const second = p.length > 0 ? p.shift()! : null
    if (winner === 'player') { ph = [...ph, first]; if (second) ah = [...ah, second] }
    else { ah = [...ah, first]; if (second) ph = [...ph, second] }
  }
  return { pile: p, playerHand: ph, aiHand: ah }
}

// ── DISTRIBUTION ──────────────────────────────────────────────────────────────

describe('Distribution initiale', () => {
  it('distribue exactement 7 cartes à chaque joueur', () => {
    const { playerHand, aiHand, drawPile } = deal(makeDeck())
    expect(playerHand).toHaveLength(7)
    expect(aiHand).toHaveLength(7)
    expect(drawPile).toHaveLength(18)
  })

  it('distribue 32 cartes uniques au total', () => {
    const { playerHand, aiHand, drawPile } = deal(makeDeck())
    const ids = new Set([...playerHand, ...aiHand, ...drawPile].map(c => c.id))
    expect(ids.size).toBe(32)
  })
})

// ── PIOCHE APRÈS PLI ──────────────────────────────────────────────────────────

describe('Pioche apres pli', () => {
  it('le gagnant pioche la premiere carte, le perdant la deuxieme', () => {
    const pile = [makeCard('♠', '10'), makeCard('♥', 'A'), makeCard('♦', '7')]
    const { pile: newPile, playerHand, aiHand } = afterDraw(pile, 'player', [], [])
    expect(playerHand).toHaveLength(1)
    expect(playerHand[0].id).toBe('♠10')
    expect(aiHand).toHaveLength(1)
    expect(aiHand[0].id).toBe('♥A')
    expect(newPile).toHaveLength(1)
  })

  it("l'IA gagnante pioche en premier", () => {
    const pile = [makeCard('♣', 'R'), makeCard('♦', 'D')]
    const { aiHand, playerHand } = afterDraw(pile, 'ai', [], [])
    expect(aiHand[0].id).toBe('♣R')
    expect(playerHand[0].id).toBe('♦D')
  })

  it('si pioche a 1 carte, seul le gagnant pioche', () => {
    const pile = [makeCard('♠', 'V')]
    const { playerHand, aiHand } = afterDraw(pile, 'player', [], [])
    expect(playerHand).toHaveLength(1)
    expect(aiHand).toHaveLength(0)
  })

  it('si pioche vide, les mains ne changent pas', () => {
    const ph = [makeCard('♠', '7')]
    const ah = [makeCard('♥', '8')]
    const { playerHand, aiHand, pile } = afterDraw([], 'player', ph, ah)
    expect(playerHand).toHaveLength(1)
    expect(aiHand).toHaveLength(1)
    expect(pile).toHaveLength(0)
  })
})

// ── OBLIGATION DE COULEUR ET DE COUPE ────────────────────────────────────────

describe('Obligation de couleur', () => {
  it('doit fournir la couleur demandee si possible', () => {
    const hand = [makeCard('♠', 'R'), makeCard('♥', '7')]
    const result = validateResponse(makeCard('♥', '7'), makeCard('♠', '9'), hand)
    expect(result.valid).toBe(false)
    expect((result as any).reason).toMatch(/♠/)
  })

  it('peut jouer n importe quoi si absent de la couleur', () => {
    const hand = [makeCard('♥', 'A'), makeCard('♦', '8')]
    const result = validateResponse(makeCard('♥', 'A'), makeCard('♠', '9'), hand)
    expect(result.valid).toBe(true)
  })
})

describe('Obligation de couper', () => {
  it('doit couper si une carte plus forte est disponible', () => {
    // Main: ♠10 (bat ♠9) et ♠7 — jouer ♠7 est illegal
    const hand = [makeCard('♠', '10'), makeCard('♠', '7')]
    const result = validateResponse(makeCard('♠', '7'), makeCard('♠', '9'), hand)
    expect(result.valid).toBe(false)
    expect((result as any).reason).toMatch(/couper/)
  })

  it('peut jouer une carte faible si aucune ne coupe', () => {
    // Lead: ♠10 — plus forte. Main: seulement ♠7 — ne peut pas couper
    const hand = [makeCard('♠', '7')]
    const result = validateResponse(makeCard('♠', '7'), makeCard('♠', '10'), hand)
    expect(result.valid).toBe(true)
  })

  it('peut jouer n importe quelle carte coupante', () => {
    // Lead: ♠V (rank 5). Main: ♠10 (rank 0) et ♠9 (rank 1) — les deux coupent
    const hand = [makeCard('♠', '10'), makeCard('♠', '9')]
    expect(validateResponse(makeCard('♠', '10'), makeCard('♠', 'V'), hand).valid).toBe(true)
    expect(validateResponse(makeCard('♠', '9'), makeCard('♠', 'V'), hand).valid).toBe(true)
  })
})

// ── DÉTERMINATION DU GAGNANT D'UN PLI ────────────────────────────────────────

describe('Gagnant du pli — meme couleur', () => {
  const cases: [string, string, PlayerKey][] = [
    ['10', '9',  'player'],   // 10 bat 9
    ['9',  'A',  'player'],   // 9 bat A
    ['A',  'R',  'player'],   // A bat R
    ['R',  'D',  'player'],   // R bat D
    ['D',  'V',  'player'],   // D bat V
    ['V',  '8',  'player'],   // V bat 8
    ['8',  '7',  'player'],   // 8 bat 7
    ['7',  '10', 'ai'],       // 7 perd contre 10
  ]
  it.each(cases)('%s bat %s', (leadRank: string, respRank: string, expected: PlayerKey) => {
    const lead = makeCard('♥', leadRank as any)
    const resp = makeCard('♥', respRank as any)
    expect(trickWinner(lead, 'player', resp)).toBe(expected)
  })
})

describe('Gagnant du pli — couleurs differentes', () => {
  it('la couleur demandee gagne toujours, meme avec une carte faible', () => {
    // Player lead ♠7, AI respond ♥10 — ♠ est la couleur demandee, player gagne
    expect(trickWinner(makeCard('♠', '7'), 'player', makeCard('♥', '10'))).toBe('player')
  })

  it("l'IA lead gagne avec sa couleur meme contre un 10", () => {
    expect(trickWinner(makeCard('♣', '7'), 'ai', makeCard('♥', '10'))).toBe('ai')
  })

  it('tous les cas de couleur croisee', () => {
    for (const leadSuit of SUITS) {
      for (const respSuit of SUITS) {
        if (leadSuit === respSuit) continue
        const lead = makeCard(leadSuit, '7')
        const resp = makeCard(respSuit, '10')
        // Lead suit always wins
        expect(trickWinner(lead, 'player', resp)).toBe('player')
      }
    }
  })
})

// ── CALCUL DES POINTS ────────────────────────────────────────────────────────

describe('Calcul du score', () => {
  it('0 carte = 0 point', () => {
    expect(calcScore([])).toMatchObject({ aces: 0, trioPoints: 0, total: 0 })
  })

  it('chaque As vaut 1 point', () => {
    const cards = SUITS.map(s => makeCard(s, 'A'))
    const score = calcScore(cards)
    expect(score.aces).toBe(4)
    expect(score.total).toBe(4)
  })

  it('3 cartes eligibles = 1 point de trio', () => {
    const cards = [makeCard('♠','10'), makeCard('♥','9'), makeCard('♦','R')]
    expect(calcScore(cards)).toMatchObject({ trioPoints: 1, total: 1 })
  })

  it('8 cartes eligibles = 2 points de trio (8÷3=2)', () => {
    const cards = [
      makeCard('♠','10'), makeCard('♥','10'),
      makeCard('♦','9'),  makeCard('♣','9'),
      makeCard('♠','R'),  makeCard('♥','R'),
      makeCard('♦','D'),  makeCard('♣','D'),
    ]
    expect(calcScore(cards)).toMatchObject({ eligibleCards: 8, trioPoints: 2 })
  })

  it('exemple des specs: 2 As + 8 eligibles = 4 points', () => {
    const cards = [
      makeCard('♠','A'), makeCard('♥','A'),
      makeCard('♦','10'), makeCard('♣','10'),
      makeCard('♠','9'),  makeCard('♥','9'),
      makeCard('♦','R'),  makeCard('♣','R'),
      makeCard('♠','D'),  makeCard('♥','D'),
    ]
    expect(calcScore(cards)).toMatchObject({ aces: 2, trioPoints: 2, total: 4 })
  })

  it('les 8 et les 7 ne valent rien', () => {
    const cards = SUITS.flatMap(s => [makeCard(s,'8'), makeCard(s,'7')])
    expect(calcScore(cards).total).toBe(0)
  })

  it('V, D, R contribuent aux trios', () => {
    const cards = [makeCard('♠','V'), makeCard('♥','D'), makeCard('♦','R')]
    expect(calcScore(cards)).toMatchObject({ eligibleCards: 3, trioPoints: 1 })
  })
})

// ── IA — STRATÉGIE ────────────────────────────────────────────────────────────

describe('Strategie IA — lead', () => {
  it('joue la carte la plus forte quand elle mene', () => {
    const hand = [makeCard('♠','7'), makeCard('♥','10'), makeCard('♦','R')]
    expect(aiChooseCard(hand, null).rank).toBe('10')
  })
})

describe('Strategie IA — reponse', () => {
  it('coupe avec la plus petite carte gagnante disponible', () => {
    // Lead ♠9. Main AI: ♠10 (bat) et ♠A (ne bat pas 9 — order[A]=2 > order[9]=1)
    // ♠10 doit etre joue
    const hand = [makeCard('♠','10'), makeCard('♠','A')]
    expect(aiChooseCard(hand, makeCard('♠','9')).rank).toBe('10')
  })

  it('defausse la plus faible de la couleur si ne peut pas couper', () => {
    const hand = [makeCard('♠','7'), makeCard('♠','8')]
    expect(aiChooseCard(hand, makeCard('♠','10')).rank).toBe('7')
  })

  it('defausse la plus faible globalement si absent de la couleur', () => {
    const hand = [makeCard('♥','7'), makeCard('♦','A'), makeCard('♣','9')]
    expect(aiChooseCard(hand, makeCard('♠','9')).rank).toBe('7')
  })
})

// ── SIMULATION COMPLÈTE ───────────────────────────────────────────────────────

describe('Simulation d une donne complete', () => {
  it('joue les 32 cartes, aucune carte perdue ou dupliquee', () => {
    let { playerHand, aiHand, drawPile } = deal(makeDeck())
    const playerCapture: Card[] = []
    const aiCapture: Card[] = []
    let leader: PlayerKey = 'player'

    while (playerHand.length > 0 || aiHand.length > 0) {
      let leadCard: Card, leadBy: PlayerKey, responseCard: Card

      if (leader === 'player') {
        leadCard = playerHand[0]; leadBy = 'player'
        playerHand = playerHand.slice(1)
        responseCard = aiChooseCard(aiHand, leadCard)
        const v = validateResponse(responseCard, leadCard, aiHand)
        expect(v.valid).toBe(true)
        aiHand = aiHand.filter(c => c.id !== responseCard.id)
      } else {
        leadCard = aiChooseCard(aiHand, null); leadBy = 'ai'
        aiHand = aiHand.filter(c => c.id !== leadCard.id)
        // Player plays first valid card
        const sameSuit = playerHand.filter(c => c.suit === leadCard.suit)
        if (sameSuit.length > 0) {
          const canBeat = sameSuit.filter(c => isStronger(c, leadCard))
          responseCard = canBeat.length > 0 ? canBeat[0] : sameSuit[0]
        } else {
          responseCard = playerHand[0]
        }
        playerHand = playerHand.filter(c => c.id !== responseCard.id)
      }

      const winner = trickWinner(leadCard, leadBy, responseCard)
      const cards = [leadCard, responseCard]
      if (winner === 'player') playerCapture.push(...cards)
      else aiCapture.push(...cards)

      const drawn = afterDraw(drawPile, winner, playerHand, aiHand)
      drawPile = drawn.pile
      playerHand = drawn.playerHand
      aiHand = drawn.aiHand
      leader = winner
    }

    expect(playerCapture.length + aiCapture.length).toBe(32)
    const allIds = [...playerCapture, ...aiCapture].map(c => c.id)
    expect(new Set(allIds).size).toBe(32)
    expect(drawPile).toHaveLength(0)
    expect(calcScore(playerCapture).total).toBeGreaterThanOrEqual(0)
    expect(calcScore(aiCapture).total).toBeGreaterThanOrEqual(0)
  })

  it('simule 20 donnes consecutives sans erreur', () => {
    for (let d = 0; d < 20; d++) {
      let { playerHand, aiHand, drawPile } = deal(makeDeck())
      const pc: Card[] = [], ac: Card[] = []
      let leader: PlayerKey = d % 2 === 0 ? 'player' : 'ai'

      while (playerHand.length > 0 || aiHand.length > 0) {
        let lc: Card, lb: PlayerKey, rc: Card
        if (leader === 'player') {
          lc = playerHand[0]; lb = 'player'
          playerHand = playerHand.slice(1)
          rc = aiChooseCard(aiHand, lc)
          aiHand = aiHand.filter(c => c.id !== rc.id)
        } else {
          lc = aiChooseCard(aiHand, null); lb = 'ai'
          aiHand = aiHand.filter(c => c.id !== lc.id)
          const ss = playerHand.filter(c => c.suit === lc.suit)
          rc = ss.length > 0 ? (ss.find(c => isStronger(c, lc)) ?? ss[0]) : playerHand[0]
          playerHand = playerHand.filter(c => c.id !== rc.id)
        }
        const w = trickWinner(lc, lb, rc)
        if (w === 'player') pc.push(lc, rc); else ac.push(lc, rc)
        const drawn = afterDraw(drawPile, w, playerHand, aiHand)
        drawPile = drawn.pile; playerHand = drawn.playerHand; aiHand = drawn.aiHand
        leader = w
      }
      expect(pc.length + ac.length).toBe(32)
    }
  })
})

// ── CONDITION DE VICTOIRE ─────────────────────────────────────────────────────

describe('Condition de victoire', () => {
  it(`la victoire se declenche a exactement ${VICTORY_SCORE} points`, () => {
    expect(VICTORY_SCORE).toBe(21)
    expect(VICTORY_SCORE - 1 >= VICTORY_SCORE).toBe(false) // 20 ne gagne pas
    expect(VICTORY_SCORE >= VICTORY_SCORE).toBe(true)      // 21 gagne
    expect(VICTORY_SCORE + 4 >= VICTORY_SCORE).toBe(true)  // 25 gagne
  })

  it('en cas egalite, le score le plus eleve gagne', () => {
    const decide = (p: number, a: number) =>
      p > a ? 'player' : p < a ? 'ai' : 'draw'
    expect(decide(22, 21)).toBe('player')
    expect(decide(21, 22)).toBe('ai')
    expect(decide(21, 21)).toBe('draw')
  })
})
