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

## 2. À porter ensuite (frontend-jeu) : `src/svelte/**`

Fichiers de `src/lib/carte/` au même commit. Dépendances `#lib/…` de la source à remplacer comme
indiqué.

| Fichier source | Rôle | Dépendances à résoudre ici |
|---|---|---|
| `gestures.ts` | glisser, pincer, molette au curseur, double-clic / double-tap ; `wheelFactor`, `NO_GESTURE_ATTR` | aucune (DOM seul). Ajouter l'échantillonnage `PanSample` pour l'inertie (`releaseVelocity`, `coastStep`) ; renommer l'attribut `data-carte-no-gesture` |
| `SvgRenderer.ts` | implémente `Renderer<HTMLElement>` : couches SVG inline + chargement différé, transform CSS, `setMoving` (`will-change`) | `mapSizePx` (`@arbre/map/camera`) ; `ArtLayer` → `MapLayer` et ordre `MAP_LAYERS` (`@arbre/contract`) ; noms de fichiers hachés produits par `content:build` (`apps/*/src/generated/`) |
| `Viewport.svelte` | la carte : scène, caméra, gestes, clavier, hotspots, étiquette survol/focus, première vue CSS (`.vp--pre`) | `clamp`, `panBy`, `zoomAt`, `toScreen`, `mapSizePx`, `startTransition`/`cameraAt`, `keyAction`/`applyKeyAction`, `firstView`, `focusOn`, `reveal`, `boundsFromWorldMap`, `overview` (`@arbre/map/camera`) ; `Manifest`/`ManifestPlace` → `WorldMap` + `Place[]` ; `HatchDefs.svelte` et tokens `--carte-*` (durées, focus, espaces, textes, ombres) → `packages/ui` ; `hitRadius` par lieu absent de `Place` (rayon par défaut ou évolution du contrat à proposer) |
| `CarteMons.svelte` | composant public (→ `MapView.svelte`) : carte, liste des lieux, fiche, statut des couches, boutons zoom | `Viewport.svelte`, `PlaceSheet.svelte` (import dynamique), `tokens.css`, `art.css`, `VisuallyHidden`, `Icon`, `IconButton` (`packages/ui`) ; textes d'UI vers `apps/game/src/messages.fr.ts` |
| `PlaceSheet.svelte` | fiche d'un lieu en dialogue | `Dialog`, `Button` (`packages/ui`), `labels.ts` (`placeKicker`), `PlaceBody.svelte` |
| `PlaceBody.svelte` | corps de fiche | `Button` (`packages/ui`), `PlaceLinks.svelte` ; à adapter à `Place.description` |
| `PlaceLinks.svelte` | liens d'un lieu (jeu, artbook…) | `Button`, `Icon`, `Tag`, `VisuallyHidden`, `labels.ts` — probablement sans objet ici (pas de liens externes) |
| `labels.ts` | libellés FR (types de lieu, couches, crédits), `withSlash` | `Manifest` → `Place.kind` (`PLACE_KINDS`) ; crédits sans référence externe au monde réel |
| `art.css` | classes d'art des SVG → tokens | `ART_CLASSES` (`src/lib/contract/map.ts` de la source, absent de `@arbre/contract` : à proposer au contrat) ; `packages/ui/src/styles/art.css` existe déjà (design-lead) |
| `index.ts` | API publique de la carte | à refaire pour `src/svelte/index.ts` |

Côté outillage (backend, `packages/content-tools`) : règles SVG de `src/lib/content/svg.ts` et
`validate.ts` (+ fixtures et tests) pour la règle 8 de `content:check`.
