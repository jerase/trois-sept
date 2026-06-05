import { Card, GameState } from '@/types'
import { calcScore } from '@/game/rules'
import {
  CardComponent,
  CardBack,
  EmptySlot,
  DeckPile,
  getCardValidity,
} from './CardComponent'

interface GameBoardProps {
  state: GameState
  onCardClick: (card: Card) => void
  onPlaySelected?: () => void
}

export function GameBoard({ state, onCardClick, onPlaySelected }: GameBoardProps) {
  const {
    player, ai, drawPile,
    currentTrick, currentLeader, trickPhase,
    statusMessage, statusKind, selectedCard,
  } = state

  const playerCanPlay =
    (trickPhase === 'lead'    && currentLeader === 'player') ||
    (trickPhase === 'respond' && currentLeader === 'player' && currentTrick?.leadBy === 'ai')

  const showResponseHints =
    trickPhase === 'respond' && currentLeader === 'player' && currentTrick?.leadBy === 'ai'

  const leadCard     = currentTrick?.leadCard     ?? null
  const responseCard = currentTrick?.responseCard ?? null
  const leadBy       = currentTrick?.leadBy       ?? null

  const aiTableCard     = leadBy === 'ai'     ? leadCard     : leadBy === 'player' ? responseCard : null
  const playerTableCard = leadBy === 'player' ? leadCard     : leadBy === 'ai'     ? responseCard : null

  const estimatedScore = calcScore(player.capturedCards)

  // La main jouable du joueur inclut la asideCard au moment de mener
  const playableHand: Card[] = trickPhase === 'lead' && currentLeader === 'player'
    ? [...player.hand, ...(player.asideCard ? [player.asideCard] : [])]
    : player.hand

  return (
    <div className="flex flex-col gap-2 max-w-4xl mx-auto px-3 py-2 min-h-screen">

      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-2 bg-black/25 rounded-xl border border-gold-dim/50">
        <h1 className="font-display font-black text-gold-light text-xl tracking-wide">Twa Set</h1>
        <div className="flex items-center gap-5">
          <ScoreDisplay label="Vous" value={player.score} />
          <div className="w-px h-8 bg-gold-dim/50" />
          <ScoreDisplay label="IA" value={ai.score} />
          <div className="w-px h-8 bg-gold-dim/50" />
          <ScoreDisplay label="Victoire" value={21} muted />
        </div>
      </header>

      {/* AI HAND + carte de côté IA */}
      <section className="bg-black/20 rounded-xl px-3 py-2 border border-white/10" aria-label="Main de l'IA">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-2">
              IA &middot; {ai.hand.length} carte{ai.hand.length !== 1 ? 's' : ''}
              {state.aiThinking ? ' · reflechit...' : currentLeader === 'ai' ? ' · joue' : ''}
            </p>
            <div className="flex gap-1.5 flex-wrap min-h-[116px] items-center">
              {ai.hand.map((_, i) => <CardBack key={i} />)}
            </div>
          </div>

          {/* Carte de côté de l'IA */}
          {ai.asideCard && (
            <div className="flex flex-col items-center gap-1 shrink-0">
              <p className="text-yellow-400 text-[10px] uppercase tracking-widest">
                Annonce
              </p>
              <div className="relative">
                <CardBack />
                {/* Badge couleur surveillée */}
                <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-[#1a1a1a]
                                text-[9px] font-bold rounded-full w-5 h-5 flex items-center
                                justify-center shadow-md">
                  {ai.asideCard.suit}
                </div>
              </div>
              <p className="text-yellow-400/70 text-[9px]">mise de côté</p>
            </div>
          )}
        </div>
      </section>

      {/* TABLE */}
      <div
        className="rounded-2xl border-2 border-gold/20 flex items-center justify-center gap-4 p-4 min-h-[180px]"
        style={{ background: '#1a5c3a' }}
      >
        <TrickSlot label="IA" card={aiTableCard} />
        <div className="flex flex-col items-center gap-1 px-4">
          <DeckPile count={drawPile.length} />
          <span className="text-text-muted text-xs">
            {drawPile.length} carte{drawPile.length !== 1 ? 's' : ''}
          </span>
        </div>
        <TrickSlot label="Vous" card={playerTableCard} />
      </div>

      {/* STATUS */}
      <div
        className={`text-center text-sm min-h-6 px-2 ${
          statusKind === 'highlight' ? 'text-gold-light font-medium' :
          statusKind === 'error'     ? 'text-red-400 font-medium'    :
                                       'text-text-muted'
        }`}
        role="status" aria-live="polite"
      >
        {statusMessage}
      </div>

      {/* PLAYER HAND + carte de côté joueur */}
      <section className="bg-black/15 rounded-xl px-3 py-2 border border-white/10" aria-label="Votre main">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-2">
              Votre main &middot; {player.hand.length} carte{player.hand.length !== 1 ? 's' : ''}
              {playerCanPlay ? ' · Cliquez pour jouer' : ''}
            </p>
            <div className="flex gap-1.5 flex-wrap min-h-[124px] items-center">
              {playableHand.map((card) => {
                const isAside = card.id === player.asideCard?.id
                return (
                  <div key={card.id} className="relative flex flex-col items-center gap-0.5">
                    <CardComponent
                      card={card}
                      onClick={() => onCardClick(card)}
                      disabled={!playerCanPlay}
                      selected={selectedCard?.id === card.id}
                      validity={showResponseHints
                        ? getCardValidity(card, leadCard, playableHand)
                        : null}
                    />
                    {/* Indicateur "mis de côté" */}
                    {isAside && (
                      <span className="text-yellow-400 text-[8px] font-bold uppercase tracking-wide">
                        annoncé
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Bouton Jouer */}
            <div className="flex items-center gap-3 mt-2 min-h-[32px]">
              {selectedCard && playerCanPlay && (
                <>
                  <button
                    onClick={onPlaySelected}
                    className="px-5 py-1.5 bg-gold text-[#1a1a1a] font-semibold text-sm rounded-lg
                               hover:bg-gold-light active:scale-95 transition-all duration-100 shadow-md"
                  >
                    Jouer {selectedCard.rank}{selectedCard.suit}
                  </button>
                  <span className="text-text-muted text-xs">ou double-cliquez</span>
                </>
              )}
            </div>
          </div>

          {/* Carte de côté du joueur (affichée séparément, face cachée aux adversaires) */}
          {player.asideCard && trickPhase !== 'lead' && (
            <div className="flex flex-col items-center gap-1 shrink-0">
              <p className="text-yellow-400 text-[10px] uppercase tracking-widest">Annoncée</p>
              <CardComponent card={player.asideCard} disabled />
              <p className="text-yellow-400/70 text-[9px]">revient au pli suivant</p>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex justify-between items-center px-4 py-1.5 bg-black/20 rounded-xl text-xs text-text-muted">
        <div className="flex gap-5">
          <Stat label="Vos plis" value={Math.floor(player.capturedCards.length / 2)} />
          <Stat label="Plis IA"  value={Math.floor(ai.capturedCards.length / 2)} />
          <Stat label="Pts estimes" value={estimatedScore.total} gold />
        </div>
        <span className="hidden sm:block opacity-60 text-[10px]">
          10 &gt; 9 &gt; A &gt; R &gt; D &gt; V &gt; 8 &gt; 7
        </span>
      </footer>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TrickSlot({ label, card }: { label: string; card: Card | null }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[100px]">
      <span className="text-text-muted text-[10px] uppercase tracking-wider">{label}</span>
      {card ? <CardComponent card={card} disabled played /> : <EmptySlot />}
    </div>
  )
}

function ScoreDisplay({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-text-muted text-[10px] uppercase tracking-widest leading-none mb-0.5">{label}</p>
      <p className={`font-display font-bold text-xl leading-none ${muted ? 'text-text-muted' : 'text-gold-light'}`}>
        {value}
      </p>
    </div>
  )
}

function Stat({ label, value, gold = false }: { label: string; value: number; gold?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
      <span className={`font-display font-bold text-base ${gold ? 'text-gold-light' : 'text-text-felt'}`}>{value}</span>
    </div>
  )
}
