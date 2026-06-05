import { DonneResult, PlayerKey } from '@/types'

interface GameEndScreenProps {
  winner: PlayerKey | 'draw'
  result: DonneResult
  onReplay: () => void
}

export function GameEndScreen({ winner, result, onReplay }: GameEndScreenProps) {
  const isPlayerWin = winner === 'player'
  const isDraw = winner === 'draw'

  const trophy = isDraw ? '🤝' : isPlayerWin ? '🏆' : '🤖'
  const title = isDraw ? 'Égalité !' : isPlayerWin ? 'Vous gagnez !' : "L'IA gagne !"
  const sub = isDraw
    ? 'Scores identiques — une donne supplémentaire est jouée automatiquement.'
    : isPlayerWin
    ? 'Félicitations, excellente partie !'
    : "L'IA a été plus forte cette fois."

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div
        className="bg-felt-dark border-2 border-gold rounded-2xl p-10 text-center max-w-sm w-[90%]
                   shadow-[0_20px_60px_rgba(0,0,0,0.7)] animate-slide-in"
      >
        <div className="text-6xl mb-3" role="img" aria-label={title}>
          {trophy}
        </div>
        <h1 className="font-display font-black text-gold-light text-3xl mb-2">{title}</h1>
        <p className="text-text-muted text-sm mb-6">{sub}</p>

        <div className="flex justify-center gap-10 mb-7">
          <ScoreItem
            label="Vous"
            value={result.playerTotal}
            highlight={isPlayerWin}
          />
          <ScoreItem
            label="IA"
            value={result.aiTotal}
            highlight={!isPlayerWin && !isDraw}
          />
        </div>

        <button
          className="w-full bg-gold text-[#1a1a1a] font-semibold py-3 rounded-lg text-base
                     hover:bg-gold-light transition-all duration-150"
          onClick={onReplay}
        >
          Rejouer
        </button>
      </div>
    </div>
  )
}

function ScoreItem({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight: boolean
}) {
  return (
    <div className="text-center">
      <p className="text-text-muted text-xs uppercase tracking-widest mb-1">{label}</p>
      <p
        className={`font-display font-black text-4xl ${highlight ? 'text-emerald-400' : 'text-gold-light'}`}
      >
        {value}
      </p>
    </div>
  )
}
