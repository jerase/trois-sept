import { Card, RANK_ORDER } from '@/types'
import { CardFaceSvg, CardBackSvg, CARD_W, CARD_H } from './CardSvg'

export { CARD_W, CARD_H }

interface CardProps {
  card: Card
  onClick?: () => void
  disabled?: boolean
  selected?: boolean
  played?: boolean
  validity?: 'valid' | 'invalid' | 'weak' | 'free' | null
}

export function CardComponent({ card, onClick, disabled = false, selected = false, played = false, validity = null }: CardProps) {
  const lift    = selected ? '-translate-y-4' : played ? 'scale-[1.06]' : ''
  const opacity = validity === 'invalid' ? 'opacity-35' : validity === 'weak' ? 'opacity-60' : ''
  const ring    = selected ? 'ring-2 ring-yellow-400 ring-offset-1' : played ? 'ring-2 ring-yellow-300' : ''
  const cursor  = disabled ? 'cursor-default' : 'cursor-pointer'
  const hover   = disabled ? '' : 'hover:-translate-y-3 hover:shadow-[0_12px_28px_rgba(0,0,0,0.55)]'

  return (
    <div
      className={['relative flex-shrink-0 rounded-[5px] overflow-hidden',
        'shadow-[2px_4px_10px_rgba(0,0,0,0.4)] transition-all duration-150',
        cursor, hover, lift, opacity, ring].filter(Boolean).join(' ')}
      style={{ width: CARD_W, height: CARD_H }}
      onClick={!disabled ? onClick : undefined}
      role={!disabled ? 'button' : undefined}
      aria-label={`${card.rank} ${card.suit}`}
      tabIndex={!disabled ? 0 : undefined}
      onKeyDown={!disabled ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() } : undefined}
    >
      <CardFaceSvg card={card} />
    </div>
  )
}

export function CardBack() {
  return (
    <div className="relative flex-shrink-0 rounded-[5px] overflow-hidden shadow-[2px_4px_10px_rgba(0,0,0,0.4)]"
      style={{ width: CARD_W, height: CARD_H }}>
      <CardBackSvg />
    </div>
  )
}

export function EmptySlot() {
  return <div className="flex-shrink-0 rounded-[5px] border-2 border-dashed border-white/20"
    style={{ width: CARD_W, height: CARD_H }} />
}

export function DeckPile({ count }: { count: number }) {
  if (count === 0) return (
    <div className="flex-shrink-0 rounded-[5px] border border-white/15 flex items-center justify-center text-white/25 text-2xl"
      style={{ width: CARD_W, height: CARD_H }}>∅</div>
  )
  const layers = Math.min(count, 3)
  return (
    <div className="relative flex-shrink-0" style={{ width: CARD_W + 4, height: CARD_H + 4 }}>
      {Array.from({ length: layers }, (_, i) => (
        <div key={i} className="absolute rounded-[5px] overflow-hidden shadow-[2px_4px_10px_rgba(0,0,0,0.35)]"
          style={{ top: i*2, left: i*2, zIndex: layers-i, width: CARD_W, height: CARD_H }}>
          <CardBackSvg />
        </div>
      ))}
    </div>
  )
}

export function getCardValidity(card: Card, leadCard: Card | null, hand: Card[]): 'valid'|'invalid'|'weak'|'free'|null {
  if (!leadCard) return null
  const sameSuit = hand.filter(c => c.suit === leadCard.suit)
  if (sameSuit.length === 0) return 'free'
  if (card.suit !== leadCard.suit) return 'invalid'
  const canBeat = sameSuit.filter(c => RANK_ORDER[c.rank] < RANK_ORDER[leadCard.rank])
  if (canBeat.length > 0 && RANK_ORDER[card.rank] >= RANK_ORDER[leadCard.rank]) return 'weak'
  return 'valid'
}
