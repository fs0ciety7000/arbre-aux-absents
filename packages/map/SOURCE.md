# Source de `packages/map`

Code copié puis adapté depuis le dépôt `fs0ciety7000/carte-mons` (mode **lecture**, voir
`docs/ARCHITECTURE.md` §0). Aucune dépendance au dépôt d'origine à l'exécution.

- Branche : `claude/project-thread-wmlu2o`
- Commit : `c5990ad493a854f97674f8e77c6050559203e59d` (2026-10-13, « docs: ROADMAP, préversion en ligne »)

## 1. Caméra pure (lot A3, backend) : `src/camera/**`

| Fichier ici | Repris de | Nature |
|---|---|---|
| `camera/types.ts` | `src/lib/contract/camera.ts` | `Camera`, `Viewport`, `CameraBounds`, `CameraOps`, `Renderer` ; `ScreenPoint` ajouté |
| `camera/camera.ts` | `src/lib/camera/camera.ts` | `clamp`, `zoomAt`, `panBy`, `fitTo`, `toScreen`, `toMap`, `baseScale`, `mapSizePx`, `visibleRect`, `cameraOps` ; `sameCamera` ajouté |
| `camera/motion.ts` | `src/lib/camera/camera.ts` (`easeCamera`, `easeInOutCubic`) + logique `flyTo` de `src/lib/carte/Viewport.svelte` | transitions pures ; **inertie nouvelle** (absente de la source) |
| `camera/keyboard.ts` | table `KEYS` et `onkeydown` de `src/lib/carte/Viewport.svelte` | action clavier pure |
| `camera/views.ts` | `firstView`, `focusPlace`, `reveal` de `src/lib/carte/Viewport.svelte` | vues pures |
| `camera/bounds.ts` | `bounds` et `overview` de `src/lib/carte/Viewport.svelte` | bornes depuis `WorldMap` |
| `camera/camera.test.ts` | `src/lib/camera/camera.test.ts` | repris tel quel (imports adaptés) |
| `camera/{motion,keyboard,views}.test.ts` | — | nouveaux |

### Adaptations

- **Repère normalisé** : identique à la source (fractions [0,1], origine en haut à gauche), typé par
  `NormPoint` de `@arbre/contract` au lieu du contrat local de carte-mons.
- **Aspect variable** : `CameraBounds.aspect` vient de `WorldMap.aspect`
  (`packages/contract/src/world.ts`) via `boundsFromWorldMap()` ; aucune constante d'aspect
  (la source testait √2). Les couches SVG ont un viewBox `0 0 1000·aspect 1000`.
- **minZoom / maxZoom** depuis `WorldMap` ; bornes aberrantes assainies (`safeBounds`), la caméra
  reste totale (NaN, viewport vide, bornes inversées).
- **Mouvement réduit** : la source lisait `matchMedia` dans le composant. Ici la préférence entre en
  paramètre (`MotionPrefs.reducedMotion`) : `transitionDuration()` vaut 0, `startTransition()` donne
  une transition instantanée (`cameraAt()` rend la cible dès le départ) et `shouldCoast()` refuse
  l'inertie. Le composant lit `prefers-reduced-motion` et pilote le temps (`requestAnimationFrame`).
- **Durées** : la source lisait les tokens `--carte-dur-*` par `getComputedStyle`. Ici la durée en ms
  est un paramètre ; le composant la lit dans les tokens de `packages/ui`.
- **Inertie** (nouveau) : `releaseVelocity()` (vitesse sur les 100 dernières ms, plafonnée à
  4 px/ms, nulle si le pointeur s'est arrêté avant de lâcher), `coastStep()` (décroissance
  exponentielle τ = 325 ms intégrée exactement, indépendante de la cadence ; s'arrête contre un bord
  ou sous 0,02 px/ms).
- **Focus sur un lieu** : `Place` n'a pas de `focusZoom` (contrairement à `ManifestPlace` de la
  source) ; `focusOn()` prend un zoom optionnel, par défaut `defaultFocusZoom()` = moyenne
  géométrique de minZoom et maxZoom. On ne dézoome jamais pour focaliser.
- **Première vue** : relative à `minZoom` (la source supposait la vue d'ensemble au zoom 1).
- **Aucun DOM** : `Renderer<Target = unknown>` (la source typait `HTMLElement`) ; `KeyInput` est le
  sous-ensemble utile de `KeyboardEvent`. Garanti à la compilation (tsconfig sans lib DOM).
- Style : Prettier du dépôt (2 espaces, virgules finales), imports sans extension, commentaires en
  français.

Couverture (v8, `packages/map/src/**`) : 100 % lignes et fonctions, 99 % branches.

## 2. Composants Svelte (lot B1b, frontend-jeu) : `src/svelte/**`

Fichiers de `src/lib/carte/` au même commit (`c5990ad493a854f97674f8e77c6050559203e59d`).
Sous-chemin `@arbre/map/svelte` (export `./svelte`, `svelte ^5` en peerDependency) ; vérifié par
`tsconfig.svelte.json` (lib DOM), la caméra garde son `tsconfig.json` sans DOM.

| Fichier ici | Repris de | Nature |
|---|---|---|
| `svelte/gestures.ts` | `gestures.ts` | glisser, pincer, molette au curseur, double-clic / double-tap repris ; attribut renommé `data-map-no-gesture` ; **échantillons `PanSample`** passés à `onend` pour l'inertie |
| `svelte/SvgRenderer.ts` | `SvgRenderer.ts` | `Renderer<HTMLElement>` : couches dans l'ordre `MAP_LAYERS`, transform CSS, `setMoving` ; couches reçues **en chaînes** (`world.layers` compilé) au lieu de fichiers hachés chargés en différé ; `setPlaceStates()` nouveau (états `mentioned/open/exhausted` sur les `<g id="place-…">`, lieux inconnus masqués) |
| `svelte/svg.ts` | — (nouveau) | `parseSvg()` (DOMParser, retire script/foreignObject/style, `on*`, `href` externes) et action `svgContent` : SVG de contenu inséré **sans `{@html}`** |
| `svelte/MapView.svelte` | `Viewport.svelte` + `CarteMons.svelte` | scène, caméra pure, gestes + inertie, clavier (flèches, + / −, 0, voisin directionnel sur un lieu), hotspots HTML ≥ 44 px (`Place.hitRadius`, déf. 24) avec pastilles `Badge`, étiquette survol/focus, focus caméra (`Place.focusZoom`), boutons zoom `IconButton`, mouvement réduit (`data-motion` ou `prefers-reduced-motion`, durées lues dans `--dur-*`). **Rendu de secours** sans couches d'art (papier, hachures, cadre, rose des vents, cartouche, points des lieux). |
| `svelte/index.ts` | `index.ts` | API publique refaite |

Non portés : `PlaceSheet.svelte`, `PlaceBody.svelte`, `PlaceLinks.svelte` (la fiche de lieu est
le panneau `apps/game/src/panels/MapPanel.svelte`, sans liens externes), `labels.ts` (textes dans
`apps/game/src/panels/messages.ts`), `art.css` (déjà dans `packages/ui/src/styles/art.css`),
`HatchDefs.svelte` (→ `ArtDefs` de `@arbre/ui`). Tokens `--carte-*` remplacés par ceux de
`packages/ui`.

Côté outillage (backend, `packages/content-tools`) : règles SVG de `src/lib/content/svg.ts` et
`validate.ts` (+ fixtures et tests) pour la règle 8 de `content:check`.
