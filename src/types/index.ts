// ── SUIT & RANK ──────────────────────────────────────────────────────────────

export type Suit = '♠' | '♥' | '♦' | '♣'
export type Rank = '7' | '8' | '9' | '10' | 'V' | 'D' | 'R' | 'A'

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣']
export const RANKS: Rank[] = ['7', '8', '9', '10', 'V', 'D', 'R', 'A']

/** Suit display names */
export const SUIT_NAMES: Record<Suit, string> = {
  '♠': 'Pique',
  '♥': 'Cœur',
  '♦': 'Carreau',
  '♣': 'Trèfle',
}

/**
 * Power order (lower index = stronger card).
 * 10 > 9 > A > R > D > V > 8 > 7
 */
export const RANK_ORDER: Record<Rank, number> = {
  '10': 0,
  '9': 1,
  'A': 2,
  'R': 3,
  'D': 4,
  'V': 5,
  '8': 6,
  '7': 7,
}

/** Ranks that contribute to trio scoring (not As, 8, 7) */
export const ELIGIBLE_RANKS = new Set<Rank>(['10', '9', 'R', 'D', 'V'])

/** Red suits */
export const RED_SUITS = new Set<Suit>(['♥', '♦'])

// ── CARD ─────────────────────────────────────────────────────────────────────

export interface Card {
  readonly suit: Suit
  readonly rank: Rank
  /** Unique identifier: e.g. "♠10" */
  readonly id: string
}

// ── PLAYER ───────────────────────────────────────────────────────────────────

export type PlayerKey = 'player' | 'ai'

export interface PlayerState {
  hand: Card[]
  capturedCards: Card[]
  /** Cumulative game score (across donnes) */
  score: number
  /**
   * Carte mise de cote apres une pioche sur la couleur manquante.
   * Elle est jouable comme une carte en main mais affichee separement.
   * Elle rejoint la main au debut du pli suivant.
   */
  asideCard: Card | null
  /**
   * Couleur que ce joueur doit surveiller a la prochaine pioche.
   * Definie quand il a joue sans fournir la couleur demandee.
   * Effacee apres la pioche (qu'il y ait eu mise de cote ou non).
   */
  awaitingSuit: Suit | null
}

// ── TRICK ────────────────────────────────────────────────────────────────────

export interface Trick {
  leadCard: Card
  leadBy: PlayerKey
  responseCard: Card | null
}

// ── GAME PHASE ───────────────────────────────────────────────────────────────

/** Which phase of a trick we're in */
export type TrickPhase = 'lead' | 'respond' | 'resolve'

/** Top-level screen */
export type GameScreen = 'start' | 'game' | 'donne-end' | 'game-end'

// ── DONNE RESULT ─────────────────────────────────────────────────────────────

export interface DonneResult {
  playerGained: number
  aiGained: number
  playerTotal: number
  aiTotal: number
}

// ── GAME STATE ───────────────────────────────────────────────────────────────

export interface GameState {
  screen: GameScreen
  player: PlayerState
  ai: PlayerState
  drawPile: Card[]
  currentTrick: Trick | null
  /** Who plays the LEAD card of the current trick */
  currentLeader: PlayerKey | null
  trickPhase: TrickPhase
  statusMessage: string
  statusKind: 'info' | 'highlight' | 'error'
  selectedCard: Card | null
  donneResult: DonneResult | null
  winner: PlayerKey | 'draw' | null
  aiThinking: boolean
}

// ── GAME CONSTANTS ───────────────────────────────────────────────────────────

export const VICTORY_SCORE = 21

// ── SCORE BREAKDOWN ──────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  aces: number
  eligibleCards: number
  trioPoints: number
  total: number
}
