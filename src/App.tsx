import { useGameState } from '@/hooks/useGameState'
import { useSvgSprite } from '@/components/CardSvg'
import { StartScreen } from '@/components/StartScreen'
import { GameBoard } from '@/components/GameBoard'
import { DonneEndScreen } from '@/components/DonneEndScreen'
import { GameEndScreen } from '@/components/GameEndScreen'

export function App() {
  const spriteState = useSvgSprite()
  const { state, startNewGame, startNextDonne, selectCard, playSelected } = useGameState()

  if (spriteState === 'error') {
    return (
      <div className="min-h-screen bg-felt-dark flex items-center justify-center">
        <div className="text-center p-8 bg-black/30 rounded-2xl border border-red-500/40 max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-display text-red-400 text-xl mb-3">Cartes introuvables</h2>
          <p className="text-text-muted text-sm">
            Le fichier <code className="text-gold">public/svg-cards.svg</code> est manquant.
          </p>
          <p className="text-text-muted text-sm mt-2">
            Placez le fichier svg-cards.svg dans le dossier <code className="text-gold">public/</code>.
          </p>
        </div>
      </div>
    )
  }

  if (spriteState === 'loading') {
    return (
      <div className="min-h-screen bg-felt-dark flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-pulse">🃏</div>
          <p className="font-display text-gold-light text-lg">Chargement des cartes…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-felt-dark text-text-felt font-body">
      {state.screen === 'start' && (
        <StartScreen onStart={startNewGame} />
      )}
      {state.screen === 'game' && (
        <GameBoard state={state} onCardClick={selectCard} onPlaySelected={playSelected} />
      )}
      {state.screen === 'donne-end' && state.donneResult && (
        <DonneEndScreen
          result={state.donneResult}
          onNextDonne={() =>
            startNextDonne(state.donneResult!.playerTotal, state.donneResult!.aiTotal)
          }
        />
      )}
      {state.screen === 'game-end' && state.donneResult && state.winner && (
        <>
          <GameBoard state={state} onCardClick={() => {}} />
          <GameEndScreen
            winner={state.winner}
            result={state.donneResult}
            onReplay={startNewGame}
          />
        </>
      )}
    </div>
  )
}
