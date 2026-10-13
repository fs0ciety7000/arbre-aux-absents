# DESIGN — Système de design {{NOM}}

> Source de vérité de l'UI. Rempli par `/design-system` (agent `design-lead`).
> Tokens : `{{src/app/globals.css}}`. Primitives : `src/components/ui/`.
> Démo interne (non indexée) : **`/design`**.
> Tout nouveau token ou primitive est ajouté ici **dans le même changement**.

## 1. Vision

{{Une métaphore forte en une phrase (ex. « studio nocturne »), puis 3-4 piliers.}}

| Pilier | Traduction concrète |
|---|---|
| Moderne | |
| Premium | |
| Performant | Server Components par défaut, polices auto-hébergées, animations transform/opacity uniquement. |
| Accessible | AA partout, focus visibles, tout utilisable au clavier et sans animation. |

### Principes
1. Le contenu d'abord ; l'UI s'efface autour.
2. Une seule couleur d'accent = action / état actif. Jamais en décor massif.
3. Profondeur par la lumière (surfaces un cran plus claires + liserés), pas par des ombres lourdes.
4. Le mouvement porte un sens (entrer, sortir, relier, confirmer) — sinon on le supprime.

## 2. Couleurs (OKLCH)

Palette Tailwind par défaut désactivée (`--color-*: initial`) : seuls ces tokens existent.

| Token | Valeur | Usage |
|---|---|---|
| `canvas` | | Fond de page |
| `surface` / `surface-2` / `surface-3` | | Cartes, survols, élévations |
| `line` / `line-strong` | | Bordures |
| `text` / `text-muted` / `text-faint` | | Texte (contraste AA vérifié) |
| `accent` / `accent-contrast` | | Action, focus, état actif |
| `danger` / `success` / `warning` | | États |

## 3. Typographie

{{Display + texte (next/font, auto-hébergées), échelle fluide `clamp()`, interlignage, graisses.}}

## 4. Espacement, rayons, grille

{{Échelle 4 px, rayons, conteneurs, breakpoints, gouttières (16 px min en mobile).}}

## 5. Motion

| Token | Valeur | Usage |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrées |
| `--ease-in-out` | | Transitions d'état |
| `--dur-fast` / `--dur-base` / `--dur-slow` | 150 / 300 / 600 ms | |

- GSAP (timelines, ScrollTrigger) via `useGSAP` avec cleanup ; Motion pour micro-interactions.
- `prefers-reduced-motion: reduce` → durées ~0, pas de parallax, pas de smooth scroll.
- Animer uniquement `transform`, `opacity`, `filter`.

## 6. Primitives UI

| Primitive | Variantes | États | a11y |
|---|---|---|---|
| `Button` | primary / ghost / icon | hover, focus-visible, active, disabled, loading | |
| `Input` | | | label associé |
| `Card` | | | |
| `Badge`, `Tooltip`, `Dialog`, `Toast`… | | | |

## 7. Checklist de conformité (utilisée par qa-reviewer)

- [ ] Aucune couleur/espacement en dur hors tokens
- [ ] Contrastes AA, focus visibles
- [ ] Reduced motion respecté
- [ ] Mobile 360 px sans scroll horizontal
