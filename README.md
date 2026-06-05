# Twa Set

Variante haitienne du jeu de cartes a 2 joueurs. Premier a 21 points gagne.

## Stack

- **React 18** + **TypeScript 5**
- **Tailwind CSS 3**
- **Vite 5**
- **Vitest 2**
- **svg-cards** (David Bellot / htdebeer) — cartes francaises en SVG, licence LGPL

## Demarrage rapide

```bash
npm install        # installe les dependances ET copie svg-cards.svg dans public/
npm run dev        # http://localhost:5173
npm run test       # tests unitaires
npm run build      # build de production
```

> **Important** : `npm install` declenche automatiquement le script `postinstall`
> qui copie `node_modules/svg-cards/svg-cards.svg` vers `public/svg-cards.svg`.
> Sans cette etape, les cartes n'apparaissent pas.

## Structure

```
src/
├── types/          # Types TypeScript (Card, Rank, Suit, GameState...)
├── game/
│   ├── deck.ts     # Creation du jeu, melange, distribution
│   ├── rules.ts    # Regles (pli, validation, score)
│   ├── ai.ts       # Logique IA (niveau simple)
│   └── cardId.ts   # Mapping rang/couleur → ID SVG David Bellot
├── hooks/
│   └── useGameState.ts   # Machine d'etat (architecture imperative / snapshots)
├── components/
│   ├── CardComponent.tsx   # Cartes SVG David Bellot
│   ├── GameBoard.tsx
│   ├── StartScreen.tsx
│   ├── DonneEndScreen.tsx
│   └── GameEndScreen.tsx
├── test/
│   ├── deck.test.ts
│   ├── rules.test.ts
│   ├── ai.test.ts
│   ├── gameflow.test.ts    # Tests de non-regression
│   └── integration.test.ts
└── ...
public/
└── svg-cards.svg   # Copie automatique depuis node_modules apres npm install
scripts/
└── postinstall.cjs # Script de copie automatique
```

## Regles du jeu

| Cartes    | 32 (4 couleurs x 8 valeurs : 7 8 9 10 V D R A) |
|-----------|------------------------------------------------|
| Joueurs   | 2 (Humain vs IA)                               |
| Distribution | 7 cartes chacun, 18 en pioche              |
| Ordre de force | 10 > 9 > A > R > D > V > 8 > 7          |
| Obligation | Fournir la couleur ET couper si possible      |
| Pioche    | Gagnant du pli pioche en premier               |
| Score     | As = 1 pt · Trio de 10/9/R/D/V = 1 pt         |
| Victoire  | Premier a atteindre ou depasser 21 pts         |

## Credits cartes

Les cartes SVG sont l'oeuvre de **David Bellot** (2004), dans le fork maintenu
par **htdebeer**, publie sous licence **LGPL 2.1**.

- Source : https://github.com/htdebeer/SVG-cards
- NPM : https://www.npmjs.com/package/svg-cards
