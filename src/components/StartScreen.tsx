interface StartScreenProps {
  onStart: () => void
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center">
      {/* Logo */}
      <div
        className="font-display font-black text-gold-light leading-none"
        style={{ fontSize: 'clamp(48px, 12vw, 80px)', textShadow: '0 4px 24px rgba(201,162,39,0.35)' }}
      >
        Twa Sèt
      </div>
      <p className="text-text-muted text-base">Variante haïtienne · 2 joueurs · 32 cartes</p>

      {/* Rules card */}
      <div className="bg-black/30 border border-gold-dim/50 rounded-2xl p-6 max-w-sm w-full text-left">
        <h3 className="font-display text-gold text-base mb-4">Comment jouer</h3>
        <ul className="space-y-2">
          {[
            'Atteignez 21 points pour remporter la partie',
            'Ordre de force : 10 > 9 > A > R > D > V > 8 > 7',
            'Vous devez toujours fournir la couleur demandée',
            'Si possible, vous devez couper (jouer plus fort)',
            'As capturé = 1 pt · Trio de 10/9/R/D/V = 1 pt',
            'Le gagnant du pli pioche en premier',
          ].map((rule) => (
            <li key={rule} className="text-text-muted text-sm pl-4 relative">
              <span className="absolute left-0 text-gold text-[10px] top-0.5">♦</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>

      <button
        className="bg-gold text-[#1a1a1a] font-body font-semibold text-base px-10 py-3.5 rounded-lg
                   hover:bg-gold-light hover:-translate-y-0.5 transition-all duration-150 shadow-game"
        onClick={onStart}
      >
        Commencer la partie
      </button>
    </div>
  )
}
