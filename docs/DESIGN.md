# DESIGN — Système de design de *L'Arbre aux absents*

> Source de vérité de l'UI, du mouvement et de l'illustration. Tenu par l'agent `design-lead`.
> **v1 — 13 oct. 2026.** Toute UI du jeu et du site s'y conforme.
>
> | Quoi | Où |
> |---|---|
> | Tokens | `packages/ui/src/styles/tokens.css` (palette brute, sémantique, contextes, réglages) |
> | Base globale | `packages/ui/src/styles/base.css` (reset, typo, focus, mots-clés, surlignages, curseurs) |
> | Polices | `packages/ui/src/styles/fonts.css` + `packages/ui/src/fonts/` (WOFF2 + licences OFL) |
> | Classes d'art | `packages/ui/src/styles/art.css` + liste `ART_CLASSES` dans `packages/ui/src/art-classes.ts` |
> | Entrée CSS | `packages/ui/src/styles/index.css` (fonts → tokens → base → art), importée une fois par app |
> | Primitives | `packages/ui/src/primitives/*.svelte` (Svelte 5, runes), barrel `primitives/index.ts` |
> | Contrastes | `node packages/ui/scripts/contrast.mjs` (`--md` pour les tableaux, `--strict` pour la CI) |
> | Démo | `apps/site/src/routes/design` → **`/design`** (non indexée) |
>
> Tout nouveau token, classe d'art ou primitive est ajouté ici **dans le même changement**, et
> visible sur `/design`.

---

## 1. Vision

### « Le bureau sous la lampe »

Il est tard. Sur un bureau d'enquêteur plongé dans le bleu de la nuit, une lampe de laiton
éclaire des archives : lettres, registres, photographies, une carte dépliée. Tout ce qui est
**à lire** est du **papier dans la lumière** ; tout ce qui est **outil** est le **bureau dans
l'ombre**, net, contemporain, discret. Le joueur ne voit jamais l'interface : il voit des
documents posés sur une table, et une lampe qui désigne l'action suivante.

C'est une identité **propre au jeu**. De la carte de Mons, on garde la technique d'illustration
demandée (gravure rehaussée d'aquarelle, SVG en couches colorées par classes) mais aucun token :
ici l'encre est **ferro-gallique bleu-noir** (et non sépia), les pigments sont autres (safran,
carmin, céladon…), la typographie est une serif de lecture contemporaine (Literata) et non une
fonte de graveur, et l'accent est le **laiton de la lampe** (et non le vermillon). Aucune
référence aux autres projets de la maison, hormis les logos de crédits (§11).

| Pilier | Traduction concrète |
|---|---|
| **La lampe** (focus) | Bureau sombre par défaut, papier clair : l'œil va au document. Une seule couleur d'action, le laiton (`--accent`), qui est aussi la lumière du focus. Halo de lampe très discret sur le fond (`--lamp-glow`). |
| **Le papier se touche** (point & click) | Documents = objets : feuilles inclinées d'un degré, grain, ombre portée chaude, recto/verso, loupe, tampons, punaises. Curseurs contextuels par verbe (§2). |
| **Moderne et net** | Chrome d'interface sans ornement : Instrument Sans, surfaces à liseré de lumière, rayons doux (10–16 px), icônes au trait. Le décor vit dans le contenu, jamais dans les boutons. |
| **Lisible partout** | AA calculé dans tous les contextes, AAA en contraste élevé, texte ≥ 16 px à 100 %, 5 crans de taille, police de lisibilité, manuscrit remplaçable, cibles ≥ 44 px, clavier/manette/tactile, mouvement coupé à la demande. |

### Pourquoi un thème sombre par défaut (et pas de thème clair)

1. **Contraste de matières** : les documents (80 à 120, le cœur du jeu) sont du papier clair.
   Sur un bureau sombre ils se détachent sans cadre ni ombre lourde ; sur un fond clair, papier
   et interface se confondraient.
2. **Sessions longues** (6 à 10 h, souvent le soir, sur téléphone) : moins d'éblouissement,
   le texte long reste sur papier clair, lisible.
3. **Récit** : « les absents », les archives exhumées, l'enquête nocturne. La lampe est la
   métaphore de l'attention du joueur.
4. Le contrat `Settings` n'a pas d'option de thème : **un thème + un mode contraste élevé**
   (`highContrast`) suffisent, et chaque thème supplémentaire double le calcul AA. Un thème
   « jour » reste possible plus tard : il ne redéfinirait que la couche sémantique.

### Principes

1. **Le contenu d'abord** : documents, arbre, carte. L'interface s'efface autour (surfaces sombres, peu de bordures).
2. **Une lampe = une action** : `--accent` désigne l'action principale, la sélection, le focus. Jamais en décor massif ; un seul bouton `primary` par vue.
3. **Profondeur par la lumière** : surfaces un cran plus claires + liseré haut (`--edge-light`) ; le papier, lui, a une ombre portée chaude. Pas d'ombre grise lourde.
4. **Le mouvement porte un sens** : la feuille *se pose*, le tampon *frappe*, l'indicateur *s'encre*. Sinon on le supprime. Jamais bloquant.
5. **Jamais la couleur seule** : chaque état a une forme (soulignement pointillé/plein, icône, motif, position).

---

## 2. Références point & click, traduites en UI moderne

| Référence point & click | Traduction dans le jeu | Implémentation |
|---|---|---|
| **La scène** (un décor qu'on explore) | Le **Bureau** est l'unique écran de jeu : une table nocturne où l'on pose l'arbre, les documents et la carte. Sur l'écran titre (E02), un **bureau illustré** dont les objets sont les entrées du menu (la lampe = Continuer, la boîte d'archives = Charger, le carnet = Options…), doublés d'une liste de boutons classique. | Zone principale + volet latéral (§5.3) ; écran titre : illustration SVG + `Button`s. |
| **Curseurs contextuels** | Le curseur annonce le verbe disponible : **Regarder** (loupe), **Prendre** (main), **Déplacer** (main fermée), **Écrire** (plume), **Épingler** (punaise), **Utiliser** (flèche vers l'arbre). Flèche d'encre + pastille du verbe, lisible sur papier comme sur nuit. | Tokens `--cursor-*`, attribut `data-verb="look|take|hold|write|pin|use"` (base.css). |
| **Verbes** (Regarder / Prendre / Utiliser) | La **bulle d'action** d'un mot-clé ou d'un visage propose des verbes, toujours dans le même ordre et avec les mêmes icônes que les curseurs : Rechercher, Voir au carnet, Épingler, Utiliser dans l'arbre. | Popover de `Button variant="ghost"` + `Icon` `search`, `notebook`, `pin`, `use` ; raccourcis `KeyHint`. |
| **Révéler les points d'intérêt** (touche « hotspots ») | Maintenir **Espace** (clavier) / **LT** (manette) / bouton « Repérer » (tactile) entoure d'un anneau toutes les zones actives du document ou de la carte : mots-clés, visages, cachets. Pas de chasse au pixel. | `FocusRing` en mode `rect` avec `visible`, ou `.kw` en `:root[data-hotspots]` (à ajouter par le frontend, état d'UI). |
| **Inventaire** | Les **Archives** sont le sac : vignettes de documents (`Card variant="document"`), pastille « non lu », tri, filtres. On « prend » un document pour le poser dans le Lecteur ou sur le Tableau. | `Card`, `Badge`, `Tabs`. |
| **Objets manipulables** | Le document se **pose** (léger rebond), se **retourne** (recto/verso), se **zoome** à la loupe ; la photo a un dos manuscrit ; le registre a des lignes surlignables. | `--ease-paper`, bouton `flip`, `IconButton` zoom, `.hl-*`. |
| **Combiner deux objets** | Glisser un terme ou un visage sur un champ de l'arbre (ou « Prendre → Déposer » au clavier/manette). Le champ cible s'éclaire en lavis laiton pendant le survol. | Curseur `--cursor-hold` / `use`, `--accent-tint`. |
| **Dialogues / cinématiques** | **Cartes de révélation** : une fiche papier qui se pose au centre (≤ 120 mots), refermable. | `Dialog surface="paper"`. |
| **Journal de quête** | Le **Journal** : registre de l'enquête, tampons « Établi » en marge. | `Panel`, `Stamp`. |
| **Feedback de réussite** | Le **tampon** violet « Établi » frappe les cases verrouillées, en cascade (120 ms). | `Stamp animate delay={i}`. |

Le curseur ne porte **jamais** seul une information : l'élément survolé est aussi souligné,
iconé ou décrit (P5 : rien en survol seul, rien sur téléphone).

---

## 3. Couleurs (OKLCH)

### 3.1 Architecture

1. **Palette brute** `--raw-*` : nuit, vélin, laiton, encre de tampon, états, papiers, encres. **Jamais lue par un composant.**
2. **Sémantique** : `--canvas`, `--surface-*`, `--text*`, `--accent*`… seule couche lue par les composants.
3. **Contextes** qui remappent la sémantique :
   - **lampe** (`:root`, défaut) — le bureau sombre ;
   - **papier** (`[data-surface='paper']`, sur un document, une fiche papier, le Lecteur, la carte) — tous les composants à l'intérieur (boutons, pastilles, focus) prennent automatiquement les couleurs papier ;
   - **contraste élevé** (`:root[data-contrast='high']`, + `… [data-surface='paper']`) — AAA pour le texte.

Aucune palette de framework, aucune couleur littérale dans les composants. Seules exceptions
documentées : les images de curseur (`--cursor-*`, une image ne lit pas les variables) et les
masques/grains en data-URI (alpha seulement).

### 3.2 Contexte lampe (défaut)

| Token | Valeur | ≈ hex | Usage |
|---|---|---|---|
| `--canvas` | `--raw-night-950` `oklch(0.17 0.022 258)` | #091019 | Fond du bureau |
| `--surface-1` | `--raw-night-900` `oklch(0.215 0.024 258)` | #131a25 | Panneaux, fiches |
| `--surface-2` | `--raw-night-850` `oklch(0.255 0.026 258)` | #1b232f | Champs, survols, pieds de panneau |
| `--surface-3` | `--raw-night-800` `oklch(0.3 0.028 258)` | #252e3c | Creux, pistes, pastilles douces |
| `--line` | `--raw-night-700` `oklch(0.37 0.026 258)` | #37404e | Séparateurs (décor, < 3:1 assumé) |
| `--line-strong` | `--raw-night-500` `oklch(0.6 0.03 258)` | #758193 | Bordures de contrôles (≥ 3:1) |
| `--text` | `--raw-vellum-100` `oklch(0.95 0.012 88)` | #f2eee6 | Texte |
| `--text-muted` | `--raw-vellum-300` `oklch(0.81 0.018 85)` | #c6c0b4 | Texte secondaire |
| `--text-faint` | `--raw-night-400` `oklch(0.66 0.025 258)` | #8993a2 | Grand texte, désactivé, décor |
| `--accent` | `--raw-brass-400` `oklch(0.81 0.125 78)` | #edb65c | Laiton : action, lien, sélection |
| `--accent-strong` | `--raw-brass-300` `oklch(0.87 0.11 84)` | #f6ce7d | Survol du primaire |
| `--accent-contrast` | `--raw-night-1000` `oklch(0.14 0.02 258)` | #050911 | Texte sur laiton |
| `--accent-tint` | `oklch(0.81 0.125 78 / 0.14)` | — | Lavis de survol, cible de dépôt |
| `--focus` | `--raw-brass-300` | #f6ce7d | Anneau de focus (3 px) |
| `--focus-halo` | `--raw-night-1000` | #050911 | Halo de séparation de l'anneau (`FocusRing`) |
| `--danger` | `--raw-red-300` `oklch(0.75 0.14 25)` | #fa8880 | Erreur |
| `--success` | `--raw-green-300` `oklch(0.8 0.12 160)` | #71d6a3 | Succès, « tout consulté » |
| `--warning` | `--raw-orange-300` `oklch(0.8 0.13 55)` | #fea668 | Avertissement |
| `--info` | `--raw-blue-300` `oklch(0.8 0.08 230)` | #87c8e8 | Information, lieu « mentionné » |
| `--established` | `--raw-stamp-300` `oklch(0.76 0.12 300)` | #bd9ff2 | Encre violette des tampons : case **établie** |
| `--established-contrast` | `--raw-night-1000` | #050911 | Texte sur tampon plein |
| `--keyword` | = `--accent` | #edb65c | Soulignement des mots-clés |
| `--selection` | `oklch(0.6 0.1 78 / 0.45)` | — | Sélection de texte |
| `--scrim` | `oklch(0.1 0.02 258 / 0.66)` | — | Voile sous les modales |
| `--lamp-glow` | `oklch(0.81 0.125 78 / 0.07)` | — | Halo de lampe du fond (`body`) |
| `--edge-light` | `oklch(1 0 0 / 0.06)` | — | Liseré haut des surfaces (dans `--shadow-*`) |

**Pourquoi violet pour « Établi »** : l'encre violette est celle des tampons administratifs ;
elle sépare la **vérité établie** (violet + cadenas + tampon) de l'**action** (laiton). Le
game design parlait d'un « cadre doré » : le laiton étant l'accent d'action, le doré créerait
une confusion ; on garde la forme (cadre épais 2 px, cadenas, tampon) avec l'encre violette.

### 3.3 Contexte papier (`[data-surface='paper']`)

Papiers et encres sont aussi exposés en tokens globaux (`--paper*`, `--ink*`) pour les documents
rendus hors d'un conteneur papier.

| Token sémantique | → token papier | Valeur | ≈ hex | Usage |
|---|---|---|---|---|
| `--canvas` | `--paper` | `oklch(0.955 0.018 90)` | #f5f0e3 | Papier |
| `--surface-1` | `--paper-new` | `oklch(0.978 0.01 92)` | #faf8f0 | Papier neuf (fiches, boutons) |
| `--surface-2` | `--paper-aged` | `oklch(0.925 0.024 88)` | #ede6d5 | Papier vieilli (survols, pieds) |
| `--surface-3` | `--paper-stain` | `oklch(0.89 0.03 84)` | #e4dac5 | Papier piqué (creux) |
| `--line` | `--paper-line` | `oklch(0.84 0.025 86)` | #d2cab9 | Filets |
| `--line-strong` | `--paper-line-strong` | `oklch(0.58 0.035 262)` | #6f7b90 | Bordures de contrôles |
| `--text` | `--ink` | `oklch(0.27 0.045 264)` | #1b263d | Encre ferro-gallique bleu-noir |
| `--text-muted` | `--ink-muted` | `oklch(0.44 0.045 262)` | #45536c | Encre diluée |
| `--text-faint` | `--ink-faint` | `oklch(0.58 0.035 262)` | #6f7b90 | Mine de plomb |
| `--accent` / `--focus` / `--keyword` | `--paper-accent` | `oklch(0.48 0.1 66)` | #835010 | Laiton bruni |
| `--accent-strong` | `--paper-accent-strong` | `oklch(0.43 0.095 62)` | #744207 | Survol |
| `--accent-contrast` | `--paper-new` | | #faf8f0 | Texte sur laiton bruni |
| `--danger` / `--success` / `--warning` / `--info` | `--raw-*-700` | | #a5292b / #266741 / #a24e10 / #13618d | États |
| `--established` | `--raw-stamp-700` `oklch(0.46 0.16 300)` | | #673ba2 | Tampon violet |
| — | `--ink-hand` | `oklch(0.38 0.1 258)` | #1d4176 | Encre bleue de plume (manuscrit) |
| — | `--ink-type` | `oklch(0.26 0.012 260)` | #21242a | Ruban de machine à écrire |

Grain : `--paper-grain-image` (bruit fractal en data-URI, alpha 0,09) à l'opacité
`--paper-grain` (0,5 ; 0 en contraste élevé ou `data-texture='off'`), via la classe `.grain`.

### 3.4 Surlignages (5 couleurs, 5 motifs)

| Token | Valeur | Motif (classe `.hl-n`) | Texte dessus |
|---|---|---|---|
| `--hl-1` | `oklch(0.9 0.13 98 / 0.6)` jaune | plein | 12,3:1 |
| `--hl-2` | `oklch(0.87 0.1 150 / 0.55)` vert | hachuré à −45° | 11,6:1 |
| `--hl-3` | `oklch(0.85 0.07 235 / 0.6)` bleu | pointillé (trame 5 px) | 11,2:1 |
| `--hl-4` | `oklch(0.85 0.08 350 / 0.55)` rose | soulignement ondulé | 11,4:1 |
| `--hl-5` | `oklch(0.86 0.09 60 / 0.6)` orange | encadré 1,5 px | 11,6:1 |

Couleurs forcées : tous deviennent `Mark` / `MarkText`. Palettes daltonisme (GAME_DESIGN §17) :
le motif suffit à distinguer ; des palettes alternatives redéfiniront `--hl-*` seulement.

### 3.5 Contraste élevé (`data-contrast='high'`)

Noir/blanc neutres, accent jaune `oklch(0.9 0.125 90)`, encre papier `oklch(0.13 0.02 264)` sur
blanc, plus de grain, plus de liseré ni de halo, soulignements de mots-clés 3 px, tampons sans
masque d'usure, lavis de carte à 0,35. Tous les textes ≥ **7:1** (tableaux en annexe §14).

### 3.6 Contrastes calculés (résumé)

Méthode : OKLCH → OKLab → sRGB linéaire (Ottosson) → luminance WCAG → `(L1 + 0,05)/(L2 + 0,05)` ;
couleurs translucides composées en sRGB sur leur fond. Toutes les valeurs sont dans le gamut
sRGB (le script le vérifie). **213 paires, toutes conformes** (détail : annexe §14).

| Paire (pire cas) | Lampe | Papier | Lampe HC | Papier HC |
|---|---|---|---|---|
| `--text` sur `--surface-3` | 13,4 | 12,3 | 18,9 | 18,7 |
| `--text-muted` sur `--surface-3` | 7,9 | 6,0 | 15,0 | 13,2 |
| `--accent` sur `--surface-2` (texte) | 8,3 | 5,6 | 13,3 | 9,0 |
| `--accent-contrast` sur `--accent` | 10,4 | 6,6 | 16,4 | 10,6 |
| `--focus` sur `--surface-3` (non-texte ≥ 3) | 8,9 | 4,9 | 13,3 | 8,6 |
| `--line-strong` sur `--surface-2` (≥ 3) | 3,9 | 3,4 | 13,0 | 15,0 |
| `--established` sur `--surface-1` | 7,1 | 7,4 | 12,2 | 11,0 |
| `--text-faint` sur `--surface-1` (grand texte ≥ 3) | 5,4 | 4,0 | 11,0 | 8,5 |

Commande : `node packages/ui/scripts/contrast.mjs` (lisible), `--md` (tableaux), `--strict` (code
de sortie 1 si une paire échoue — **à brancher dans `npm run check`**, voir §13).

---

## 4. Typographie

Polices **SIL OFL 1.1**, auto-hébergées, WOFF2 issus de `@fontsource` 5.3.0, en deux tranches
`latin` / `latin-ext` déclarées par `unicode-range` : la tranche étendue (ŀ, ő, ș, ẞ…) n'est
téléchargée que si la langue inventée l'utilise. `font-display: swap`, replis métriques
(`Literata fallback` sur Georgia, `Instrument Sans fallback` sur Arial). Licences :
`packages/ui/src/fonts/OFL-*.txt` et `LICENSES.md`. **Aucune police pixel art.**

| Rôle | Token | Police | Fichiers (latin + ext) | Poids |
|---|---|---|---|---|
| Lecture, documents imprimés, titres | `--font-read`, `--font-display` | **Literata** (variable opsz 7–72, wght 200–900 ; italique wght) — serif de lecture longue, dessin « display » automatique aux grandes tailles | opsz normal 107,5 + 87,6 Ko ; italique 52,5 + 42,2 Ko | 400 texte, 600 titres |
| Interface | `--font-ui` | **Instrument Sans** (variable wght 400–700) — grotesque contemporaine, chiffres tabulaires | 29,4 + 10,9 Ko | 400, 500, 600 |
| Machine à écrire | `--font-type` | **Courier Prime** 400/700 — documents dactylographiés, fiches du Catalogue, tampons | 18,2 + 18,9 (+ 12,4 + 12,6) Ko | 400, 700 |
| Manuscrite décorative | `--font-hand` | **Caveat** (variable) — lettres, dos de photos, annotations. **Remplaçable** | 73,2 + 28,8 Ko | 400–600 |
| Lisibilité (option) | `--font-legible` | **Atkinson Hyperlegible Next** (variable, + italique) | 33,2 + 18,6 ; ital. 36,8 + 19,7 Ko | 400–700 |

**Budget au premier écran** : Instrument Sans latin (29 Ko) + Literata opsz latin (108 Ko) =
**137 Ko**, les deux seuls préchargements autorisés (`<link rel="preload" as="font" crossorigin>`).
Courier Prime et Caveat n'arrivent qu'à l'ouverture d'un document qui les utilise.
Pas d'italique sans-serif : l'interface n'en a pas besoin (`font-synthesis: none`).

### 4.1 Échelle fluide (360 → 1280 px), multipliée par `--text-scale`

Chaque pas vaut `calc(clamp(min, …vw, max) * var(--text-scale))`, en `rem` (respecte la taille
de police du système).

| Token | Plage à 100 % | Usage |
|---|---|---|
| `--step-5` | 40 → 68 px | Titre du site (hero) |
| `--step-4` | 32 → 48 px | `h1`, titre d'écran |
| `--step-3` | 26 → 34 px | `h2` |
| `--step-2` | 22 → 26 px | `h3`, titre de modale |
| `--step-1` | 19 → 21 px | `h4`, titres de panneau et de fiche, bouton `l` |
| `--step-read` | 17 → 19 px | Texte des documents et transcriptions (`.reading`) |
| `--step-0` | 16 → 17 px | Interface, texte courant (minimum absolu du texte lu) |
| `--step--1` | 14 → 15 px | Métadonnées, surtitres en capitales, pastilles, touches. **Jamais** pour un texte qu'il faut lire pour jouer |

`--hand-boost` (1,3) : Caveat a un petit œil, elle s'affiche à 130 % (1 si remplacée).
Interlignage : `--leading-tight` 1,1 · `--leading-snug` 1,3 · `--leading-ui` 1,4 · `--leading-read` 1,6 (1,8 en lisibilité).
Approche : `--tracking-caps` 0,08 em (surtitres) · `--tracking-label` 0,02 em (boutons) · `--tracking-read` 0 (0,05 em en lisibilité).
Graisses : `--weight-regular` 400 · `--weight-medium` 500 · `--weight-semibold` 600 · `--weight-bold` 700. Mesure : `--measure` 66 ch.

Conventions : titres Literata 600, `text-wrap: balance` ; paragraphes `text-wrap: pretty` ;
texte **jamais justifié** ; capitales espacées réservées aux surtitres et à la carte ;
`.num` = chiffres tabulaires alignés (compteurs, dates, chrono).

### 4.2 Réglages joueur (posés sur `<html>` par le jeu)

| `Settings` | Attribut | Effet |
|---|---|---|
| `textScale: 1 \| 1.25 \| 1.5 \| 2` | `data-text-scale="1.25"`… | `--text-scale` multiplie toute l'échelle |
| `readingFont: 'hyperlegible'` | `data-reading-font="hyperlegible"` | Atkinson pour la lecture **et** l'interface ; interlignage 1,8 ; approche +0,05 em ; titres restent en Literata |
| `replaceHandwriting: true` | `data-handwriting="replace"` | `--font-hand` → `--font-read`, le style (couleur d'encre) reste |
| `highContrast: true` | `data-contrast="high"` | Contexte contraste élevé (§3.5) |
| `motion: 'reduced' \| 'full'` | `data-motion="reduced"` / `"full"` | Force ou ignore `prefers-reduced-motion` ; `'system'` = attribut absent |
| *(à ajouter au contrat)* | `data-texture="off"` | Option « réduire la texture papier » (GAME_DESIGN §17) |

Sous 360 px CSS effectifs (texte à 200 %), les dispositions passent au cran inférieur
(cf. §5.2 : les points de rupture sont en `rem`, ils suivent la taille du texte système).

---

## 5. Espacement, rayons, mise en page

### 5.1 Tokens

- **Échelle 4 px** : `--space-{0, px, 0-5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24}` = 0 · 1 px · 2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 px.
- **Gouttière** `--gutter` : 16 px à 360 px → 32 px à 1280 px.
- **Rayons** : `--radius-paper` 2 px (tout ce qui est papier) · `--radius-xs` 4 · `--radius-s` 6 (boutons, champs) · `--radius-m` 10 (fiches, cases) · `--radius-l` 16 (panneaux, modales) · `--radius-xl` 24 · `--radius-pill`.
- **Traits** : `--border` 1 px, `--border-strong` 2 px (case établie, champ en erreur).
- **Cibles** : `--hit` 44 px (minimum de tout contrôle), `--hit-l` 48 px (Android, boutons `l`), `--hit-row` 56 px (lignes de liste, en-tête téléphone).
- **Bureau** : `--header-h` 48 / `--header-h-phone` 56 · `--rail-w` 64 / `--rail-w-tablet` 56 · `--tabbar-h` 64 · volet latéral `--side-min` 360, `--side-default` 440, `--side-max` 640, pas `--side-step` 40 · `--mini-reader-h` 72 · `--drawer-handle` 24 · popover `--popover-w` 320 × `--popover-max-h` 480 · feuille `--sheet-w` 480 · case d'arbre `--slot-w` 144 × `--slot-h` 168.
- **Conteneurs (site)** : `--container` 76 rem, `--container-narrow` 44 rem.

### 5.2 Points de rupture

Les variables ne sont pas admises dans les media queries : valeurs en dur, **en rem**.

| Nom | Media query | Correspond à |
|---|---|---|
| téléphone | `(max-width: 37.4375rem)` | < 600 px |
| tablette | `(min-width: 37.5rem) and (max-width: 79.9375rem)` | 600–1279 px |
| desktop | `(min-width: 80rem)` | ≥ 1280 px |
| paysage bas | `(max-height: 30rem) and (orientation: landscape)` | téléphone couché : en-tête 48 px, barre d'onglets à gauche (rail) |

### 5.3 Le Bureau (jeu)

**Desktop ≥ 1280 px** — trois zones, Arbre + Lecteur côte à côte par défaut (réponse à ECRANS §6.1).

```
┌──────────────────────── En-tête 48 px (surface-1, liseré bas) ────────────────────────┐
│ ← · L'Arbre aux absents     12 / 30 identifiés · 2 / ? secrets · 01:12:40 · ? · ⏸      │
├──────┬────────────────────────────────────────┬──────────────────────────────────────┤
│ Rail │ Zone principale (canvas + halo lampe)  │ Volet latéral 360–640 (déf. 440)      │
│ 64px │ Arbre / Carte / Tableau d'épingles     │ Tabs line : Lecteur · Archives ·      │
│ Tabs │ Panel sans bord, plein cadre           │ Catalogue · Carnet · Journal · Aide   │
│ rail │                                        │ Lecteur = Panel surface="paper"       │
│      │                                        │ poignée 8 px (col-resize), Ctrl+[ ]   │
└──────┴────────────────────────────────────────┴──────────────────────────────────────┘
grid-template-columns: var(--rail-w) minmax(0, 1fr) clamp(var(--side-min), var(--side-w), var(--side-max))
gap: var(--space-3) ; padding: var(--space-3) ; deux Lecteurs comparés = volet de 2 × 360 min.
```

**Tablette 600–1279 px** — paysage : rail 56 px + zone principale 55 % + volet 45 % ; portrait :
zone principale plein écran + **tiroir bas** (`Panel` dans une feuille à deux crans 40 % / 90 %,
poignée `--drawer-handle`) et barre d'onglets basse `Tabs variant="bar"`.

**Téléphone 360–599 px** — un panneau à la fois.

```
┌──────── En-tête 56 px : ← · 12/30 · ? · ≡ ────────┐   gouttière 16 px
│ Panneau actif plein écran (Panel sans bordure,      │   Arbre : vue par génération,
│ rayon 0)                                            │   cases 144 × 168, balayage
│                                                     │
│ [ Mini-lecteur 72 px : surface papier, titre +      │   Card variant="document" réduite
│   extrait surligné, ↑ pour rouvrir ]                │
├─────────────────────────────────────────────────────┤
│ Arbre │ Archives │ Catalogue │ Carnet │ Carte       │   Tabs variant="bar", 64 px
└─────────────────────────────────────────────────────┘   + env(safe-area-inset-bottom)
```

Sélecteur de candidat : popover 320 px (desktop), feuille centrée 480 px (tablette), feuille
basse plein écran (téléphone) → `Dialog mobile="fullscreen"` + `Combobox mode="inline"`.

### 5.4 Le site vitrine

Même identité, même thème sombre : « la carte éclairée ».

- **En-tête** 64 px, logo-titre du jeu (wordmark Literata 600), navigation (Le jeu · Le monde ·
  Artbook · Charte · Presse), bouton `primary` « Jouer à la démo » (un seul).
- **Accueil** : hero plein cadre = la **carte du monde** (SVG) sous la lampe (halo), titre
  `--step-5`, accroche `--step-1`, deux actions ; puis bandes alternées *papier* (documents
  inclinés, captures) / *nuit* (texte) ; grille de portraits ; pied avec crédits et logos.
- **Grille** : conteneur 76 rem, 12 colonnes desktop (`gap: var(--space-6)`), 6 tablette, 1 téléphone ;
  gouttière `--gutter`. Texte long ≤ `--measure`.
- **Artbook** : grille masonry simple (colonnes CSS), chaque planche en `Card variant="document"` ou `photo`.
- 360 px : tout passe en une colonne, la carte devient une image recadrée + bouton « Explorer la carte ».

---

## 6. Profondeur

| Token | Lampe | Papier | Usage |
|---|---|---|---|
| `--shadow-1` | liseré + 0 1px 2px | 0 1px 2px brun 18 % | Boutons, fiches |
| `--shadow-2` | liseré + 0 6px 16px −4px | 0 4px 12px −4px | Panneaux, popovers |
| `--shadow-3` | liseré + 0 24px 48px −12px | 0 18px 40px −12px | Modales, toasts |
| `--shadow-inset` | creux 35 % | creux 14 % | Champs de saisie |
| `--shadow-paper` | double ombre chaude | — | Feuille posée sur le bureau |
| `--shadow-lifted` | double ombre plus haute | — | Feuille saisie (glisser) |

Les ombres sont chaudes (teinte 60–70) sous le papier, bleu-nuit sous les surfaces : jamais de gris.
En contraste élevé papier, elles deviennent un trait de 2 px.

Calques : `--z-desk` 0 · `--z-raised` 1 · `--z-rail` 10 · `--z-header` 20 · `--z-drawer` 30 ·
`--z-popover` 40 · `--z-dialog` 50 · `--z-toast` 60 · `--z-tooltip` 70 · `--z-drag` 80 · `--z-skip` 100.

---

## 7. Mouvement

| Token | Valeur | Réduit | Usage |
|---|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | — | Entrées, survols |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | — | Caméra, changements d'état |
| `--ease-in` | `cubic-bezier(0.5, 0, 0.75, 0)` | — | Sorties |
| `--ease-paper` | `cubic-bezier(0.22, 1.2, 0.36, 1)` | — | **La feuille se pose** (léger rebond) |
| `--ease-stamp` | `cubic-bezier(0.55, 0, 0.3, 1.45)` | — | **Le tampon frappe** |
| `--dur-instant` | 80 ms | 0,01 ms | Appui (translate 1 px / scale 0,94) |
| `--dur-fast` | 140 ms | 0,01 ms | Petits déplacements |
| `--dur-base` | 220 ms | 0,01 ms | Indicateurs, lavis qui prend, carte qui se soulève |
| `--dur-open` | 250 ms | 0,01 ms | Ouverture d'un document, d'une modale (GAME_DESIGN §3.4) |
| `--dur-slow` | 420 ms | 0,01 ms | Révélations |
| `--dur-stamp` | 320 ms | 0,01 ms | Frappe du tampon |
| `--dur-camera` | 600 ms | 0,01 ms | Caméra de la carte et de l'arbre (interruptible) |
| `--dur-loop` | 1000 ms | figé | Spinner, plume du `Loader` |
| `--stagger` | 120 ms | 0 | Cascade des tampons de verrouillage (≤ 900 ms au total) |
| `--dur-fade-fast` | 140 ms | **100 ms** | Fondus courts (tampon, survols) |
| `--dur-fade` | 220 ms | **150 ms** | Fondus (modales, toasts) |
| `--rise` | 8 px | 0 | Montée d'entrée (×4 pour la feuille basse) |
| `--lift` | −3 px | 0 | Carte soulevée au survol |
| `--tilt-max` | 1,5° | (statique) | Inclinaison maximale d'une feuille |
| `--blur-ink` | 3 px | 0 | « L'encre sèche » (flou → net) |
| `--stamp-from` | 1,35 | 1 | Échelle de départ du tampon |
| `--toast-timeout` | 6000 ms | — | Fermeture auto des toasts non critiques |
| `--tooltip-delay` | 400 ms | — | Délai des info-bulles au survol |
| `--long-press` | 400 ms | — | Appui long (réglable 300/600 par le jeu) |

**Gestes signature**
- **La feuille se pose** : `opacity` 0→1 + `translateY(--rise) scale(.985)` → repos, `--ease-paper`, `@starting-style`.
- **Le tampon frappe** : `scale(--stamp-from)` → 1 + fondu, `--ease-stamp`, retard `rang × --stagger`. Réduit : fondu de 100 ms, aucune secousse.
- **L'indicateur s'encre** : trait d'onglet `scaleX(.3)` → 1 + opacité.
- **Le lavis prend** : `opacity` du lavis d'un lieu 0,6 → 0,9 au survol/focus/ouverture.
- **La carte se soulève** : `translateY(--lift)` au survol d'une fiche interactive.

**Règles**
- Animer **uniquement** `transform`, `opacity`, `filter` (les couleurs changent sans transition ; le niveau d'un lavis passe par `opacity`).
- Aucune bibliothèque d'animation : CSS (`@starting-style`, `transition-behavior: allow-discrete`) + caméra en JS.
- Rien ne bloque l'interaction : pas de `pointer-events: none` pendant une transition, caméra interruptible, aucun délai avant de pouvoir agir.
- **Mouvement réduit** = `prefers-reduced-motion: reduce` (sauf `data-motion='full'`) **ou** `data-motion='reduced'` : durées ~0, fondus ≤ 150 ms, pas de montée, de flou, de rebond, de secousse ni de parallaxe ; boucles arrêtées (`animation-iteration-count: 1` en filet de sécurité dans base.css) ; la caméra saute à la cible.

---

## 8. Iconographie

- **Trait de plume** : grille 24, trait 1,75, extrémités et angles ronds, `currentColor`, aucun
  remplissage (sauf points). Pas d'icône à deux tons, pas de pictogramme pixel.
- Taille : 1,25 em dans le texte, 24 px (1,5 rem) dans `IconButton` et `Tabs`.
- Toujours `aria-hidden` ; le nom accessible est porté par le contrôle (`IconButton label`).
- Jeu fourni (`ICON_NAMES`, `packages/ui/src/primitives/icons.ts`), 51 icônes :
  panneaux `tree archives reader catalog notebook map pinboard journal faces help` ·
  navigation `menu pause back forward chevron-down chevron-up close plus minus external grip list layers settings sound` ·
  verbes `look search take write pin use highlight note` ·
  lecteur `flip transcript zoom-in zoom-out fit` ·
  états `lock check stamp face star clock info warning danger trash save quill`.
- Une icône = un sens partout : `pin` = épingler, `use` = utiliser dans l'arbre, `lock` = établi.
- **Curseurs** (§2) : flèche d'encre `#161b26` à liseré vélin `#f6efe0` + pastille du verbe, 32 px,
  point chaud (3, 2), repli sur le curseur système équivalent (`zoom-in`, `grab`, `grabbing`,
  `text`, `copy`, `alias`).

| Verbe | `data-verb` | Token | Icône | Repli |
|---|---|---|---|---|
| Regarder / loupe | `look` | `--cursor-look` | `look` / `search` | `zoom-in` |
| Prendre | `take` | `--cursor-take` | `take` | `grab` |
| Déplacer (tenu) | `hold`, `.is-dragging` | `--cursor-hold` | — | `grabbing` |
| Écrire | `write` | `--cursor-write` | `write` | `text` |
| Épingler | `pin` | `--cursor-pin` | `pin` | `copy` |
| Utiliser dans l'arbre | `use` | `--cursor-use` | `use` | `alias` |

---

## 9. Composants (`packages/ui/src/primitives/`)

Règles communes : Svelte 5 runes, ne lisent que des tokens sémantiques, portent leur propre
focus (`outline 3px --focus`, décalage 2 px), cibles ≥ 44 × 44 px, fonctionnent en contexte
lampe **et** papier, mode contraste élevé et couleurs forcées (`forced-colors`), texte en
français, aucun `{@html}`.

| # | Primitive | API (props principales) | Variantes / états | Accessibilité |
|---|---|---|---|---|
| 9.1 | `Button` | `variant: primary\|secondary\|ghost\|danger` (déf. secondary) · `size: m\|l` (44/48) · `href` (→ `<a>`) · `target`, `rel` (noopener auto) · `loading` · `block` · `disabled` · `iconName` ou snippet `icon` · `iconEnd` · `verb` · attributs `<button>` | hover (couche `::before` en opacité), focus-visible, active (1 px), disabled (50 %), loading (spinner) | `loading` → `aria-busy` + `aria-disabled`, garde le focus, ignore le clic. Un seul `primary` par vue. |
| 9.2 | `IconButton` | `label` **obligatoire** · `icon` ou snippet · `variant: ghost\|secondary\|primary` · `size` · `pressed` · `badge`, `badgeLabel` · `tooltip`, `tooltipPlacement` | hover, focus, active (scale .94), **pressed** (laiton + bord), disabled ; info-bulle CSS au survol (délai) et au focus, absente au toucher | `aria-label` (+ badge verbalisé), `aria-pressed` si bascule. |
| 9.3 | `Tabs` | `items: {id,label,icon?,badge?,badgeLabel?,disabled?}[]` · `value` (bindable) · `label` · `variant: line\|bar\|rail` · `activation: auto\|manual` · snippet `children(id)` (panneau) | line = volets ; bar = barre basse 64 px ; rail = rail vertical d'icônes ; indicateur 3 px qui s'encre ; pastilles | Motif ARIA tabs, tabindex itinérant, flèches (verticales pour rail), Début/Fin, `aria-controls`/`aria-labelledby`. Rail : libellé visuellement caché + info-bulle. |
| 9.4 | `Panel` | `title` · `headingLevel` · `kicker` · `surface: desk\|paper` · `as` · `scroll` · `padded` · `hideHeader` · `onclose` · snippets `actions`, `footer` | bureau (surface-1, rayon 16) ou papier (grain, rayon 2, ombre chaude) | `<section aria-labelledby>` avec vrai `hN` ; bouton fermer nommé. |
| 9.5 | `Card` | `variant: fiche\|document\|photo` · `title` · `headingLevel` · `kicker` · `meta` · `href` / `onactivate` · `selected` · `unread` · `pinned` · `tilt` (±1,5°) · `verb` · snippets `media`, `children`, `footer` | fiche (bureau), document (papier + grain), photo (bord blanc, légende manuscrite) ; survol = se soulève ; sélection = contour laiton + ▸ | Le titre est le lien/bouton (zone étendue à la carte), pied cliquable au-dessus ; « Non lu », « Épinglé » verbalisés. |
| 9.6 | `Dialog` | `open` (bindable) · `title` · `kicker` · `description` · `size: s\|m\|l` · `surface` · `dismissible` · `mobile: sheet\|fullscreen` · `onclose` · snippets `children`, `actions` | se pose ; feuille basse < 600 px (actions empilées) ou plein écran | `<dialog>` + `showModal()` (reste inerte), Échap, clic fond (pression et relâchement sur le fond), retour du focus, `aria-labelledby/describedby`, défilement de page verrouillé. |
| 9.7 | `TextField` | `label` · `value` (bindable) · `hint` · `error` · `multiline`, `rows` · `maxlength` (compteur) · `variant: default\|typewriter` · `iconName` · `hideLabel` · snippet `end` | focus (anneau sur le contrôle), erreur (bord 2 px + icône + texte), disabled ; typewriter = Courier Prime (Catalogue) | Libellé `<label for>`, aide/erreur/compteur via `aria-describedby`, `aria-invalid`, compteur poli. |
| 9.8 | `Select` | `label` · `options: {value,label,disabled?}[]` · `value` (bindable) · `hint` · `hideLabel` | natif stylé, chevron | `<select>` natif (clavier, manette, lecteurs). |
| 9.9 | `Combobox` | `label` · `options: Candidate{id,label,detail?,note?,disabled?}[]` · `value` (bindable) · `query` (bindable) · `mode: inline\|popup` · `emptyText` / snippet `empty` · `onselect` · export `fold()` | lignes 56 px, partie filtrée soulignée, coche sur la valeur, ligne active (lavis + barre), état vide | ARIA 1.2 combobox + listbox, `aria-activedescendant`, ↑↓ Début Fin Entrée Échap (vide le filtre), nombre de candidats annoncé. Filtre préfixe puis sous-chaîne, sans accents. |
| 9.10 | `Toggle` | `label` · `checked` (bindable) · `description` · `disabled` · `showState` · `onchange` | piste + curseur à glyphe (coche / trait) ; « Activé / Désactivé » optionnel | `role="switch"`, `aria-checked`, libellé et description reliés. |
| 9.11 | `Slider` | `label` · `value` (bindable) · `min`, `max`, `step` · `format` · `marks` · `hint` · `onchange` | piste remplie laiton, pouce 24 px, crans nommés | `<input type=range>` natif, `aria-valuetext` formaté, `<output>`. |
| 9.12 | `Toast`, `ToastRegion`, `pushToast()` | `tone: info\|success\|warning\|danger\|established` · `title` · `message` · `action` · `timeout` · `live` · `onclose` ; région : `offset` | entrée qui se pose ; ≤ 3 à l'écran ; danger/warning restent ; pause au survol/focus | Région `aria-live="polite"`, danger en `role="alert"`. Jamais d'information exclusive (tout est aussi au Journal). |
| 9.13 | `Tooltip` | `text` · `placement: top\|bottom` · snippet `children(attrs)` | apparaît après `--tooltip-delay` au survol souris, immédiatement au focus clavier | `role="tooltip"` + `aria-describedby` ; Échap masque ; jamais d'info indispensable (absent au toucher). |
| 9.14 | `Badge` | `tone: neutral\|accent\|success\|warning\|danger\|info\|established` · `variant: soft\|solid\|outline` · `iconName` · `dot` | 24 px de haut, non interactif | Ton toujours doublé d'un texte ou d'une icône. |
| 9.15 | `Stamp` | `text` (déf. « Établi ») · `tone: established\|danger\|ink` · `size: s\|m\|l` · `rotate` (déf. −6°) · `animate` · `delay` (rang) · `label` | double cadre, Courier Prime capitales, encrage irrégulier (`--stamp-texture`), frappe animée | `role="img"` + `aria-label` ; l'annonce du verrouillage est faite par le jeu (région live). |
| 9.16 | `KeyHint` | `action` · `device: keyboard\|mouse\|touch\|gamepad` · `keys[]` · `pad: south\|east\|west\|north\|lb\|rb\|lt\|rt\|start\|select\|ls\|rs\|dpad\|lstick\|rstick` · `padStyle: xbox\|playstation\|nintendo` · `gesture` · export `padLabel()` | touches en relief ; boutons de façade = **losange de position** + lettre (A/B/X/Y, B/A/Y/X) ou symbole PlayStation dessiné ; gâchettes en pilule | Glyphe nommé (« Bouton A »), libellé d'action en texte. |
| 9.17 | `FocusRing` | `rect` (mode projeté) · `visible` · `radius` · `offset` · `as` | anneau 3 px `--focus` + halo 2 px `--focus-halo` | Pour composites (case d'arbre) et SVG (lieux, visages) ; ne remplace pas le focus natif, le prolonge. |
| 9.18 | `VisuallyHidden`, `SkipLink` | `as`, snippet ; `href`, `label` | `SkipLink` glisse au focus | Lecteurs d'écran ; lien d'évitement en tête de chaque page du site. |
| 9.19 | `Loader` | `label` · `showLabel` · `delay` (déf. 300 ms) | plume qui écrit ; figée en mouvement réduit | `role="status"`, n'apparaît qu'après 300 ms. |
| 9.20 | `Icon`, `ArtDefs` | `name`, `size`, `weight` ; — | §8 ; motifs de gravure (§10.4) | `aria-hidden` ; `ArtDefs` une fois par écran avec de l'art. |

Utilitaires CSS (base.css) : `.reading`, `.ink-type`, `.ink-hand`, `.num`, `.caps`, `.grain`,
`.kw[data-state]`, `.hl-1…5`, `.visually-hidden`, `.skip-link`, `[data-verb]`, `.logo-mono`.

### 9.21 Mots-clés soulignés (`.kw`)

`<span class="kw" data-state="new|known|searched" role="button" tabindex="0">` dans le texte des
documents. **Nouveau** = pointillé 3 px + point ● ; **connu** = trait plein 2 px ; **recherché** =
trait plein + petite loupe. Couleur `--keyword`, zone sensible étendue à 44 px de haut, survol
= lavis laiton. Contraste élevé : traits 3 px. Couleurs forcées : `LinkText`.

---

## 10. Illustration

### 10.1 Technique

**Taille-douce à l'encre ferro-gallique, rehaussée d'aquarelle.** Un trait bleu-noir (`ink`)
gravé, des hachures pour le volume, puis quelques lavis transparents posés par un coloriste.
Tout est SVG inliné, **coloré uniquement par classes** (`ART_CLASSES`), sur une racine
`class="art"`. Aucun `fill`/`stroke` coloré, aucun `style=`, aucun `<script>`/`on*`/
`<foreignObject>` (règle 8 de `content:check`). Valeurs admises hors classes : `none`,
`currentColor`, `url(#art-hatch|art-hatch-dense|art-stipple|…)` (ids internes préfixés).

### 10.2 Trait (`ink`, `ink-soft`, `ink-faint`)

- Ces classes colorent le `stroke` (via `currentColor`) et ne remplissent rien ; silhouette pleine : `fill="currentColor"`.
- Épaisseurs par défaut (sans `stroke-width`) : `ink` 1,2 · `ink-soft` 0,8 · `ink-faint` 0,5 (`--art-stroke-base|fine|hair`), plus `--art-stroke-bold` 2 et `--art-stroke-frame` 3.
- **Minimum 0,5 unité de viewBox.** Hiérarchie : contours principaux `ink`, détails `ink-soft`, courbes de niveau et ombres `ink-faint`.
- Le trait grossit avec le zoom (pas de `vector-effect`) : c'est une gravure.

### 10.3 Lavis (`wash-*`) et eau (`water`, `water-deep`)

- Transparents : niveau porté par `opacity` (`--art-wash-opacity` 0,6 ; 0,9 actif ; 0,35/0,55 en contraste élevé). **Deux couches au maximum.** Le lavis déborde de 1 à 3 unités du trait : la main du coloriste.
- Huit pigments, chacun dédié à une famille de lieux (répartition fine : cartographe, `docs/monde/`) :

| Classe | Token | ≈ hex | Emploi conseillé |
|---|---|---|---|
| `wash-safran` | `oklch(0.86 0.1 85)` | #efcc83 | Places, édifices civiques, lumière |
| `wash-carmin` | `oklch(0.79 0.085 15)` | #eca4a9 | Demeures familiales, tuiles, vêtements de fête |
| `wash-indigo` | `oklch(0.79 0.06 265)` | #a8bbe2 | Administrations, uniformes, manteaux |
| `wash-sienne` | `oklch(0.8 0.08 50)` | #e9af90 | Ateliers, terres cultivées, cuir |
| `wash-sauge` | `oklch(0.84 0.06 130)` | #bed3aa | Forêts, jardins, prairies |
| `wash-lilas` | `oklch(0.82 0.06 310)` | #d0bae2 | Lieux secrets, chapelles, deuil |
| `wash-celadon` | `oklch(0.86 0.05 170)` | #b1dccc | Marais, cuivre vert-de-gris, verre |
| `wash-ardoise` | `oklch(0.8 0.02 250)` | #b4bfca | Toits, pierre, routes, ville industrielle |
| `water` | `oklch(0.86 0.045 205)` | #afdadf | Mer, lacs, rivières (0,75) |
| `water-deep` | `oklch(0.78 0.06 215)` | #8bc2cf | Eaux profondes, chenaux |

### 10.4 Motifs de gravure (`hatch`, `hatch-dense`, `stipple`)

Fournis par `<ArtDefs />` (une fois par écran) : `#art-hatch` (simple, −45°, pas 4, trait 0,5),
`#art-hatch-dense` (croisé, pas 3, 0,6), `#art-stipple` (pointillé, trame 5). Sur une forme,
la classe la remplit du motif. Usage : relief, côtés d'ombre, ciel du cartouche. Jamais sous un
toponyme sans son halo. Les SVG de contenu ne redéfinissent **pas** ces ids.

### 10.5 Toponymes et légendes

| Classe | Rendu | Token |
|---|---|---|
| `label` | Literata 500, capitales par CSS, approche 0,16 em, 13 u | `--art-label-size`, `--art-tracking-label` |
| `label-major` | capitales 600, 22 u, approche 0,22 em (villes, titre) | `--art-label-major-size` |
| `label-region` | capitales très espacées (0,5 em), 30 u, encre diluée (régions, mers) | `--art-label-region-size` |
| `label-water` | italique, indigo d'eau, 12 u (cours d'eau, golfes) | `--art-label-water-size`, `--art-water-ink` |
| `label-note` | italique, encre diluée, 10 u (cartouche, échelle, dates) | `--art-label-note-size` |

Halo papier automatique (`paint-order: stroke`, `--art-label-halo` 2,6 ; 3,4 en HC). Taille
minimale 9 u. Texte SVG réel en casse normale (indexable, lu par les lecteurs d'écran).
Un `font-size` en attribut est respecté.

### 10.6 La carte du monde

- Couches `art/map/{base,relief,water,places,labels}.svg`, viewBox `0 0 1000·aspect 1000`, chacune avec `class="art"` à l'inlining.
- **Un `<g id="place-<id>">` par lieu**, ses lavis à l'intérieur. Le jeu pose `data-state` :
  - `mentioned` : lavis invisibles, traits en tirets mine de plomb, étiquette en italique minuscule (silhouette) ;
  - `open` : lavis posés, étiquette droite ;
  - `exhausted` : comme `open` (la coche est une surimpression HTML).
  - survol, focus, `aria-current="true"`, `data-active` : le lavis prend (0,9).
- Les pastilles (« ? », nombre de non lus, coche) et l'anneau de focus sont des **surimpressions
  HTML** (`Badge`, `FocusRing rect`) positionnées par la caméra : jamais dans le SVG.
- **Cartouche** (bas gauche) : rectangle `paper`, double filet `ink` 2–3 u + `ink-soft` 0,8, titre
  `label-major`, sous-titre `label-note`, mention « dressée et gravée par CM Creative Lab » en
  `label-note` (seule mention de la maison sur la carte). **Rose des vents** : cercles `ink-soft`/
  `ink-faint`, aiguille `ink` (moitié nord `fill="currentColor"`). **Échelle fantaisie** dans une
  unité du monde. **Cadre** : double filet comme le cartouche.
- Lieux de fiction dans la fiction (rumeurs, lieux disparus) : étiquette `font-style="italic"`.

### 10.7 Portraits (galerie des visages, cases de l'arbre)

Objectif : **reconnaissables entre 25 et 35 personnes**, à 72 px (case) comme à 320 px (fiche).

- **Format** : viewBox `0 0 160 200`, buste de trois-quarts, regard cadré au tiers haut, fond `paper` + hachure légère ou lavis d'ambiance.
- **Signature par personne** (au moins deux sur trois) : **silhouette de coiffure** distincte, **accessoire** (lunettes, foulard, chapeau, boucle d'oreille, col), **couleur de vêtement** (un `wash-*` par personne, les membres d'une même branche partagent une famille de teintes).
- **Carnations** `skin-1` (claire) → `skin-6` (foncée) ; **cheveux** `hair-blond|roux|chatain|brun|noir|gris` ; `blush` (joues, 0,5), `ombre` (modelé, 0,22), `rehaut` (gouache blanche des reflets, 0,85).
- Âge lisible : rides en `ink-faint`, cheveux `hair-gris` ; même personne à deux âges = même silhouette de coiffure et même accessoire.
- Traits du visage en `ink-soft` 0,8 ; contour en `ink` 1,2. Pas d'expression caricaturale.
- Variante **photographie** (documents) : même dessin rendu en `photo-light|mid|dark` sur `photo-paper` (tirage argentique viré), sans couleur ni trait `ink` épais. Les **zones de visage** collectables sont des rectangles définis dans le contenu (≥ 44 × 44 px à zoom ajusté), pas des formes dans le SVG.
- Budget : ≤ 25 Ko gzip après svgo ; `alt` décrit coiffure, accessoire, vêtement.

### 10.8 Documents (style par type)

| Type | Papier | Typo | Signes |
|---|---|---|---|
| Lettre | `--paper-new`, grain | `--font-hand` `--ink-hand` (remplaçable) ; en-tête imprimé `--font-read` | Pliures en `ink-faint`, enveloppe au verso, cachet `Stamp` |
| Coupure de presse | `--paper-aged` | `--font-read`, titres 600 en capitales serrées, colonnes | Filets de colonne, bord déchiré (masque) |
| Registre civil | `--paper` | En-têtes imprimés `--font-read`, entrées `--font-hand` | Tableau à filets `--line`, lignes surlignables |
| Annuaire | `--paper-aged` | `--font-read` 400 petites capitales pour les noms | Points de conduite, deux colonnes |
| Télégramme, fiche, rapport | `--paper-new` | `--font-type` `--ink-type` | Bandes collées, `Stamp tone="ink"` |
| Carte postale | recto illustré (`art`), verso `--paper-new` | `--font-hand` | Timbre, cachet postal (lieu + date) |
| Photographie | `photo-paper` | légende au dos `--font-hand` | Coins, bord blanc (`Card variant="photo"`) |
| Faire-part, acte | `--paper-new` | `--font-read` italique et capitales | Filet de deuil `ink` 2 u, signatures `--font-hand` |

Le texte est toujours du texte réel (transcription disponible, `T`), jamais une image de texte.

### 10.9 Tableau `ART_CLASSES` (source : `packages/ui/src/art-classes.ts`)

| Groupe | Classes |
|---|---|
| Papier | `paper` `paper-shade` |
| Trait | `ink` `ink-soft` `ink-faint` |
| Motifs | `hatch` `hatch-dense` `stipple` |
| Eau | `water` `water-deep` |
| Lavis | `wash-safran` `wash-carmin` `wash-indigo` `wash-sienne` `wash-sauge` `wash-lilas` `wash-celadon` `wash-ardoise` |
| Portrait | `skin-1`…`skin-6` `hair-blond` `hair-roux` `hair-chatain` `hair-brun` `hair-noir` `hair-gris` `blush` `rehaut` `ombre` |
| Photographie | `photo-paper` `photo-light` `photo-mid` `photo-dark` |
| Texte | `label` `label-major` `label-region` `label-water` `label-note` |

Exports annexes : `ART_ROOT_CLASS` (`'art'`), `ART_PATTERN_IDS`, `ART_PAINT_KEYWORDS`,
`isArtClass()`. Tokens d'art : `--art-*` (§10.3–10.7, valeurs dans tokens.css), dont
`--art-skin-opacity` 0,9, `--art-blush-opacity` 0,5, `--art-ombre-opacity` 0,22,
`--art-rehaut-opacity` 0,85, `--art-water-opacity` 0,75, `--art-hatch-width` 0,5,
`--art-hatch-dense-width` 0,6, `--art-label-weight` 500, `--art-mentioned-dash` `2 2.5`.

Couleurs forcées : papier → `Canvas`, trait et texte → `CanvasText`, lavis supprimés.

---

## 11. Charte d'usage des logos

Logos : `static/brand/` (copie dans `apps/site/static/brand/`), source `static/brand/SOURCE.md`.

- **Où** : écran de crédits (E09), pied de page du site, page « Charte » du site, écran légal ;
  le logo **CM Interactive** seul peut ouvrir l'écran de lancement (E01, ≤ 2 s, passable).
  **Nulle part ailleurs** : ni dans le Bureau, ni sur la carte (seule la mention textuelle
  « dressée et gravée par CM Creative Lab » au cartouche), ni dans les documents.
- **Ordre** : CARDOR Media (monogramme) · CM Interactive (édition, développement) · CM Creative Lab (écriture, illustration).
- **Rendu** : SVG **inliné** (les couleurs passent par `--logo-t1/t2/t3`). Par défaut **monochrome
  vélin** avec la classe `.logo-mono` (toutes les teintes = `--text-muted` ; `--ink` en contexte
  papier) ; couleurs d'origine seulement sur la page « Charte ». Jamais recolorés en laiton ou violet.
- **Taille** : hauteur ≥ 24 px (≥ 32 px pour l'emblème), zone de protection = ½ hauteur du logo
  sur chaque côté, alignés sur une même ligne de base, espacés de `--space-8`.
- **Interdits** : déformer, ajouter ombre/contour, placer sur une illustration chargée, animer
  autrement qu'un fondu (`--dur-fade`).
- Nom accessible : `role="img"` + `aria-label` (« CARDOR Media », « CM Interactive », « CM Creative Lab »).

---

## 12. Page de démo `/design`

`apps/site/src/routes/design/+page.svelte` (prérendue, `noindex`), même ordre que ce document :
réglages en tête (contraste élevé, police de lisibilité, mouvement réduit, taille du texte —
posent les attributs `data-*` sur `<html>`), couleurs (lampe et papier), typographie (échelle,
lecture, mots-clés, surlignages, machine à écrire, manuscrit), boutons et boutons icônes,
onglets (line, bar dans un cadre de 360 px, rail), fiches/documents/photos, tampons (cascade
rejouable) et pastilles, champs (TextField, Select, Combobox, Toggle, Slider), retours (Toast,
Tooltip, Dialog, Loader, KeyHint clavier/manettes/geste), maquette du Bureau (rail + Arbre +
Lecteur papier), illustration (extrait de carte avec états `open`/`mentioned`, portrait,
pigments, motifs), icônes (`ICON_NAMES`), curseurs (zones `data-verb` à survoler), logos (§11).
Vérifiée à 360 px (pas de défilement horizontal) et 1280 px, en contraste élevé et en mouvement réduit.

---

## 13. Checklist de conformité (utilisée par `qa-reviewer`)

Tokens et styles
- [x] Aucune couleur, police, durée, ombre ou rayon en dur dans les primitives (seuls des tokens ; exceptions documentées : images de curseur, masques alpha)
- [x] Composants ne lisant que la sémantique (jamais `--raw-*`)
- [x] Espacements sur l'échelle 4 px ; 1–3 px littéraux seulement pour filets et insets
- [x] Contexte papier : tout composant posé dans `[data-surface='paper']` reste conforme
- [ ] `node packages/ui/scripts/contrast.mjs --strict` branché dans `npm run check` (orchestrateur)
- [ ] SVG d'art : seulement `ART_CLASSES`, `none`, `currentColor`, `url(#…)` (règle 8 de `content:check`, backend)

Accessibilité
- [x] Contrastes calculés (§3.6, §14) : texte ≥ 4,5, grand texte et non-texte ≥ 3 ; HC ≥ 7 pour le texte
- [x] Focus visible : 3 px `--focus` + décalage 2 px sur tout contrôle ; `FocusRing` pour composites et SVG
- [x] Cibles ≥ 44 × 44 px (`--hit`), lignes de liste 56 px, zone étendue des mots-clés
- [x] Aucune information par la couleur seule (mots-clés, surlignages, onglets, interrupteurs, tampons, lieux)
- [x] Dialog : inerte autour, Échap, retour du focus, nom et description
- [x] Tabs, Combobox, Toggle, Slider : motifs ARIA, clavier complet
- [x] Info-bulles jamais indispensables (absentes au toucher)
- [x] Taille du texte ×2 sans perte (échelle en rem × `--text-scale`), police de lisibilité, manuscrit remplaçable
- [x] Couleurs forcées (`forced-colors`) gérées dans base.css, art.css et les primitives
- [ ] Lecteur d'écran sur le Bureau réel (arbre en liste hiérarchique, annonces de verrouillage) — frontend, vague D
- [ ] Parité manette (navigation spatiale + `KeyHint`) — frontend, vague D

Mouvement et performance
- [x] Seuls `transform`, `opacity`, `filter` sont animés
- [x] Mouvement réduit (système ou réglage) : durées ~0, fondus ≤ 150 ms, boucles figées, pas de rebond
- [x] Aucune animation bloquante
- [x] Polices WOFF2 OFL auto-hébergées, `unicode-range`, ≤ 2 préchargements (137 Ko)
- [x] 360 px sans défilement horizontal (démo vérifiée à 360 et 1280 px)

Illustration
- [ ] Traits ≥ 0,5 u, toponymes en `label*`, lavis ≤ 2 couches, portraits ≤ 25 Ko (cartographe, vague C)

---

## 14. Annexe : contrastes calculés

Généré par `node packages/ui/scripts/contrast.mjs --md` (à régénérer à chaque changement de
couleur). Fonds composés : « A sur B » = A translucide posé sur B. Seuils : 4,5 texte ; 3
non-texte / grand texte ; 7 en contraste élevé.

#### Contexte lampe

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--text` | `--canvas` | **16,53** ✓ | 4,5 | texte |
| `--text` | `--surface-1` | **15,14** ✓ | 4,5 | texte |
| `--text` | `--surface-2` | **13,63** ✓ | 4,5 | texte |
| `--text` | `--surface-3` | **11,78** ✓ | 4,5 | texte |
| `--text-muted` | `--canvas` | **10,59** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-1` | **9,70** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-2` | **8,73** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-3` | **7,55** ✓ | 4,5 | texte secondaire |
| `--text-faint` | `--surface-1` | **5,64** ✓ | 3 | grand texte, désactivé |
| `--line-strong` | `--canvas` | **4,85** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-1` | **4,44** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-2` | **4,00** ✓ | 3 | bordure de contrôle |
| `--accent` | `--canvas` | **10,45** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--surface-1` | **9,58** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--surface-2` | **8,62** ✓ | 4,5 | lien, texte d’action |
| `--accent-contrast` | `--accent` | **10,88** ✓ | 4,5 | texte du bouton principal |
| `--accent-contrast` | `--accent-strong` | **13,37** ✓ | 4,5 | bouton principal survolé |
| `--text` | `--accent-tint sur --surface-1` | **11,44** ✓ | 4,5 | texte sur lavis d’accent |
| `--focus` | `--canvas` | **12,84** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-1` | **11,76** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-2` | **10,59** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-3` | **9,15** ✓ | 3 | anneau de focus |
| `--danger` | `--surface-1` | **7,43** ✓ | 4,5 | erreur |
| `--success` | `--surface-1` | **9,85** ✓ | 4,5 | succès |
| `--warning` | `--surface-1` | **9,06** ✓ | 4,5 | avertissement |
| `--info` | `--surface-1` | **9,54** ✓ | 4,5 | information |
| `--established` | `--surface-1` | **7,85** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **8,57** ✓ | 4,5 | tampon « Établi » |
| `--keyword` | `--surface-1` | **9,58** ✓ | 4,5 | mot-clé souligné |
| `--established-contrast` | `--established` | **8,92** ✓ | 4,5 | texte sur tampon plein |
| `--canvas` | `--success` | **10,75** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **8,11** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **9,90** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **10,42** ✓ | 4,5 | pastille pleine |
| `--success` | `--surface-3` | **7,66** ✓ | 4,5 | pastille douce |
| `--danger` | `--surface-3` | **5,78** ✓ | 4,5 | pastille douce |
| `--established` | `--surface-3` | **6,11** ✓ | 4,5 | pastille douce |
| `--accent` | `--surface-3` | **7,45** ✓ | 4,5 | pastille douce |
| `--canvas` | `--text` | **16,53** ✓ | 4,5 | info-bulle (inversée) |
| `--text` | `--selection sur --surface-1` | **8,14** ✓ | 4,5 | sélection de texte |

#### Contexte papier

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--text` | `--canvas` | **13,26** ✓ | 4,5 | texte |
| `--text` | `--surface-1` | **14,19** ✓ | 4,5 | texte |
| `--text` | `--surface-2` | **12,11** ✓ | 4,5 | texte |
| `--text` | `--surface-3` | **10,86** ✓ | 4,5 | texte |
| `--text-muted` | `--canvas` | **6,83** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-1` | **7,30** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-2` | **6,24** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-3` | **5,59** ✓ | 4,5 | texte secondaire |
| `--text-faint` | `--surface-1` | **4,02** ✓ | 3 | grand texte, désactivé |
| `--line-strong` | `--canvas` | **3,76** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-1` | **4,02** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-2` | **3,44** ✓ | 3 | bordure de contrôle |
| `--accent` | `--canvas` | **5,89** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--surface-1` | **6,30** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--surface-2` | **5,38** ✓ | 4,5 | lien, texte d’action |
| `--accent-contrast` | `--accent` | **6,30** ✓ | 4,5 | texte du bouton principal |
| `--accent-contrast` | `--accent-strong` | **7,83** ✓ | 4,5 | bouton principal survolé |
| `--text` | `--accent-tint sur --surface-1` | **11,93** ✓ | 4,5 | texte sur lavis d’accent |
| `--focus` | `--canvas` | **5,89** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-1` | **6,30** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-2` | **5,38** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-3` | **4,82** ✓ | 3 | anneau de focus |
| `--danger` | `--surface-1` | **6,67** ✓ | 4,5 | erreur |
| `--success` | `--surface-1` | **6,40** ✓ | 4,5 | succès |
| `--warning` | `--surface-1` | **5,44** ✓ | 4,5 | avertissement |
| `--info` | `--surface-1` | **6,32** ✓ | 4,5 | information |
| `--established` | `--surface-1` | **7,22** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **6,75** ✓ | 4,5 | tampon « Établi » |
| `--keyword` | `--surface-1` | **6,30** ✓ | 4,5 | mot-clé souligné |
| `--established-contrast` | `--established` | **7,22** ✓ | 4,5 | texte sur tampon plein |
| `--canvas` | `--success` | **5,98** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **6,24** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **5,08** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **5,91** ✓ | 4,5 | pastille pleine |
| `--success` | `--surface-3` | **4,90** ✓ | 4,5 | pastille douce |
| `--danger` | `--surface-3` | **5,11** ✓ | 4,5 | pastille douce |
| `--established` | `--surface-3` | **5,53** ✓ | 4,5 | pastille douce |
| `--accent` | `--surface-3` | **4,82** ✓ | 4,5 | pastille douce |
| `--canvas` | `--text` | **13,26** ✓ | 4,5 | info-bulle (inversée) |
| `--text` | `--selection sur --surface-1` | **11,43** ✓ | 4,5 | sélection de texte |
| `--text` | `--hl-1 sur --surface-1` | **12,33** ✓ | 4,5 | surlignage 1 |
| `--text` | `--hl-2 sur --surface-1` | **12,04** ✓ | 4,5 | surlignage 2 |
| `--text` | `--hl-3 sur --surface-1` | **11,30** ✓ | 4,5 | surlignage 3 |
| `--text` | `--hl-4 sur --surface-1` | **11,24** ✓ | 4,5 | surlignage 4 |
| `--text` | `--hl-5 sur --surface-1` | **11,30** ✓ | 4,5 | surlignage 5 |
| `--ink-hand` | `--surface-1` | **9,48** ✓ | 4,5 | écriture manuscrite |
| `--ink-type` | `--surface-1` | **14,59** ✓ | 4,5 | machine à écrire |

#### Contexte lampe HC

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--text` | `--canvas` | **20,59** ✓ | 7 | texte |
| `--text` | `--surface-1` | **20,12** ✓ | 7 | texte |
| `--text` | `--surface-2` | **19,12** ✓ | 7 | texte |
| `--text` | `--surface-3` | **17,72** ✓ | 7 | texte |
| `--text-muted` | `--canvas` | **16,75** ✓ | 7 | texte secondaire |
| `--text-muted` | `--surface-1` | **16,37** ✓ | 7 | texte secondaire |
| `--text-muted` | `--surface-2` | **15,56** ✓ | 7 | texte secondaire |
| `--text-muted` | `--surface-3` | **14,42** ✓ | 4,5 | texte secondaire |
| `--text-faint` | `--surface-1` | **11,52** ✓ | 3 | grand texte, désactivé |
| `--line-strong` | `--canvas` | **16,25** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-1` | **15,88** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-2` | **15,09** ✓ | 3 | bordure de contrôle |
| `--accent` | `--canvas` | **15,26** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--surface-1` | **14,91** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--surface-2` | **14,17** ✓ | 4,5 | lien, texte d’action |
| `--accent-contrast` | `--accent` | **15,26** ✓ | 4,5 | texte du bouton principal |
| `--accent-contrast` | `--accent-strong` | **18,38** ✓ | 4,5 | bouton principal survolé |
| `--text` | `--accent-tint sur --surface-1` | **14,47** ✓ | 4,5 | texte sur lavis d’accent |
| `--focus` | `--canvas` | **15,26** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-1` | **14,91** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-2` | **14,17** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-3` | **13,13** ✓ | 3 | anneau de focus |
| `--danger` | `--surface-1` | **11,51** ✓ | 4,5 | erreur |
| `--success` | `--surface-1` | **14,73** ✓ | 4,5 | succès |
| `--warning` | `--surface-1` | **13,35** ✓ | 4,5 | avertissement |
| `--info` | `--surface-1` | **13,79** ✓ | 4,5 | information |
| `--established` | `--surface-1` | **12,43** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **12,72** ✓ | 4,5 | tampon « Établi » |
| `--keyword` | `--surface-1` | **14,91** ✓ | 4,5 | mot-clé souligné |
| `--established-contrast` | `--established` | **12,72** ✓ | 4,5 | texte sur tampon plein |
| `--canvas` | `--success` | **15,07** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **11,78** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **13,66** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **14,11** ✓ | 4,5 | pastille pleine |
| `--success` | `--surface-3` | **12,97** ✓ | 4,5 | pastille douce |
| `--danger` | `--surface-3` | **10,14** ✓ | 4,5 | pastille douce |
| `--established` | `--surface-3` | **10,95** ✓ | 4,5 | pastille douce |
| `--accent` | `--surface-3` | **13,13** ✓ | 4,5 | pastille douce |
| `--canvas` | `--text` | **20,59** ✓ | 4,5 | info-bulle (inversée) |
| `--text` | `--selection sur --surface-1` | **9,58** ✓ | 4,5 | sélection de texte |

#### Contexte papier HC

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--text` | `--canvas` | **20,12** ✓ | 7 | texte |
| `--text` | `--surface-1` | **20,12** ✓ | 7 | texte |
| `--text` | `--surface-2` | **18,45** ✓ | 7 | texte |
| `--text` | `--surface-3` | **16,88** ✓ | 7 | texte |
| `--text-muted` | `--canvas` | **14,61** ✓ | 7 | texte secondaire |
| `--text-muted` | `--surface-1` | **14,61** ✓ | 7 | texte secondaire |
| `--text-muted` | `--surface-2` | **13,40** ✓ | 7 | texte secondaire |
| `--text-muted` | `--surface-3` | **12,25** ✓ | 4,5 | texte secondaire |
| `--text-faint` | `--surface-1` | **8,47** ✓ | 3 | grand texte, désactivé |
| `--line-strong` | `--canvas` | **16,01** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-1` | **16,01** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-2` | **14,68** ✓ | 3 | bordure de contrôle |
| `--accent` | `--canvas` | **10,25** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--surface-1` | **10,25** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--surface-2` | **9,40** ✓ | 4,5 | lien, texte d’action |
| `--accent-contrast` | `--accent` | **10,25** ✓ | 4,5 | texte du bouton principal |
| `--accent-contrast` | `--accent-strong` | **13,88** ✓ | 4,5 | bouton principal survolé |
| `--text` | `--accent-tint sur --surface-1` | **16,96** ✓ | 4,5 | texte sur lavis d’accent |
| `--focus` | `--canvas` | **10,25** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-1` | **10,25** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-2` | **9,40** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-3` | **8,60** ✓ | 3 | anneau de focus |
| `--danger` | `--surface-1` | **9,94** ✓ | 4,5 | erreur |
| `--success` | `--surface-1` | **9,59** ✓ | 4,5 | succès |
| `--warning` | `--surface-1` | **8,83** ✓ | 4,5 | avertissement |
| `--info` | `--surface-1` | **9,91** ✓ | 4,5 | information |
| `--established` | `--surface-1` | **10,76** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **10,76** ✓ | 4,5 | tampon « Établi » |
| `--keyword` | `--surface-1` | **10,25** ✓ | 4,5 | mot-clé souligné |
| `--established-contrast` | `--established` | **10,76** ✓ | 4,5 | texte sur tampon plein |
| `--canvas` | `--success` | **9,59** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **9,94** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **8,83** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **9,91** ✓ | 4,5 | pastille pleine |
| `--success` | `--surface-3` | **8,04** ✓ | 4,5 | pastille douce |
| `--danger` | `--surface-3` | **8,34** ✓ | 4,5 | pastille douce |
| `--established` | `--surface-3` | **9,02** ✓ | 4,5 | pastille douce |
| `--accent` | `--surface-3` | **8,60** ✓ | 4,5 | pastille douce |
| `--canvas` | `--text` | **20,12** ✓ | 4,5 | info-bulle (inversée) |
| `--text` | `--selection sur --surface-1` | **15,09** ✓ | 4,5 | sélection de texte |
| `--text` | `--hl-1 sur --surface-1` | **16,90** ✓ | 7 | surlignage 1 |
| `--text` | `--hl-2 sur --surface-1` | **16,46** ✓ | 7 | surlignage 2 |
| `--text` | `--hl-3 sur --surface-1` | **15,86** ✓ | 7 | surlignage 3 |
| `--text` | `--hl-4 sur --surface-1` | **15,43** ✓ | 7 | surlignage 4 |
| `--text` | `--hl-5 sur --surface-1` | **15,58** ✓ | 7 | surlignage 5 |
| `--ink-hand` | `--surface-1` | **15,19** ✓ | 7 | écriture manuscrite |
| `--ink-type` | `--surface-1` | **20,12** ✓ | 7 | machine à écrire |

#### Contexte carte

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--art-ink` | `--art-paper` | **13,26** ✓ | 4,5 | toponyme sur papier |
| `--art-ink-soft` | `--art-paper` | **6,83** ✓ | 4,5 | légende secondaire |
| `--art-water-ink` | `--art-paper` | **7,27** ✓ | 4,5 | nom de cours d’eau |
| `--art-water-ink` | `--art-water` | **5,50** ✓ | 4,5 | nom de cours d’eau sur l’eau |
| `--art-ink` | `--art-water-deep` | **7,70** ✓ | 4,5 | toponyme sur eau profonde |
| `--art-ink` | `--art-wash-safran` | **9,84** ✓ | 4,5 | toponyme sur lavis safran pur |
| `--art-ink` | `--art-wash-carmin` | **7,54** ✓ | 4,5 | toponyme sur lavis carmin pur |
| `--art-ink` | `--art-wash-indigo` | **7,80** ✓ | 4,5 | toponyme sur lavis indigo pur |
| `--art-ink` | `--art-wash-sienne` | **7,91** ✓ | 4,5 | toponyme sur lavis sienne pur |
| `--art-ink` | `--art-wash-sauge` | **9,41** ✓ | 4,5 | toponyme sur lavis sauge pur |
| `--art-ink` | `--art-wash-lilas` | **8,49** ✓ | 4,5 | toponyme sur lavis lilas pur |
| `--art-ink` | `--art-wash-celadon` | **10,08** ✓ | 4,5 | toponyme sur lavis celadon pur |
| `--art-ink` | `--art-wash-ardoise` | **8,10** ✓ | 4,5 | toponyme sur lavis ardoise pur |
| `--art-ink-faint` | `--art-paper` | **3,76** ✓ | 3 | trait mine de plomb (non-texte) |

#### Contexte carte HC

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--art-ink` | `--art-paper` | **20,12** ✓ | 7 | toponyme sur papier |
| `--art-ink-soft` | `--art-paper` | **14,61** ✓ | 7 | légende secondaire |
| `--art-water-ink` | `--art-paper` | **12,49** ✓ | 7 | nom de cours d’eau |
| `--art-water-ink` | `--art-water` | **8,29** ✓ | 7 | nom de cours d’eau sur l’eau |
| `--art-ink` | `--art-water-deep` | **10,25** ✓ | 7 | toponyme sur eau profonde |
| `--art-ink` | `--art-wash-safran` | **13,10** ✓ | 7 | toponyme sur lavis safran pur |
| `--art-ink` | `--art-wash-carmin` | **10,04** ✓ | 7 | toponyme sur lavis carmin pur |
| `--art-ink` | `--art-wash-indigo` | **10,38** ✓ | 7 | toponyme sur lavis indigo pur |
| `--art-ink` | `--art-wash-sienne` | **10,54** ✓ | 7 | toponyme sur lavis sienne pur |
| `--art-ink` | `--art-wash-sauge` | **12,53** ✓ | 7 | toponyme sur lavis sauge pur |
| `--art-ink` | `--art-wash-lilas` | **11,30** ✓ | 7 | toponyme sur lavis lilas pur |
| `--art-ink` | `--art-wash-celadon` | **13,42** ✓ | 7 | toponyme sur lavis celadon pur |
| `--art-ink` | `--art-wash-ardoise` | **10,79** ✓ | 7 | toponyme sur lavis ardoise pur |
| `--art-ink-faint` | `--art-paper` | **8,47** ✓ | 3 | trait mine de plomb (non-texte) |

Toutes les paires passent.
