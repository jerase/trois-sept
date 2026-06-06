import { useEffect, useRef, useState } from 'react'
import { Card, GameState, PlayerKey, PlayerState, DonneResult, Suit, VICTORY_SCORE } from '@/types'
import { makeDeck, deal } from '@/game/deck'
import { trickWinner, validateResponse, calcScore } from '@/game/rules'
import { aiChooseCard } from '@/game/ai'

export { VICTORY_SCORE }

const AI_THINK_MS   = 900
const RESOLVE_SHOW_MS = 1100

// ── Helpers PlayerState ───────────────────────────────────────────────────────

function makePlayer(hand: Card[], score: number): PlayerState {
  return { hand, capturedCards: [], score, asideCard: null, awaitingSuit: null }
}

// ── Helpers état ──────────────────────────────────────────────────────────────

function initialState(): GameState {
  return {
    screen: 'start',
    player: makePlayer([], 0),
    ai:     makePlayer([], 0),
    drawPile: [],
    currentTrick: null,
    currentLeader: null,
    trickPhase: 'lead',
    statusMessage: '',
    statusKind: 'info',
    selectedCard: null,
    donneResult: null,
    winner: null,
    aiThinking: false,
  }
}

function buildDonne(playerScore: number, aiScore: number): GameState {
  const firstLeader: PlayerKey = Math.random() < 0.5 ? 'player' : 'ai'
  const { playerHand, aiHand, drawPile } = deal(makeDeck())
  return {
    screen: 'game',
    player: makePlayer(playerHand, playerScore),
    ai:     makePlayer(aiHand,     aiScore),
    drawPile,
    currentTrick: null,
    currentLeader: firstLeader,
    trickPhase: 'lead',
    statusMessage:
      firstLeader === 'player'
        ? "A vous d'ouvrir - choisissez une carte."
        : "L'IA va ouvrir le pli...",
    statusKind: 'info',
    selectedCard: null,
    donneResult: null,
    winner: null,
    aiThinking: firstLeader === 'ai',
  }
}

// ── Pioche avec gestion de la mise de côté ────────────────────────────────────

/**
 * Distribue les cartes de la pioche après un pli.
 * - Le gagnant pioche en premier.
 * - Si un joueur a awaitingSuit et pioche une carte de cette couleur,
 *   cette carte va dans asideCard (pas dans la main) et awaitingSuit est effacé.
 */
function afterDraw(
  pile: Card[],
  winner: PlayerKey,
  player: PlayerState,
  ai: PlayerState,
): { pile: Card[]; player: PlayerState; ai: PlayerState; asideMessages: string[] } {
  const p = [...pile]
  let newPlayer = { ...player }
  let newAi     = { ...ai }
  const asideMessages: string[] = []

  if (p.length === 0) return { pile: p, player: newPlayer, ai: newAi, asideMessages }

  const first  = p.shift()!
  const second = p.length > 0 ? p.shift()! : null

  function drawFor(ps: PlayerState, card: Card): PlayerState {
    // La carte correspond à la couleur surveillée → mise de côté
    if (ps.awaitingSuit && card.suit === ps.awaitingSuit) {
      return { ...ps, asideCard: card, awaitingSuit: null }
    }
    // Sinon dans la main normalement
    return { ...ps, hand: [...ps.hand, card], awaitingSuit: null }
  }

  if (winner === 'player') {
    newPlayer = drawFor(newPlayer, first)
    if (second) newAi = drawFor(newAi, second)
  } else {
    newAi     = drawFor(newAi, first)
    if (second) newPlayer = drawFor(newPlayer, second)
  }

  // Construire les messages d'annonce
  if (newPlayer.asideCard && !player.asideCard) {
    asideMessages.push(
      `Vous avez pioché ${newPlayer.asideCard.rank}${newPlayer.asideCard.suit} — carte mise de côté.`
    )
  }
  if (newAi.asideCard && !ai.asideCard) {
    asideMessages.push("L'IA annonce : carte de côté.")
  }

  return { pile: p, player: newPlayer, ai: newAi, asideMessages }
}

/**
 * Au début d'un nouveau pli, reintegrer les cartes mises de côté dans les mains.
 */
function reintegrateAsideCards(s: GameState): GameState {
  let newPlayer = s.player
  let newAi     = s.ai

  if (newPlayer.asideCard) {
    newPlayer = { ...newPlayer, hand: [...newPlayer.hand, newPlayer.asideCard], asideCard: null }
  }
  if (newAi.asideCard) {
    newAi = { ...newAi, hand: [...newAi.hand, newAi.asideCard], asideCard: null }
  }

  return { ...s, player: newPlayer, ai: newAi }
}

// ── Détermination du awaitingSuit après un pli ────────────────────────────────

/**
 * Après un pli, détermine si le perdant doit surveiller une couleur à la prochaine pioche.
 * Condition : le perdant a joué une couleur différente de la couleur demandée
 * (c'est-à-dire qu'il n'avait pas la couleur au moment de jouer).
 */
function computeAwaitingSuit(
  leadCard: Card,
  leadBy: PlayerKey,
  responseCard: Card,
): { playerAwaits: Suit | null; aiAwaits: Suit | null } {
  const respondBy: PlayerKey = leadBy === 'player' ? 'ai' : 'player'

  // Le répondant a joué une couleur différente → il n'avait pas la couleur demandée
  const respondantDefaussed = responseCard.suit !== leadCard.suit

  return {
    playerAwaits: (respondBy === 'player' && respondantDefaussed) ? leadCard.suit : null,
    aiAwaits:     (respondBy === 'ai'     && respondantDefaussed) ? leadCard.suit : null,
  }
}

// ── Résolution d'un pli ───────────────────────────────────────────────────────

function applyResolution(s: GameState): GameState {
  const trick  = s.currentTrick!
  const winner = trickWinner(trick.leadCard, trick.leadBy, trick.responseCard!)
  const cards  = [trick.leadCard, trick.responseCard!]

  const newPC = winner === 'player'
    ? [...s.player.capturedCards, ...cards]
    : s.player.capturedCards
  const newAC = winner === 'ai'
    ? [...s.ai.capturedCards, ...cards]
    : s.ai.capturedCards

  // Calculer les awaitingSuit AVANT la pioche
  const { playerAwaits, aiAwaits } = computeAwaitingSuit(
    trick.leadCard, trick.leadBy, trick.responseCard!,
  )

  const playerAfterCapture: PlayerState = {
    ...s.player,
    capturedCards: newPC,
    awaitingSuit: playerAwaits,
  }
  const aiAfterCapture: PlayerState = {
    ...s.ai,
    capturedCards: newAC,
    awaitingSuit: aiAwaits,
  }

  // Pioche (avec gestion de la mise de côté)
  const drawn = afterDraw(s.drawPile, winner, playerAfterCapture, aiAfterCapture)

  // Message principal + éventuelles annonces
  const winMsg    = winner === 'player' ? 'Vous remportez le pli !' : "L'IA remporte le pli."
  const allMsgs   = [winMsg, ...drawn.asideMessages]
  const statusMsg = allMsgs.join(' — ')

  return {
    ...s,
    player:       drawn.player,
    ai:           drawn.ai,
    drawPile:     drawn.pile,
    currentLeader: winner,
    trickPhase:   'lead',
    currentTrick: null,
    statusMessage: statusMsg,
    statusKind:   winner === 'player' ? 'highlight' : 'info',
    aiThinking:   winner === 'ai',
  }
}

function finalizeDonne(s: GameState): GameState {
  const pb = calcScore(s.player.capturedCards)
  const ab = calcScore(s.ai.capturedCards)
  const newPS = s.player.score + pb.total
  const newAS = s.ai.score + ab.total
  const donneResult: DonneResult = {
    playerGained: pb.total, aiGained: ab.total,
    playerTotal:  newPS,    aiTotal:  newAS,
  }
  const pWins = newPS >= VICTORY_SCORE
  const aWins = newAS >= VICTORY_SCORE
  if (pWins || aWins) {
    const winner =
      pWins && aWins
        ? newPS > newAS ? 'player' : newPS < newAS ? 'ai' : 'draw'
        : pWins ? 'player' : 'ai'
    return { ...s, player: { ...s.player, score: newPS }, ai: { ...s.ai, score: newAS },
      donneResult, winner, screen: 'game-end', aiThinking: false }
  }
  return { ...s, player: { ...s.player, score: newPS }, ai: { ...s.ai, score: newAS },
    donneResult, screen: 'donne-end', aiThinking: false }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState)
  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const aiScheduledRef  = useRef(false)
  const resolvingRef    = useRef(false)

  function clearTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  // ── Démarrage ──────────────────────────────────────────────────────────────

  function startNewGame() {
    clearTimer(); aiScheduledRef.current = false; resolvingRef.current = false
    const s = buildDonne(0, 0)
    setState(s)
    if (s.currentLeader === 'ai') scheduleAiLead(s)
  }

  function startNextDonne(playerScore: number, aiScore: number) {
    clearTimer(); aiScheduledRef.current = false; resolvingRef.current = false
    const s = buildDonne(playerScore, aiScore)
    setState(s)
    if (s.currentLeader === 'ai') scheduleAiLead(s)
  }

  // ── Actions joueur ─────────────────────────────────────────────────────────

  function selectCard(card: Card) {
    setState((s: GameState) => {
      if (s.screen !== 'game' || aiScheduledRef.current || resolvingRef.current) return s
      const playerLeads    = s.trickPhase === 'lead'    && s.currentLeader === 'player'
      const playerResponds = s.trickPhase === 'respond' && s.currentLeader === 'player'
                          && s.currentTrick?.leadBy === 'ai'
      if (!playerLeads && !playerResponds) return s

      if (s.selectedCard?.id === card.id) return doPlay(s, card)

      return {
        ...s, selectedCard: card,
        statusMessage: `${card.rank}${card.suit} selectionnee - cliquez sur "Jouer" ou double-cliquez.`,
        statusKind: 'info',
      }
    })
  }

  function playSelected() {
    setState((s: GameState) => {
      if (s.screen !== 'game' || !s.selectedCard || aiScheduledRef.current || resolvingRef.current) return s
      return doPlay(s, s.selectedCard)
    })
  }

  function doPlay(s: GameState, card: Card): GameState {
    // Lead
    if (s.trickPhase === 'lead' && s.currentLeader === 'player') {
      // Réintégrer les cartes de côté au début du pli
      const sr = reintegrateAsideCards(s)
      const next: GameState = {
        ...sr,
        player: { ...sr.player, hand: sr.player.hand.filter((c) => c.id !== card.id) },
        currentTrick: { leadCard: card, leadBy: 'player', responseCard: null },
        currentLeader: 'ai',
        trickPhase: 'respond',
        selectedCard: null,
        statusMessage: `Vous jouez ${card.rank}${card.suit} - l'IA repond...`,
        statusKind: 'info',
        aiThinking: true,
      }
      scheduleAiRespond(next)
      return next
    }

    // Respond
    if (s.trickPhase === 'respond' && s.currentLeader === 'player' && s.currentTrick?.leadBy === 'ai') {
      const v = validateResponse(card, s.currentTrick.leadCard, s.player.hand)
      if (!v.valid) {
        return { ...s, selectedCard: null, statusMessage: v.reason, statusKind: 'error' }
      }
      const next: GameState = {
        ...s,
        player: { ...s.player, hand: s.player.hand.filter((c) => c.id !== card.id) },
        currentTrick: { ...s.currentTrick, responseCard: card },
        currentLeader: null,
        trickPhase: 'resolve',
        selectedCard: null,
        statusMessage: '',
        statusKind: 'info',
        aiThinking: false,
      }
      scheduleResolution(next)
      return next
    }

    return s
  }

  // ── IA automatique ─────────────────────────────────────────────────────────

  function scheduleAiLead(snapshot: GameState) {
    if (aiScheduledRef.current) return
    aiScheduledRef.current = true
    clearTimer()
    timerRef.current = setTimeout(() => {
      aiScheduledRef.current = false
      // Réintégrer les cartes de côté au début du pli IA
      const sr     = reintegrateAsideCards(snapshot)
      // L'IA peut jouer asideCard ou n'importe quelle carte en main
      const chosen = aiChooseCard(sr.ai.hand, null)
      const next: GameState = {
        ...sr,
        ai: { ...sr.ai, hand: sr.ai.hand.filter((c) => c.id !== chosen.id) },
        currentTrick: { leadCard: chosen, leadBy: 'ai', responseCard: null },
        currentLeader: 'player',
        trickPhase: 'respond',
        aiThinking: false,
        statusMessage: `L'IA joue ${chosen.rank}${chosen.suit} - repondez.`,
        statusKind: 'info',
      }
      setState(next)
    }, AI_THINK_MS)
  }

  function scheduleAiRespond(snapshot: GameState) {
    if (aiScheduledRef.current) return
    aiScheduledRef.current = true
    clearTimer()
    timerRef.current = setTimeout(() => {
      aiScheduledRef.current = false
      const leadCard = snapshot.currentTrick!.leadCard
      // La main de l'IA pour répondre inclut asideCard si elle est jouable
      // (elle est déjà dans la main car reintegrateAsideCards est appelé au lead)
      const chosen = aiChooseCard(snapshot.ai.hand, leadCard)
      const next: GameState = {
        ...snapshot,
        ai: { ...snapshot.ai, hand: snapshot.ai.hand.filter((c) => c.id !== chosen.id) },
        currentTrick: { ...snapshot.currentTrick!, responseCard: chosen },
        currentLeader: null,
        trickPhase: 'resolve',
        aiThinking: false,
      }
      scheduleResolution(next)
      setState(next)
    }, AI_THINK_MS)
  }

  function scheduleResolution(snapshot: GameState) {
    if (resolvingRef.current) return
    resolvingRef.current = true
    clearTimer()
    timerRef.current = setTimeout(() => {
      const resolved = applyResolution(snapshot)
      const allDone  = resolved.player.hand.length === 0 && resolved.ai.hand.length === 0
        && !resolved.player.asideCard && !resolved.ai.asideCard

      if (allDone) {
        resolvingRef.current = false
        setState(finalizeDonne({ ...resolved, currentTrick: null }))
        return
      }

      setState(resolved)

      timerRef.current = setTimeout(() => {
        resolvingRef.current = false
        if (resolved.currentLeader === 'ai') {
          setState((s: GameState) => {
            scheduleAiLead(s)
            return { ...s, statusMessage: "L'IA mene le pli suivant...", statusKind: 'info' }
          })
        } else {
          setState((s: GameState) => ({ ...s, statusMessage: 'A vous de mener.', statusKind: 'info' as const }))
        }
      }, RESOLVE_SHOW_MS)
    }, RESOLVE_SHOW_MS)
  }

  useEffect(() => { return clearTimer }, [])

  return { state, startNewGame, startNextDonne, selectCard, playSelected }
}
