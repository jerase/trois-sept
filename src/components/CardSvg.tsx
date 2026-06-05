/**
 * Cartes SVG de David Bellot (htdebeer fork, LGPL 2.1)
 *
 * viewBox correcte : "1.25 8.12 169.075 228.4"
 * (calculee depuis la geometrie du groupe #base dans le fichier SVG)
 *
 * Chargement : DOMParser("image/svg+xml") pour preserver xlink:href,
 * puis insertion du SVGElement directement dans le body.
 * Les <use> sont crees via createElementNS pour garantir le bon namespace.
 */
import { useEffect, useRef, useState } from 'react'
import { Card } from '@/types'

export const CARD_W = 80
export const CARD_H = 116

// viewBox calculee depuis la geometrie reelle du fichier svg-cards.svg
// Toutes les cartes occupent la meme zone absolue grace a leurs translate() complementaires
const VB = '1.25 8.12 169.075 228.4'

const CARD_ID: Record<string, string> = {
  '♠A': 'spade_1',
  '♠7': 'spade_7',
  '♠8': 'spade_8',
  '♠9': 'spade_9',
  '♠10': 'spade_10',
  '♠V': 'spade_jack',
  '♠D': 'spade_queen',
  '♠R': 'spade_king',
  '♥A': 'heart_1',
  '♥7': 'heart_7',
  '♥8': 'heart_8',
  '♥9': 'heart_9',
  '♥10': 'heart_10',
  '♥V': 'heart_jack',
  '♥D': 'heart_queen',
  '♥R': 'heart_king',
  '♦A': 'diamond_1',
  '♦7': 'diamond_7',
  '♦8': 'diamond_8',
  '♦9': 'diamond_9',
  '♦10': 'diamond_10',
  '♦V': 'diamond_jack',
  '♦D': 'diamond_queen',
  '♦R': 'diamond_king',
  '♣A': 'club_1',
  '♣7': 'club_7',
  '♣8': 'club_8',
  '♣9': 'club_9',
  '♣10': 'club_10',
  '♣V': 'club_jack',
  '♣D': 'club_queen',
  '♣R': 'club_king',
  'back': 'back',
}

// ── Chargement du sprite via DOMParser SVG ────────────────────────────────────

type SpriteState = 'loading' | 'ready' | 'error'
let _state: SpriteState = 'loading'
const _cbs = new Set<() => void>()

function _notify() { _cbs.forEach(fn => fn()) }

function loadSprite() {
  if (_state !== 'loading') return
  if (document.getElementById('__svg_cards__')) { _state = 'ready'; return }

  fetch('/svg-cards.svg')
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text() })
    .then(text => {
      // DOMParser mode SVG/XML : preserve les namespaces xlink indispensables
      const doc   = new DOMParser().parseFromString(text, 'image/svg+xml')
      const svgEl = doc.documentElement as unknown as SVGSVGElement

      if (svgEl.nodeName === 'parsererror') throw new Error('parse error')

      svgEl.id = '__svg_cards__'
      svgEl.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;'
      document.body.insertBefore(svgEl, document.body.firstChild)

      _state = 'ready'
      _notify()
    })
    .catch(err => {
      console.error('[CardSvg]', err)
      _state = 'error'
      _notify()
    })
}

if (typeof window !== 'undefined') loadSprite()

export function useSvgSprite(): SpriteState {
  const [s, setS] = useState<SpriteState>(() => _state)
  useEffect(() => {
    if (_state !== 'loading') { setS(_state); return }
    const cb = () => setS(_state)
    _cbs.add(cb)
    return () => { _cbs.delete(cb) }
  }, [])
  return s
}

// ── Rendu via ref + createElementNS (garantit le bon namespace SVG) ───────────

function SvgCard({ cardId }: { cardId: string }) {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = ref.current
    if (!svg) return

    // Vider le svg
    while (svg.firstChild) svg.removeChild(svg.firstChild)

    // Creer le <use> avec le bon namespace
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use')
    use.setAttribute('href', `#${cardId}`)
    svg.appendChild(use)
  }, [cardId])

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={CARD_W}
      height={CARD_H}
      viewBox={VB}
      style={{ display: 'block' }}
    />
  )
}

export function CardFaceSvg({ card }: { card: Card }) {
  const id = CARD_ID[`${card.suit}${card.rank}`]
  if (!id) return null
  return <SvgCard cardId={id} />
}

export function CardBackSvg() {
  return <SvgCard cardId="back" />
}
