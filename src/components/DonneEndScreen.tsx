import { DonneResult } from '@/types'

interface DonneEndScreenProps {
  result: DonneResult
  onNextDonne: () => void
}

export function DonneEndScreen({ result, onNextDonne }: DonneEndScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-5 px-4">
      <div className="bg-black/40 border border-gold-dim/50 rounded-2xl p-8 max-w-sm w-full text-center animate-slide-in shadow-game">
        <h2 className="font-display text-gold-light text-xl mb-6">Fin de la donne</h2>

        <div className="flex justify-center gap-10 mb-6">
          {/* Player */}
          <div className="text-center">
            <p className="text-text-muted text-xs uppercase tracking-widest mb-1">Vous</p>
            <p
              className={`font-display text-3xl font-bold ${result.playerGained > 0 ? 'text-emerald-400' : 'text-text-felt'}`}
            >
              +{result.playerGained}
            </p>
            <p className="text-text-muted text-sm mt-1">Total : {result.playerTotal} pts</p>
          </div>

          <div className="w-px bg-gold-dim/50" />

          {/* AI */}
          <div className="text-center">
            <p className="text-text-muted text-xs uppercase tracking-widest mb-1">IA</p>
            <p
              className={`font-display text-3xl font-bold ${result.aiGained > 0 ? 'text-emerald-400' : 'text-text-felt'}`}
            >
              +{result.aiGained}
            </p>
            <p className="text-text-muted text-sm mt-1">Total : {result.aiTotal} pts</p>
          </div>
        </div>

        <p className="text-text-muted text-xs mb-5">Premier à 21 points gagne.</p>

        {/* Progress bars */}
        <div className="space-y-2 mb-6">
          <ProgressBar label="Vous" value={result.playerTotal} max={21} />
          <ProgressBar label="IA" value={result.aiTotal} max={21} />
        </div>

        <button
          className="w-full bg-gold text-[#1a1a1a] font-semibold py-2.5 rounded-lg
                     hover:bg-gold-light transition-all duration-150"
          onClick={onNextDonne}
        >
          Nouvelle donne
        </button>
      </div>
    </div>
  )
}

function ProgressBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-muted text-xs w-8 text-right">{label}</span>
      <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gold-light text-xs font-bold w-8">{value}</span>
    </div>
  )
}
