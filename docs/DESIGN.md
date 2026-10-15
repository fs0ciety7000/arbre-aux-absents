# DESIGN — Système de design de *L'Arbre aux absents*

> Source de vérité de l'UI, du mouvement et de l'illustration. Tenu par l'agent `design-lead`.
> **v2.0 — 13 oct. 2026 — « Le dossier vivant »** : palette saturée accordée à l'art clé, matières
> du bureau (chemises, fiches, ruban, étiqueteuse), titrage Fraunces + Oswald, icônes encrées à
> la main, ornements, curseurs à la plume, **langage de mouvement complet** (catalogue, scène
> titre animée, transitions d'écran, micro-interactions, révélations au défilement).
> Toute UI du jeu et du site s'y conforme. Migration v1 → v2 : §15.
> **v2.2 — 14 oct. 2026 — affaire 2** : case revendiquée (§6.9 : `--claim-*`, `.claim-frame`,
> `.claim-value`, `ClaimTag`, `IndexCard claimed`, transition `unclaim`, icône `staple`) et chemises
> d'affaire de l'écran Nouvelle partie (§6.10 : `CaseFolder`, `CaseFolderGroup`).
> **v2.3 — 14 oct. 2026 — rapport de l'affaire 2** : tampons de décision (§6.11 : `DecisionCard`,
> `DecisionGroup`) et variante bureau sombre de l'encre déclarée (`--claim-ink-desk`, §6.9).
>
> **v2.4 — 15 oct. 2026 — anglais et signalements** : textes par défaut des primitives en
> contexte (§4.4 : `UiStrings`, `uiFr`, `uiEn`, `setUiStrings`), typographie anglaise (§4.4),
> sélecteur de langue (§9.35 `LanguageSwitch`), suivi de signalement (§9.36 `TicketStatus`),
> recettes « Signaler un problème », aperçu des diagnostics, « Mes signalements » et page de suivi
> (§13.8–13.10, §14.6). Aucun nouveau token de couleur.
>
> | Quoi | Où |
> |---|---|
> | Tokens | `packages/ui/src/styles/tokens.css` (palette brute, sémantique, matières, contextes, réglages, mouvement) |
> | Base globale | `packages/ui/src/styles/base.css` (reset, typo, focus, mots-clés, surlignages, curseurs) |
> | Matières | `packages/ui/src/styles/materials.css` (bureau, papier, kraft, fiche, ruban, étiqueteuse, surtitres) |
> | Mouvement | `packages/ui/src/styles/motion.css` (images-clés `m-*`, classes `mv-*`) · `packages/ui/src/motion.ts` (transitions Svelte, actions) · `packages/ui/src/styles/keyart.css` (art clé vivant) |
> | Polices | `packages/ui/src/styles/fonts.css` + `packages/ui/src/fonts/` (WOFF2 + licences OFL) |
> | Classes d'art | `packages/ui/src/styles/art.css` + `ART_CLASSES` dans `packages/ui/src/art-classes.ts` |
> | Entrée CSS | `packages/ui/src/styles/index.css` (fonts → tokens → base → materials → motion → art → keyart), une fois par app |
> | Primitives | `packages/ui/src/primitives/*.svelte` (Svelte 5, runes), barrel `primitives/index.ts`, tout réexporté par `@arbre/ui` |
> | Textes des primitives | `packages/ui/src/i18n.ts` (`UiStrings`, `uiFr`, `uiEn`, contexte), aussi `@arbre/ui/i18n` |
> | Icônes, ornements | géométrie `primitives/icon-geometry.ts`, `ornament-geometry.ts` → encrage `npm run icons:ink -w @arbre/ui` → `icons.ts`, `ornaments.ts` (générés) |
> | Art clé | `art/keyart/` (SVG générés, voir son README) ; primitive `KeyArt` |
> | Contrastes | `node packages/ui/scripts/contrast.mjs` (`--md` pour l'annexe, `--strict` pour la CI) |
> | Démo | `apps/site/src/routes/design` → **`/design`** (non indexée) ; aperçu autonome `packages/ui/.preview` (non versionné, §12) |
>
> Tout nouveau token, classe, primitive ou animation est ajouté ici **dans le même changement**,
> et visible sur `/design`.

---

## 1. Vision

### « Le dossier vivant »

Automne 1974, la nuit. Sur le bureau d'un enquêteur de l'Office de Réinscription civile, une
lampe de laiton découpe une flaque de lumière chaude dans le bleu d'encre de la pièce. Dans la
flaque : des chemises de kraft à onglets, des fiches bristol, des registres, des photographies
sans visage, une carte de la Velmarche ; au mur, un tableau de liège et son fil rouge ; à la
fenêtre, un crépuscule rose et lilas sur les toits d'Aubrelieu. **Rien n'est figé** : la lampe
vacille, la poussière dérive dans le faisceau, la vapeur du thé monte, une feuille se soulève
dans un courant d'air. Quand le joueur agit, le bureau répond **comme des objets** : la fiche est
distribuée, la feuille est tirée de sa chemise, le tampon frappe et son encre s'étale, la
branche de l'arbre se révèle dans une gerbe de confettis de papier.

La v1 était sobre et juste ; la v2 garde ses règles (papier lisible sous la lampe, une seule
couleur d'action, AA partout) et lui donne **une patte** : des couleurs franches d'époque, des
matières qu'on a envie de toucher, un titrage d'affiche, un trait à la plume et un bureau qui
respire. C'est une identité **propre au jeu**, sans aucun emprunt aux autres projets de la maison
(hormis les logos de crédits, §11).

| Pilier | Traduction concrète |
|---|---|
| **La lampe** (attention) | Bureau d'encre de nuit par défaut, papier clair dans la lumière. Une seule couleur d'action : le **safran** de la lampe (`--accent`), qui est aussi le focus. La lampe est un vrai objet : halo, poussières, vacillement (`LampLight`, art clé). |
| **Les fournitures** (matières) | Toute surface est une fourniture de 1974 : sous-main surpiqué, chemise kraft ou manille à onglet, fiche bristol réglée à tête rouge, feuille déchirée ou perforée, ruban adhésif mat, étiqueteuse à relief, punaise, trombone, tampon. Le chrome d'interface reste net ; la matière porte l'identité. |
| **Le geste d'archiviste** (mouvement) | Chaque action a un geste physique, court, lesté, avec un rebond au contact (§7). Le bureau a une vie d'ambiance discrète (boucles ≥ 5 s). Rien n'attend l'animation. |
| **La couleur d'époque** (vibrance) | Encre de nuit, safran, vermillon administratif, céladon de fougère, kraft, violet de tampon, et le crépuscule rose-lilas de la fenêtre. Saturé mais tenu : chaque couleur a un rôle (§3). |
| **Lisible partout** | AA calculé dans tous les contextes (lampe, papier, kraft, matières, art clé), AAA en contraste élevé, 5 crans de taille, polices de lisibilité, vision des couleurs, mouvement coupé à la demande, cibles ≥ 44 px, clavier, manette, tactile. |

### Pourquoi un thème sombre par défaut (et pas de thème clair)

1. **Contraste de matières** : les documents (80 à 120, le cœur du jeu) sont du papier clair ;
   sur un bureau d'encre ils se détachent sans cadre.
2. **Sessions longues** (6 à 10 h, souvent le soir, sur téléphone) : moins d'éblouissement.
3. **Récit** : l'enquête nocturne, « les absents » ; la lampe est la métaphore de l'attention.
4. Un thème + un mode contraste élevé suffisent (le contrat `Settings` n'a pas d'option de thème).

### Principes

1. **Le contenu d'abord** : documents, arbre, carte. L'interface s'efface autour.
2. **Une lampe = une action** : `--accent` (safran) désigne l'action principale, la sélection,
   le focus. Un seul bouton `primary` par vue. Le **vermillon** (`--brand`) est la couleur de
   l'administration (titres, étiquettes, fil rouge, onglet actif) : jamais un état, jamais une action.
3. **Une matière = un rôle** : bureau (outils), papier (à lire), kraft (classer, ranger),
   fiche (une personne, une hypothèse), étiquette (une cote, un nom de dossier), tampon (vérité établie).
4. **Le mouvement porte un sens** : la fiche *est distribuée*, la feuille *est tirée*, le tampon
   *frappe*, la carte *s'encre*. Sinon on le supprime. Jamais bloquant, toujours interruptible.
5. **Jamais la couleur seule** : chaque état a une forme (soulignement, icône, motif, tampon, position).

---

## 2. Références point & click, traduites en UI moderne

| Référence point & click | Traduction dans le jeu | Implémentation |
|---|---|---|
| **La scène** (un décor qu'on explore) | **Écran titre** = l'art clé « Le bureau sous la lampe », animé (lampe, poussières, vapeur, rideau, feuille), menu dans la zone calme à droite (§13.1). **Bureau** = l'unique écran de jeu : chemises à onglets sur un sous-main. | `KeyArt`, `Wordmark`, `Folder` + `Tabs variant="folder"`. |
| **Curseurs contextuels** | Le curseur annonce le verbe : **Regarder** (loupe), **Prendre** (main), **Déplacer** (main fermée), **Écrire** (plume), **Épingler** (punaise), **Utiliser** (flèche vers l'arbre). v2 : flèche taillée à l'encre de nuit, liseré vélin, pastille safran dessinée à la plume (§9.0). | Tokens `--cursor-*`, `data-verb`, `:root[data-cursors='ink']`. |
| **Verbes** | Bulle d'action d'un mot-clé ou d'un visage : Rechercher, Voir au carnet, Épingler, Utiliser dans l'arbre, mêmes icônes que les curseurs. | `Button variant="ghost"` + `Icon`. |
| **Révéler les points d'intérêt** | Maintenir **Espace** / **LT** / bouton « Repérer » entoure les zones actives. | `FocusRing`, `.kw`. |
| **Inventaire** | Les **Archives** sont le sac : fiches distribuées en cascade, pastille « non lu ». | `Card variant="index\|document"`, `mv-deal`. |
| **Objets manipulables** | La feuille **est tirée** de sa chemise, **se pose**, **se retourne** (recto/verso 3D), se **zoome** ; la photo a un dos manuscrit. | `PaperSheet`, `sheetPull`, `FlipCard`, `.hl-*`. |
| **Combiner deux objets** | Glisser un terme ou un visage sur une case de l'arbre : l'objet saisi se soulève et pivote (`mv-held`), la case cible s'éclaire en lavis safran. | `--cursor-hold`, `mv-held`, `--accent-tint`. |
| **Cinématiques** | **Cartes de révélation** : fiche papier tirée au centre. | `Dialog surface="paper"`. |
| **Feedback de réussite** | Le **tampon** « Établi » frappe (choc, halo d'encre), la case se **verrouille**, la branche se **célèbre** (confettis de papier, encre d'étincelle). | `Stamp animate`, `mv-thud`, `mv-lock`, `Celebrate`. |

Le curseur ne porte **jamais** seul une information (rien en survol seul, rien sur téléphone).

---

## 3. Couleurs (OKLCH)

### 3.1 Architecture

1. **Palette brute** `--raw-*` : encre de nuit, vélin, safran (laiton), vermillon, céladon,
   kraft, violet de tampon, états, papiers, encres, bois et crépuscule. **Jamais lue par un composant.**
2. **Sémantique** : `--canvas`, `--surface-*`, `--text*`, `--accent*`, `--brand*`, `--fern*` et
   les **matières** (`--kraft`, `--card`, `--tape`, `--label-tape`…). Seule couche lue par les composants.
3. **Contextes** qui remappent la sémantique :
   - **lampe** (`:root`, défaut) — le bureau d'encre ;
   - **papier** (`[data-surface='paper']`) — document, fiche, Lecteur, carte ;
   - **kraft** (`[data-surface='kraft']`) — l'intérieur d'une chemise (`Folder`, `Panel surface="kraft"`, `Tabs variant="folder"`) : texte à l'encre, accent safran bruni, vermillon foncé ;
   - **contraste élevé** (`:root[data-contrast='high']`, + papier, + kraft) — AAA ;
   - **vision des couleurs** (`:root[data-color-vision=…]`, combinable) — tons d'état seulement (§3.7).

Aucune palette de framework, aucune couleur littérale dans les composants. Exceptions
documentées : images de curseur (une image ne lit pas les variables), masques et grains en
data-URI (alpha seulement), dégradés de masque en `#000` (alpha seulement).

### 3.2 Palette brute v2

Accordée à l'art clé (`art/keyart/keyart-desk.svg` : papier peint d'encre teinte 263, bois
caramel, flaque safran, crépuscule rose-lilas, kraft). La nuit passe de la teinte 254 (v2 bêta)
à **260**, chroma 0,054–0,06 : un bleu d'encre profond, moins « écran », qui se fond dans le mur
de l'illustration.

| Famille | Tokens bruts | Valeurs | Rôle |
|---|---|---|---|
| Encre de nuit | `--raw-night-1000` … `-400` | `oklch(0.15 0.042 260)` · 950 `0.2 0.054 260` · 900 `0.245 0.058 259` · 850 `0.285 0.06 258` · 800 `0.31 0.058 257` · 700 `0.41 0.056 256` · 500 `0.66 0.055 252` · 400 `0.72 0.046 250` | Bureau, surfaces, lignes |
| Vélin | `--raw-vellum-100`, `-300` | `0.96 0.014 88`, `0.84 0.024 85` | Texte sous la lampe |
| Safran (laiton) | `--raw-brass-300` … `-700` | 300 `0.91 0.12 92` · 400 `0.84 0.155 80` · 500 `0.66 0.13 70` · 600 `0.485 0.112 62` · 700 `0.44 0.105 58` | Action, focus, tranche du bouton (500), accent papier (600/700) |
| Vermillon | `--raw-vermilion-400` … `-700` | `0.72 0.17 36` · `0.62 0.2 33` · `0.53 0.19 30` · `0.46 0.17 29` | Marque : titres, étiquettes, fil, onglet |
| Céladon | `--raw-celadon-300/400/700` | `0.86 0.07 172` · `0.79 0.09 172` · `0.45 0.075 178` | Fougère, ornements, célébration |
| Kraft | `--raw-kraft-200/400/500/700` | manille `0.89 0.055 88` · kraft `0.76 0.08 72` · ombré `0.68 0.09 66` · tranche `0.47 0.075 58` | Chemises |
| Tampon | `--raw-stamp-300/700` | `0.77 0.13 300`, `0.46 0.16 300` | « Établi » |
| Formulaire (v2.2) | `--raw-form-100/300/700` | `0.945 0.03 196` vert d'eau, `0.82 0.07 200` canard clair (v2.3, bureau sombre), `0.42 0.065 212` bleu canard | Case revendiquée (§6.9) |
| États | `--raw-red/green/orange/blue-300/700` | inchangés depuis v1 | Erreur, succès, avertissement, info |
| Papiers, encres | `--raw-paper*`, `--raw-ink-*`, `--raw-rule-blue`, `--raw-steel` | papier neuf `0.978 0.012 92` … encre ferro-gallique `0.27 0.05 262`, réglure `0.76 0.07 236`, acier `0.8 0.012 250` | Documents, fiches, trombones |
| Bois, crépuscule | `--raw-wood-700/500`, `--raw-velvet`, `--raw-dusk-rose/lilac/peach` | bois ombre `0.36 0.05 40`, bois éclairé `0.59 0.065 46`, velours `0.49 0.05 358`, rose `0.85 0.05 0`, lilas `0.84 0.045 291`, pêche `0.86 0.06 55` | **Décor seulement** (jamais un texte) |

### 3.3 Contexte lampe (défaut)

| Token | → brut | Usage |
|---|---|---|
| `--canvas`, `--desk` | night-950 | Fond du bureau ; `--desk` n'est jamais remappé (coin corné, bord de l'art clé) |
| `--surface-1/2/3` | night-900/850/800 | Panneaux ; champs et survols ; creux et pastilles douces |
| `--line` / `--line-strong` | night-700 / night-500 | Séparateurs (décor) / bordures de contrôles (≥ 3:1) |
| `--text` / `--text-muted` / `--text-faint` | vellum-100 / vellum-300 / night-400 | Texte / secondaire / grand texte, désactivé |
| `--accent` / `--accent-strong` | brass-400 / brass-300 | Safran : action, lien, sélection / survol |
| `--accent-contrast` | night-1000 | Texte sur safran |
| `--accent-edge` | brass-500 | **v2** Tranche du bouton principal (relief qui s'enfonce) |
| `--accent-tint` | `oklch(0.84 0.155 80 / 0.15)` | Lavis de survol, cible de dépôt |
| `--focus` / `--focus-halo` | brass-300 / night-1000 | Anneau de focus 3 px + halo |
| `--danger` `--success` `--warning` `--info` | `--raw-*-300` | États |
| `--established` | stamp-300 | Encre violette « Établi » |
| `--brand` / `--brand-strong` / `--brand-fill` / `--brand-contrast` | vermilion-400 / 500 / 600 / paper-new | **v2** Marque : grand texte et ornements (≥ 3:1, 6,8:1 sur canvas) ; aplat d'étiquette et son texte |
| `--fern` / `--fern-deep` | celadon-400 / 700 | **v2** Fougère : volute du titre, ornements, confettis |
| `--lamp-glow` / `--lamp-pool` / `--lamp-dust` | safran 10 % / crème 20 % / crème 55 % | **v2** Halo de fond, cœur du cône (`LampLight`), poussières |
| `--vignette` | encre 55 % | **v2** Coins du bureau dans l'ombre |
| `--edge-light` | blanc 7 % | Liseré haut des surfaces |
| `--stitch` | night-500 55 % | **v2** Surpiqûre du sous-main (décor) |
| `--scrim` | encre 70 % | Voile sous les modales |
| `--scrim-art` | `oklch(0.14 0.045 260 / 0.9)` | **v2** Voile de zone calme posé sur l'art clé sous un menu ou un titre (§8.5) |
| `--selection`, `--keyword` | safran | Sélection, mots-clés |

**Matières** (globales, §6) : `--kraft` `--kraft-shade` `--kraft-edge` `--manila` `--kraft-ink`
· `--card` `--card-rule` `--card-margin` (vermillon-500) · **v2.2** `--claim-paper` `--claim-ink`
`--claim-edge` `--claim-border` `--claim-dash` `--claim-gap` `--claim-tag-h` (case revendiquée, §6.9)
· **v2.3** `--claim-ink-desk` (variante bureau sombre de `--claim-ink`, `--raw-form-300`) · `--tape` `--tape-edge` · `--label-tape`
(bleu `oklch(0.36 0.12 257)`) `--label-tape-red` `--label-tape-text` `--label-sheen` `--label-emboss`
· `--string` `--pin-head` `--metal` `--metal-shade` · `--wood` `--wood-lit` `--velvet` · `--dusk-rose`
`--dusk-lilac` `--dusk-peach` `--dusk-sky` (dégradé du ciel de la fenêtre) · images
`--desk-grain-image`, `--kraft-fiber-image`, `--paper-grain-image`, `--stamp-texture`, masques
`--edge-torn`, `--edge-perforated`.

**Pourquoi violet pour « Établi »** : l'encre violette est celle des tampons administratifs ;
elle sépare la vérité établie (violet + cadenas + tampon) de l'action (safran) et de la marque
(vermillon).

### 3.4 Contexte papier (`[data-surface='paper']`)

| Token sémantique | → token papier | Usage |
|---|---|---|
| `--canvas` / `--surface-1/2/3` | `--paper` / `--paper-new` / `--paper-aged` / `--paper-stain` | Papier, fiche, survol, creux |
| `--line` / `--line-strong` | `--paper-line` / `--paper-line-strong` | Filets / bordures |
| `--text` / `--text-muted` / `--text-faint` | `--ink` / `--ink-muted` / `--ink-faint` | Encre ferro-gallique bleu-noir |
| `--accent` / `--focus` / `--keyword` | `--paper-accent` (brass-600) | Laiton bruni |
| `--accent-edge` | brass-700 | Tranche du bouton |
| états | `--raw-*-700` | |
| `--brand` / `--brand-strong` | vermilion-600 / 700 | Surtitres, filets sur papier |
| `--fern` | celadon-700 | Ornements sur papier |
| — | `--ink-hand` / `--ink-type` | Plume bleue / ruban de machine |

### 3.5 Contexte kraft (`[data-surface='kraft']`) — v2

Posé par `Folder`, `Panel surface="kraft"`, `Tabs variant="folder"`. `--canvas` = `--kraft`,
`--surface-1` = `--manila` (étiquettes, champs), `--text` = `--kraft-ink`, accent = safran bruni
(brass-700), `--brand` = vermillon-700. **Les états ne vont jamais à même le carton** : sur une
étiquette (`--surface-1`, manille) ou une pastille. Contrastes : texte 6,96:1 sur kraft, 5,15:1 sur
kraft ombré, 10,9:1 sur manille ; vermillon 3,58:1 sur kraft (non-texte), 5,59:1 sur manille.

### 3.6 Surlignages (5 couleurs, 5 motifs)

| Token | Valeur | Motif (classe `.hl-n`) | Texte dessus |
|---|---|---|---|
| `--hl-1` | `oklch(0.9 0.13 98 / 0.6)` jaune | plein | 12,3:1 |
| `--hl-2` | `oklch(0.87 0.1 150 / 0.55)` vert | hachuré à −45° | 11,6:1 |
| `--hl-3` | `oklch(0.85 0.07 235 / 0.6)` bleu | pointillé (trame 5 px) | 11,2:1 |
| `--hl-4` | `oklch(0.85 0.08 350 / 0.55)` rose | soulignement ondulé | 11,4:1 |
| `--hl-5` | `oklch(0.86 0.09 60 / 0.6)` orange | encadré 1,5 px | 11,6:1 |

Couleurs forcées : tous deviennent `Mark` / `MarkText`. Vision des couleurs (GAME_DESIGN §17) :
les surlignages **ne changent pas** — le motif suffit à distinguer les cinq ; seuls les tons
d'état sont remappés (§3.9).


### 3.7 Contraste élevé (`data-contrast='high'`)

Noir/blanc neutres, accent jaune, encre papier quasi noire sur blanc, kraft → blanc cassé,
étiqueteuse → noir, vermillon → rose pâle sur nuit (13:1) ou rouge sombre sur papier, plus de
grain, de liseré, de halo ni de lumière de lampe (`--lamp-pool: transparent`), `--scrim` et
`--scrim-art` presque opaques, soulignements 3 px, tampons sans usure. Tous les textes ≥ **7:1**.

### 3.8 Contrastes calculés (résumé)

Méthode : OKLCH → OKLab → sRGB linéaire → luminance WCAG ; translucides composés en sRGB sur leur
fond. **720 paires, toutes conformes** (contextes lampe, papier, HC, carte, carte de nuit,
**matières**, **matières HC**, **kraft**, **kraft HC**, et les douze contextes de vision des
couleurs), plus 12 contrôles d'écart entre tons d'état. Détail : annexe §17.

| Paire (pire cas) | Valeur | Seuil |
|---|---|---|
| `--text` sur `--surface-3` (lampe) | ≥ 12 | 4,5 |
| `--accent-contrast` sur `--accent` (bouton principal) | ≥ 10 | 4,5 |
| `--kraft-ink` sur `--kraft-shade` | 5,15 | 4,5 |
| `--ink` sur `--card` (fiche bristol) | 14,2 | 4,5 |
| `--label-tape-text` sur `--label-tape-red` | 5,33 | 4,5 |
| `--brand-contrast` sur `--brand-fill` | 5,45 | 4,5 |
| `--brand` sur `--canvas` (« aux » du titre) | 6,84 | 4,5 |
| `--card-margin` sur `--card` (ligne de tête) | 3,75 | 3 |
| `--claim-ink` sur `--claim-paper` (cartouche « Déclaré ») | 7,09 (HC 15,85) | 4,5 (HC 7) |
| `--claim-ink` sur `--paper-aged` (valeur déclarée, pire cas) | 6,61 | 4,5 |
| `--claim-ink-desk` sur `--surface-3` (valeur déclarée sur le bureau, pire cas) | 7,75 (HC 14,59) | 4,5 (HC 7) |
| `--text-muted` sur `--scrim-art` posé sur papier neuf (art clé, pire cas) | 9,92 | 4,5 |
| `--brand` sur `--scrim-art` posé sur papier neuf | 6,11 | 4,5 |

**Texte sur l'art clé**, vérifié aussi sur rendu : `packages/ui/.preview/scripts/bgcheck.mjs`
masque le texte, capture le fond et prend le 95ᵉ centile de luminance sous chaque bloc : fond
L ≤ 0,046 sous l'accroche du titre et du héros, soit ≥ 6,7:1 pour `--text-muted`.

### 3.9 Vision des couleurs (`data-color-vision`)

Option Accessibilité (GAME_DESIGN §17, `Settings.colorVision`). **Seuls les cinq tons d'état
changent** (`--danger`, `--warning`, `--success`, `--info`, `--established`) : le laiton d'action,
le texte, les surfaces, les surlignages (motifs) et l'illustration restent. Les tons d'état sont
déjà toujours doublés d'une forme (icône, texte, cadre, tampon) ; ces palettes rendent la couleur
**aussi** discriminante pour la personne concernée.

Méthode : simulation des dichromasies **Machado, Oliveira & Fernandes (2009), sévérité 1**, en
sRGB linéaire ; écart perçu = distance euclidienne OKLab. Chaque palette maximise l'écart minimal
entre états en vision simulée, sous contrainte : AA (≥ 4,5) sur `--surface-1/3` et `--canvas`, en
vision **normale et simulée**, dans le gamut sRGB. Protanopie et deutéranopie partagent l'axe
bleu ↔ jaune et donc la même palette ; la tritanopie suit l'axe rouge ↔ cyan.

| Contexte | `--danger` | `--warning` | `--success` | `--info` | `--established` |
|---|---|---|---|---|---|
| **Protan./deutan.** lampe | `oklch(0.75 0.15 45)` orangé | `oklch(0.89 0.14 95)` jaune clair | `oklch(0.82 0.09 245)` bleu | `oklch(0.91 0.04 200)` givre | `oklch(0.72 0.14 305)` violet |
| papier | `oklch(0.37 0.12 33)` brique | `oklch(0.48 0.095 92)` ocre | `oklch(0.46 0.09 255)` bleu | `oklch(0.37 0.05 230)` ardoise | `oklch(0.37 0.19 295)` violet |
| lampe HC | `oklch(0.8 0.12 49)` | `oklch(0.87 0.17 93)` | `oklch(0.89 0.06 237)` | `oklch(0.81 0.02 193)` | `oklch(0.8 0.13 311)` |
| papier HC | `oklch(0.3 0.11 17)` | `oklch(0.41 0.087 74)` | `oklch(0.4 0.05 243)` | `oklch(0.3 0.12 270)` | `oklch(0.4 0.18 286)` |
| **Tritan.** lampe | `oklch(0.74 0.15 22)` rouge | `oklch(0.88 0.1 75)` paille | `oklch(0.86 0.12 165)` vert d'eau | `oklch(0.76 0.09 250)` bleu moyen | `oklch(0.72 0.13 310)` violet |
| papier | `oklch(0.5 0.15 22)` | `oklch(0.38 0.09 57)` brun | `oklch(0.47 0.1 159)` | `oklch(0.36 0.03 245)` ardoise | `oklch(0.49 0.14 309)` |
| lampe HC | `oklch(0.88 0.055 16)` | `oklch(0.8 0.15 68)` | `oklch(0.9 0.16 155)` | `oklch(0.8 0.09 235)` | `oklch(0.8 0.11 300)` |
| papier HC | `oklch(0.41 0.16 29)` | `oklch(0.4 0.07 73)` | `oklch(0.3 0.06 156)` | `oklch(0.4 0.08 236)` | `oklch(0.3 0.14 316)` |

**Écart minimal entre tons d'état, en vision simulée** (ΔE OKLab ; seuil **0,06** et strictement
supérieur à la palette par défaut, vérifié par `contrast:check`) :

| | Lampe | Papier | Lampe HC | Papier HC |
|---|---|---|---|---|
| Protanopie : défaut → réglage | 0,088 → **0,105** | 0,061 → **0,105** | 0,058 → **0,100** | 0,042 → **0,113** |
| Deutéranopie | 0,054 → **0,103** | 0,025 → **0,099** | 0,021 → **0,089** | 0,022 → **0,113** |
| Tritanopie | 0,022 → **0,110** | 0,032 → **0,127** | 0,036 → **0,101** | 0,021 → **0,113** |

Contraste des tons d'état dans ces contextes (pire cas, vision normale / simulée) : lampe ≥ 5,22 /
4,77 ; papier ≥ 4,66 / 4,60 ; contraste élevé ≥ 7,67 / 7,26 (AAA de fait). Sélecteurs combinés :
`:root[data-color-vision=…]`, `… [data-surface='paper']`, `:root[data-contrast='high'][data-color-vision=…]`
et `… [data-surface='paper']` — la combinaison HC + vision l'emporte toujours par spécificité.


---

## 4. Typographie

Polices **SIL OFL 1.1**, auto-hébergées, WOFF2 en tranches `latin` / `latin-ext`
(`unicode-range`), `font-display: swap`, replis métriques. Licences : `packages/ui/src/fonts/OFL-*.txt`
et `LICENSES.md`. **Aucune police pixel art, jamais Beffroi 8.**

| Rôle | Token | Police | Fichiers (latin + ext) | Usage |
|---|---|---|---|---|
| **Titrage** (v2) | `--font-display` | **Fraunces** variable (wght 100–900, opsz, **SOFT**, **WONK**), romain + italique — « old style » douce et bancale, l'affiche de 1974 | romain 121 + 105 Ko ; italique 150 + 130 Ko | Titre du jeu, titres d'écran et de section, titres de documents ; italique pour l'accroche et « aux » |
| **Étiquettes** (v2) | `--font-label` | **Oswald** variable (wght 200–700) — gothique condensée d'étiqueteuse | 28 + 24 Ko | Boutons, onglets, surtitres, tampons, étiquettes, capitales `.caps` |
| Lecture | `--font-read` | **Literata** (opsz, wght) | 108 + 88 Ko ; ital. 53 + 42 | Texte des documents |
| Interface | `--font-ui` | **Instrument Sans** | 29 + 11 Ko | Texte courant de l'interface, aides |
| Machine à écrire | `--font-type` | **Courier Prime** 400/700 | 18 + 19 (+ ext) | Fiches, rapports, dates, cotes |
| Manuscrite | `--font-hand` | **Caveat** — **remplaçable** | 73 + 29 Ko | Lettres, dos de photos, notes |
| Lisibilité | `--font-legible` | **Atkinson Hyperlegible Next** | 33 + 19 (+ ital.) | Option |
| Dyslexie | `--font-dyslexic` | OpenDyslexic **si installée**, sinon Atkinson | — | Option |

Réglages de Fraunces : `--display-settings: 'SOFT' var(--display-soft), 'WONK' var(--display-wonk)`
(100 et 1 : rond et bancal), graisses `--weight-display` 640 et `--weight-display-black` 900,
interligne `--leading-display` 0,92, approche `--tracking-display` −0,025 em. Oswald en capitales :
`--tracking-stamp` 0,06 em. Avec `data-reading-font="hyperlegible|dyslexic"`, `--font-label` passe
aussi à la police de lisibilité (le titrage Fraunces reste, il n'est jamais du texte à lire
longuement).

**Budget polices** : préchargements autorisés (≤ 2) = **Instrument Sans latin (29 Ko) + Fraunces
romain latin (121 Ko)** sur l'écran titre et le héros du site ; Oswald (28 Ko) suit sans
préchargement (labels en `swap`, métriques proches d'Arial Narrow). Literata arrive avec le
premier document ; l'italique de Fraunces (150 Ko) n'est demandée que par l'accroche et « aux »
(rendus d'abord dans le repli, aucun blocage du LCP). Courier Prime et Caveat à la demande.
**Site vitrine** : un seul préchargement (Instrument Sans) ; Fraunces n'y est plus préchargée,
car ses 121 Ko concurrençaient l'illustration du héros sur mobile (LCP −350 ms environ).

### 4.1 Échelle fluide (360 → 1280 px), multipliée par `--text-scale`

| Token | Plage à 100 % | Usage |
|---|---|---|
| `--step-6` | 52 → 128 px | **v2** Titre du jeu (`Wordmark size="hero"`) |
| `--step-5` | 40 → 68 px | Titre d'écran (`Wordmark size="title"`), titres de section du site |
| `--step-4` | 32 → 48 px | `h1`, titres de section |
| `--step-3` | 26 → 34 px | `h2`, titre de modale |
| `--step-2` | 22 → 26 px | `h3`, titre de panneau, titre de document, accroche |
| `--step-1` | 19 → 21 px | `h4`, bouton `l` |
| `--step-read` | 17 → 19 px | Texte de lecture (site, transcriptions hors Lecteur) |
| `--step-0` | 16 → 17 px | Interface (minimum du texte lu) |
| `--step--1` | 14 → 15 px | Surtitres, pastilles, étiquettes. Jamais un texte qu'il faut lire pour jouer |

**Corps des pièces dans le Lecteur** (v2.5, « Confort de lecture ») :
`calc(var(--step-read) * var(--read-boost) * var(--read-scale))`, soit un cran au-dessus du texte
courant par défaut (`--read-boost: 1.1`, 19 → 21 px) puis la taille choisie par le joueur
(`--read-scale`, réglage `readScale`, A− / A+ : 90 · 100 · 115 · 130 · 150 %). L'écriture manuscrite
garde `× --hand-boost`. `--read-scale` est posé sur le Lecteur (style en ligne), pas sur `<html>` :
il ne touche ni l'interface ni `--text-scale`, et reste distinct du zoom ×1–×4 (qui agrandit la
feuille entière). En disposition Lecture, `--read-layout: var(--read-layout-boost)` (1,1) ajoute
encore un cran (posé par le Bureau, multiplié dans le même calcul).

Interlignes `--leading-tight|snug|ui|read|display` ; approches `--tracking-tight|display|caps|label|stamp|read`,
chacune `+ var(--tracking-extra)` ; graisses `--weight-regular|medium|semibold|bold|display|display-black`.
Conventions : titres Fraunces `text-wrap: balance` ; paragraphes `pretty` ; jamais justifié ;
capitales en Oswald (`.caps`, `.kicker`) ; `.num` = chiffres tabulaires.

### 4.2 Réglages joueur (posés sur `<html>` par le jeu)

Posés par `apps/game/src/lib/game/settings-dom.ts` (`applySettings`) ; valeur par défaut =
attribut absent. Tous sont consommés par `tokens.css` / `base.css` et combinables entre eux.

| `Settings` | Attribut | Effet |
|---|---|---|
| `textScale: 0.875 \| 1.25 \| 1.5 \| 2` | `data-text-scale="0.875"`… | `--text-scale` multiplie toute l'échelle (0,875 : texte réduit, choix explicite du joueur) |
| `readingFont: 'hyperlegible'` | `data-reading-font="hyperlegible"` | Atkinson pour la lecture **et** l'interface ; interlignage 1,8 ; approche +0,05 em ; titres restent en Fraunces, `--font-label` passe aussi à Atkinson |
| `readingFont: 'dyslexic'` | `data-reading-font="dyslexic"` | `--font-dyslexic` (OpenDyslexic locale, sinon Atkinson) pour lecture et interface ; interlignage 1,8 ; approche +0,05 em ; mots +0,12 em ; paragraphes 1,2 em ; titres en Fraunces ; `--font-label` suit |
| `lineSpacing: 'wide'` | `data-line-spacing="wide"` | Interlignes tight 1,25 · snug 1,45 · ui 1,6 · read 1,95 ; paragraphes 1,4 em |
| `lineSpacing: 'wider'` | `data-line-spacing="wider"` | tight 1,4 · snug 1,6 · ui 1,8 · read 2,2 ; paragraphes 2 em (au-delà de WCAG 1.4.12) |
| `letterSpacing: true` | `data-letter-spacing="wide"` | +0,12 em sur les lettres, +0,16 em sur les mots (WCAG 1.4.12), appliqué à **chaque** élément (`:where(…)`, spécificité nulle) et ajouté aux approches des composants via `--tracking-*` |
| `replaceHandwriting: true` | `data-handwriting="replace"` | `--font-hand` → `--font-read`, le style (couleur d'encre) reste |
| `highContrast: true` | `data-contrast="high"` | Contexte contraste élevé (§3.7) |
| `reducePaperTexture: true` | `data-texture="off"` | Grain de papier à 0 (`--paper-grain`), tampons sans usure (`--stamp-texture: none`) ; v2 : ni grain du bureau ni fibres du kraft (`--desk-grain-image`, `--kraft-fiber-image: none`) |
| `colorVision: 'protanopia' \| 'deuteranopia' \| 'tritanopia'` | `data-color-vision="…"` | Tons d'état remappés (§3.9) |
| `motion: 'reduced' \| 'full'` | `data-motion="reduced"` / `"full"` | Force ou ignore `prefers-reduced-motion` ; `'system'` = attribut absent |

Ordre de priorité dans `tokens.css` : police → interlignage → espacement (le réglage le plus
explicite l'emporte : `wider` relève l'interligne de la police de lisibilité).

Sous 360 px CSS effectifs (texte à 200 %), les dispositions passent au cran inférieur
(cf. §5.2 : les points de rupture sont en `rem`, ils suivent la taille du texte système).


Ajout v2 : `data-cursors="ink"` (posé par l'app quand les curseurs de verbes sont actifs) applique
la flèche à l'encre (`--cursor-default`) à toute la page ; sans l'attribut, curseur système.

### 4.3 Le titre du jeu (`Wordmark`)

« L'Arbre aux absents » en Fraunces noire, très douce et bancale ; **« aux » en italique
vermillon** (`--brand`) ; une **volute de fougère** (`Ornament name="flourish"`, `--fern`) sous le
titre ; un surtitre à l'étiqueteuse rouge (`.mat-label.red`, légèrement de travers) ; une accroche
en Fraunces italique `--text-muted`. Tailles : `hero` (`--step-6`, écran titre, héros), `title`
(`--step-5`), `header` (`--step-1`, une ligne, en-têtes). `animate` : surtitre tamponné, mots
encrés un à un (flou → net, `mv-ink`, rang × `--stagger`), volute balayée (`InkReveal`), accroche
qui monte. `glow` : halo de lampe qui vacille derrière. Le texte reste du vrai texte
(`aria-label` sur le titre, mots `aria-hidden`).

### 4.4 Langues : textes des primitives et typographie anglaise (v2.4)

**Textes par défaut des primitives.** Aucune primitive ne porte de français en dur : fermetures
(`Dialog`, `Panel`, `Toast`), région des notifications, `Combobox` (indication, état vide, liste,
compte annoncé), `ClaimTag` (« Déclaré »), `DecisionCard` (« Visé », « Indisponible : »),
`CaseFolder` (« Dernière décision : »), `Loader`, `SkipLink`, `Card` (« Épinglé »), `Stamp`
(« Établi »), `Toggle` (Activé / Désactivé), `TextField` (compteur), `KeyHint` (noms des boutons
de manette, lettres des sticks G/D → L/R), `LanguageSwitch`, `TicketStatus`. Ils viennent de
`UiStrings` (`packages/ui/src/i18n.ts`) :

- `uiFr` (défaut, sans contexte) et `uiEn` (`satisfies UiStrings` : clé manquante ou en trop = erreur
  de typage), `UI_STRINGS[locale]`, `LANGUAGE_NAMES` (« Français », « English » : chaque langue
  s'écrit **dans sa langue**, jamais traduite).
- `setUiStrings(() => UI_STRINGS[lang])` à l'initialisation du composant racine (jeu : `App`,
  site : `+layout`). Passer une **fonction** qui lit un état réactif : le changement de langue en
  cours de partie se propage à toutes les primitives sans les remonter. `getUiStrings()` dans une
  primitive (ou un composant de l'app) rend un objet qui relit la source à chaque accès.
- Une prop explicite (`closeLabel`, `label`, `stamp`…) l'emporte toujours : API inchangée.
- `padLabel(bouton, style, strings?)` prend les textes en troisième argument (déf. français).
- `Wordmark` pose `lang="fr"` sur le titre : « L'Arbre aux absents » ne se traduit pas (D3) et
  se prononce en français dans l'interface anglaise.

**Typographie anglaise** (anglais britannique ; vocabulaire : `docs/i18n/en/GLOSSAIRE.md`).

| Sujet | Règle |
|---|---|
| Longueurs | Prévoir **+15 à 30 %** sur les libellés courts traduits du français vers l'anglais *et* l'inverse selon les mots (« Close » < « Fermer », mais « Last decision: » ≈ « Dernière décision : », « Report progress », « Fixed or closed »). Aucun libellé ne doit dépendre d'une largeur fixe : `white-space: nowrap` seulement sur les tampons, étiquettes et touches ; les rangées passent à la ligne (`flex-wrap`). Les onglets compacts (§9.3 bis) mesurent les libellés réels : rien à régler par langue. |
| Capitales | Oswald capitales par CSS (`text-transform: uppercase`), jamais dans la chaîne : l'anglais s'écrit en **casse de phrase** (« Resume the investigation », pas « Resume The Investigation ») ; les lecteurs d'écran lisent la casse du source. Les capitales anglaises sont plus larges (W, M) : l'approche `--tracking-stamp` reste, pas de réglage par langue. |
| Étiqueteuse (Dymo) | Bande d'une ligne, ≤ 18 caractères visés (« LAST FILED », « ORC 74-118 ») ; au-delà, abréger dans le catalogue (jamais d'ellipse sur une étiqueteuse). Les cotes et numéros (`AA-0042`) ne se traduisent pas. |
| Tampons | Un mot ou deux : « Established », « Endorsed », « Declared », « Closed ». « Fixed in v1.2.0 » est le plus long (frise testée à 360 px). |
| Ponctuation | Pas d'espace avant `: ; ! ?` (les espaces fines insécables françaises disparaissent : préfixes `Unavailable: `, `Last decision: `). Guillemets “…” (‘…’ à l'intérieur) ; la `.claim-value` dessine « » en français et “ ” sous `:lang(en)` (`materials.css`, suit `lang` de `<html>`). |
| Nombres, dates | Toujours `Intl` sur la langue courante : « 17 April 1923 », « 12 Oct 2026 », séparateur décimal point, milliers virgule ; jamais de date ou de nombre concaténé à la main. |
| Coupure | `hyphens: auto` suit `lang` : `<html lang>` à jour dès la bascule (sinon coupures françaises sur du texte anglais). |
| Polices | Toutes les polices couvrent l'anglais (latin) ; aucune tranche à ajouter. Caveat reste la manuscrite. |

---

## 5. Espacement, rayons, mise en page

### 5.1 Tokens

- **Échelle 4 px** : `--space-{0, px, 0-5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24}` (pas de `--space-7`).
- **Gouttière** `--gutter` : 16 → 32 px.
- **Rayons v2, resserrés** (des objets découpés, pas des cartes d'application) : `--radius-paper` 2 ·
  `--radius-xs` 3 · `--radius-s` 5 (boutons, champs) · `--radius-m` 7 (fiches, chemises) ·
  `--radius-l` 10 (panneaux, modales) · `--radius-xl` 16 · `--radius-tab` 9 (coin d'onglet) · `--radius-pill`.
- **Traits** `--border` 1, `--border-strong` 2. **Cibles** `--hit` 44, `--hit-l` 48, `--hit-row` 56.
- **Bureau** : `--header-h` 48/56, `--rail-w` 64/56, `--tabbar-h` 64, volet `--side-min|default|max|step`
  360/440/640/40, `--mini-reader-h` 72, `--drawer-handle` 24, `--popover-w` 320 × `--popover-max-h` 480,
  `--sheet-w` 480, case d'arbre `--slot-w` 144 × `--slot-h` 168, **`--tab-h` 34 (onglet de chemise)**,
  fiche flottante `--float-card-w` 500 × `--float-card-h` 640 (au plus), feuille plein écran
  `--full-sheet-w` 960 (v2.5).
- **Site** : `--site-header-h` 64, `--container` 76 rem, `--container-narrow` 44 rem.

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
│      │                                        │ poignée à encoche, Ctrl+[ ]           │
└──────┴────────────────────────────────────────┴──────────────────────────────────────┘
grid-template-columns: var(--rail-w) minmax(0, 1fr) clamp(var(--side-min), var(--side-w), var(--side-max))
gap: var(--space-3) ; padding: var(--space-3) ; deux Lecteurs comparés = volet de 2 × 360 min.
```

**Poignée du volet** (v2.5) : trait `--line` sur toute la hauteur du volet et **encoche à trois
points** au milieu (pastille `--surface-1`, bord `--line-strong`, points `--text-muted`), visibles au
repos ; survol, focus et glissement passent l'encoche et le trait en `--accent` (`scaleY(1.15)`,
`--dur-base`, neutralisé en mouvement réduit) ; focus : anneau `--focus` 3 px. Cible de saisie
`--hit` de large (pseudo-élément) dans une colonne de `--space-3`. Infobulle et description
accessible : « Glisser pour élargir · double-clic : standard ou large ». Gestes : glisser (enregistré
au relâcher), double-clic ou Entrée / Espace / A (manette) = bascule `--side-default` (440) ↔
`--side-max` (640), flèches ± `--side-step`, Début / Fin = max / min. La largeur est mémorisée
(`Settings.sideWidth`) et réglable aussi dans Options › Affichage (Standard, Large, ou
« Personnalisée (N px) »). `forced-colors` : encoche et trait en `CanvasText`. Téléphone et tablette
portrait : pas de volet, donc pas de poignée.

**Dispositions** (v2.5, desktop et tablette paysage ; `Settings.layout`) : sélecteur dans l'en-tête,
avant les actions — trois `IconButton` à bascule (`aria-pressed`) dans une réglette surpiquée
(`1.5px dashed var(--stitch)`, `--radius-m`), `role="group"` « Disposition du bureau » ; icônes
`layers` (Enquête), `reader` (Lecture), `tree` (Arbre) ; nom accessible et infobulle
« Enquête : arbre et documents côte à côte »… ; `aria-keyshortcuts` `Alt+1/2/3` ; changement
annoncé (« Disposition : Lecture »). Absent en une seule zone (téléphone, tablette portrait).

- **Enquête** : la grille ci-dessus.
- **Lecture** : `grid-template-columns: minmax(0, 2fr) var(--space-3) minmax(0, 3fr)` (volet ~60 %),
  colonne de poignée vide (la disposition fixe la largeur), feuille centrée (`margin-inline: auto`,
  `--measure`), `--read-layout` (texte +1 cran).
- **Arbre** : une colonne ; le volet devient la **fiche flottante** (`FloatingCard`, `shell/`) :
  `aside` « Fiche des documents » `--surface-1`, `--radius-l`, `--shadow-3`, surpiqûre `--stitch`
  comme le volet, `--float-card-w` × `--float-card-h` bornés par le Bureau, entrée `sheetPull`.
  Tête `--hit-row` : poignée-bouton (icône `grip`, intitulé Oswald capitales `--step--1`
  `--text-muted`, curseur `grab`/`grabbing`, survol `--accent`, focus `--focus` 3 px intérieur),
  « Plein écran » et « Replier / Déplier la fiche » (`chevron-up/down`). Position posée en CSS :
  `left: calc((100% - largeur) * x)`, `top: calc((100% - hauteur) * y)` dans une piste aux marges
  du Bureau, avec `x`, `y` ∈ [0, 1] (`Settings.cardPosition`) : la fiche ne sort jamais de l'écran,
  même après un redimensionnement. Glisser (souris, doigt : `touch-action: none`) ou flèches sur
  la poignée (24 px, `Maj` 96 px). Repliée : la tête seule, à la même place. `forced-colors` :
  bord `CanvasText`.

**Plein écran du document** (v2.5, tous formats) : couche `position: fixed` `--z-drawer` sur
`.desk-surface`, Bureau dessous `inert` ; barre avec `Button` « Quitter le plein écran » (ou
« Revenir en fiche » en disposition Arbre, icône `back`), puis la feuille du Lecteur sur
`--surface-1` (`--radius-l`, `--shadow-2`) centrée, `--full-sheet-w` au plus (barre d'outils non
compacte au desktop). Un seul Lecteur est monté : sa place sur le Bureau est tenue par un renvoi
(« Le document est affiché en plein écran »). Focus posé sur la couche à l'entrée (annonce
« Échap pour revenir »), rendu au bouton de départ à la sortie (`Échap`, B, bouton). Icône du
bouton : `external` faute d'icône « plein écran » dédiée (**demande au design-lead** : une icône
`expand` encrée, distincte de `fit`).

**Tablette 600–1279 px** — paysage : rail 56 px + zone principale 55 % + volet 45 % ; portrait :
zone principale plein écran + **tiroir bas** (`Panel` dans une feuille à deux crans 40 % / 90 %,
poignée `--drawer-handle`) et barre d'onglets basse `Tabs variant="bar"`.

*Tiroir à deux crans (tablette portrait, `Desk.svelte`).* La navigation reste « un panneau à la
fois » (barre d'onglets du téléphone), mais la **dernière chemise** ouverte (Arbre, Carte,
Tableau, Galerie) reste posée dans la zone principale ; tout panneau secondaire (Lecteur,
Archives, Catalogue, Carnet, Journal, Aide) s'ouvre par-dessus dans un **tiroir bas** :

- feuille `--surface-1`, coins hauts `--radius-l`, ombre `--shadow-3`, `z-index: var(--z-drawer)`
  (local au Bureau), marges latérales `--space-2` + zones sûres ; le contenu est le `Panel` du
  panneau, sans fond ni surpiqûre (comme dans le volet latéral) ;
- **crans** : 40 % (ouverture) et 90 % de la zone principale ; chaque ouverture repart à 40 % ;
- **poignée** : barre visible `--drawer-handle` × 2 de large, `--drawer-handle` / 4 d'épaisseur,
  `--line-strong` (→ `--accent` au survol et pendant le glissement) ; la cible est toute la tête du
  tiroir (≥ `--hit`), un `<button aria-expanded>` (« Agrandir ou réduire le tiroir ») :
  toucher, clic, `Entrée` ou `Espace` = cran suivant ; `↑` = 90 %, `↓` = 40 % ; glisser la
  poignée suit le doigt (25–95 %) puis se pose sur le cran le plus proche ;
- **fermer** : `IconButton` « Fermer le tiroir » ou `Échap` → retour à la chemise ;
- **mouvement** : entrée `sheetPull`, changement de cran en `block-size` sur `--dur-base` /
  `--ease-paper`, aucune transition pendant le glissement ; en mouvement réduit les durées des
  jetons tombent à ~0 (fondu de `sheetPull`) ;
- le mini-lecteur n'est pas affiché tant que le tiroir est ouvert ; `forced-colors` : bord
  `CanvasText` sur le tiroir et la poignée.

*Carte et fiche du lieu (P06, `MapPanel.svelte`).* Le cadre de la carte est un conteneur en
taille (`container-type: size`) : au-dessus de 48 rem de large, carte et fiche côte à côte ;
plus étroit, la carte en haut (au moins `max(10rem, 40cqb)`, place des boutons de zoom
comprise) et la fiche dessous (≤ 22 rem), chacune dans sa rangée : la fiche défile dans la
sienne et ne passe jamais sur la carte ; étroit et bas (≤ 26 rem, téléphone couché) : de
nouveau côte à côte, fiche ≤ `min(20rem, 48cqi)`.

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

v2 : la zone principale est un **sous-main** (`.desk-surface`, lumière de lampe en haut à droite,
vignette, grain) ; chaque panneau principal (Arbre, Carte, Tableau) est une **chemise**
(`Folder` avec `Tabs variant="folder"` comme onglets) ; le Lecteur est une **feuille** tirée de
sa chemise (`PaperSheet` / `Panel surface="paper"` + `sheetPull`). Recettes : §13.

### 5.4 Le site vitrine

Même identité, même nuit : « le bureau en vitrine ». En-tête 64 px transparent posé sur l'art
clé (wordmark `header`, navigation Oswald, un seul `primary` « Jouer la démo ») ; héros = art clé
plein cadre (§14.1) ; puis sections sur le bureau d'encre avec des **feuilles** et des **fiches**
posées (cartes de fonctionnalités, §14.2), séparées par la vigne de fougère encrée ; artbook en
grille de planches (§14.3) ; pied sobre (§14.4). Grille : conteneur 76 rem, 12 colonnes desktop,
6 tablette, 1 téléphone ; texte long ≤ `--measure`. 360 px : une colonne, art clé 4:5.

---

## 6. Matières et profondeur

### 6.0 Profondeur

| Token | Lampe | Papier | Usage |
|---|---|---|---|
| `--shadow-1` | liseré + contact | brun 20 % | Boutons, fiches de bureau |
| `--shadow-2` | liseré + 10/22 px | 4/12 px | Panneaux, popovers |
| `--shadow-3` | liseré + 28/56 px | 18/40 px | Modales, toasts |
| `--shadow-inset` | creux | creux | Champs |
| `--shadow-paper` | contact chaud + double ombre bleu-nuit | — | Toute feuille, fiche, chemise posée |
| `--shadow-lifted` | plus haute, plus longue | — | Objet saisi, survolé (`mv-held`, `Card` survolée) |
| `--shadow-press` | `0 3px 0 var(--accent-edge)` | tranche bruni | **v2** Tranche du bouton principal : il s'enfonce de `--press-depth` |

Ombres chaudes (teinte 60) au contact, bleu-nuit (260) au loin : jamais de gris. HC papier : trait 2 px.
Calques `--z-*` inchangés (desk 0 … skip 100).

### 6.0 bis Le bureau (`.desk-surface`, `.blotter`)

- **`.desk-surface`** : le fond d'une scène. `::before` porte la flaque de lampe (`--lamp-glow`, en
  haut à droite), la vignette (`--vignette`) et le grain du bois d'encre (`--desk-grain-image`,
  coupé par `data-texture="off"`). Le `body` a la même recette.
- **`.blotter`** : sous-main de cuir surpiqué (`--stitch`, tirets à 4 px du bord) pour un panneau
  d'outils. `Panel surface="desk"` et `Dialog` en héritent la surpiqûre (`::after`).

### 6.1 La feuille (`.mat-paper`, `PaperSheet`)

Papier `--paper*` + grain + `--shadow-paper`, rayon 2. `PaperSheet` : `tone: new|paper|aged`,
`tilt` (±3°, inclinaison de repos), `edge: straight|torn|perforated` (masques `.edge-torn` en bas,
`.edge-perforated` en haut, alpha seul), `fastener: none|tape|clip|pin` (ruban en coins, trombone
en haut à droite, punaise centrée), `sway` (balancement épinglé, couche interne, coupé en
mouvement réduit), `enter: settle|sheet|deal|false`, `index` (cascade), `as`, `padded`. Pose
`data-surface="paper"`.

### 6.2 La chemise (`.mat-kraft`, `.mat-manila`, `Folder`)

Carton kraft (ou manille) avec fibres (`--kraft-fiber-image`, multiplié), onglet de tête au coin
`--radius-tab`, cote collée à l'étiqueteuse rouge, **coin corné** en bas à droite (revers manille
sur le bureau). `Folder` : `title` (vrai `hN`, porté par l'onglet), `headingLevel`, `cote`,
`tone: kraft|manila`, `tabAlign: start|center|end`, `enter` (distribuée), snippets `tabs`
(remplace l'onglet unique, ex. `<Tabs variant="folder">` ; le titre devient alors
`visually-hidden`), `actions`, `children`. Pose `data-surface="kraft"`.

### 6.3 La fiche bristol (`.mat-card`, `IndexCard`, `Card variant="index"`)

Bristol `--card`, **ligne de tête vermillon** (`--card-margin`, 2 px) sous le titre dactylographié
(Courier Prime gras capitales), **réglure bleue** (`--card-rule`) dont le pas suit la taille du
texte et l'interligne du joueur (`--rule-gap = --step-0 × max(1,7, --leading-read)`) : le texte se
pose toujours sur les lignes. La réglure part du corps, la tête peut tenir sur deux lignes.
`IndexCard` : `title`, `headingLevel`, `cote` (coin haut droit), `tilt` (±2°), `deal` (rang de
distribution), snippet. C'est la **case d'arbre** et la note d'hypothèse.

### 6.4 Le tableau de liège : punaises, fil, trombones

`Ornament name="pin"` (tête `--pin-head` vermillon, reflet), `name="clip"` (`--metal`), fil rouge
`--string` (2 px, liaisons de l'arbre et du tableau d'épingles). Les liaisons de l'arbre sont des
fils tendus, jamais des lignes grises.

### 6.5 Le ruban adhésif (`.mat-tape`, `Tape`)

Ruban mat translucide (`--tape`, bords dentelés par masque), `length` (déf. 88 px), `rotate`
(déf. −4°). Tient une note, une photo ; `PaperSheet fastener="tape"` en pose deux en coins.

### 6.6 L'étiqueteuse (`.mat-label`, `DymoLabel`)

Bande plastique embossée : fond `--label-tape` (bleu) ou `--label-tape-red`, lettres
`--label-tape-text` en Oswald capitales, reflet `--label-sheen`, creux `--label-emboss`. Pour une
cote, un nom d'affaire, « Dernier classement ». `DymoLabel` : `text` ou snippet, `tone: blue|red`,
`tilt`. Couleurs forcées : `CanvasText`/`Canvas`.

### 6.7 La lumière (`LampLight`)

Calque décoratif d'une scène (parent positionné) : cône `--lamp-pool` → `--lamp-glow`, centré en
`x`/`y` (%), rayon `radius` ; respiration lente (`mv-breathe`), vacillement optionnel
(`mv-flicker`, `flicker`), **poussières** (`dust` ≤ 24, positions déterministes, dérive
`mv-dust`). `aria-hidden`, sans pointeur ; mouvement réduit : figé, poussières masquées ; HC et
couleurs forcées : absent.

### 6.8 Utilitaires typographiques

`.kicker` (surtitre Oswald avec tiret vermillon), `.display` (Fraunces titrage), `.display-italic`,
`.brand-ink` (texte `--brand`).

### 6.9 La case revendiquée : la déclaration agrafée (v2.2, affaire 2)

Métaphore : le requérant a rempli **son propre formulaire** et l'a **agrafé** sur la fiche de
l'arbre. Tant qu'il en reste un champ, la fiche porte le papier vert d'eau du formulaire, son
encre bleu canard, et un bord en pointillés de « à compléter ». Rien de l'Office : ni violet, ni
cadenas, ni tampon (ceux-là restent la vérité établie, §3.3). Spécification : `docs/game/AFFAIRE-2.md` §1.3.

| Signe (cumulatif, chacun suffit seul) | Rendu | Outil |
|---|---|---|
| 1. Cartouche « Déclaré » | bout de formulaire `--claim-paper`, filet 1 px `--claim-edge`, **agrafe** 16 px (`Icon name="staple" clean`) + « DÉCLARÉ » en Oswald capitales `--step--1` `--claim-ink`, hauteur `--claim-tag-h` (20 px, grandit avec le texte), pivoté de −1,5°, **à cheval sur le bord haut** de la fiche (`straddle`) | `ClaimTag` |
| 2. Bord en tirets | 2 px (`--claim-border`), tiret 6 / espace 4 (`--claim-dash`, `--claim-gap`), `--claim-edge`, tracé dans la fiche (`::before`, quatre dégradés répétés : longueur exacte, rien d'animé) | `.claim-frame` |
| 3. Valeur déclarée | Courier Prime **romain** (le formulaire tapé ; le joueur écrit en gras capitales sur la fiche ordinaire), `--claim-ink`, entre **guillemets « »** à espace fine insécable (`::before`/`::after`, texte de remplacement vide : jamais lus) | `.claim-value` |
| 4. Pas de cadenas ni de tampon | — | — |

- **Bureau sombre (v2.3)** : hors papier (fiche de case en feuille basse, sélecteur P10), la
  valeur déclarée prend `--claim-ink-desk` (canard clair, ≥ 7,75:1 sur toute surface du bureau,
  HC `oklch(0.93 0.035 200)` ≥ 14,59:1). `.claim-value` choisit seule : `--claim-ink-desk` par
  défaut, `--claim-ink` sous `[data-surface='paper']`, `[data-surface='kraft']` et `.mat-card`.
  Aucun forçage `color: var(--text)` chez l'hôte. Le cartouche garde `--claim-ink` (il porte son
  propre papier).
- **Champ posé** dans une case revendiquée : rendu ordinaire de la fiche (sans `.claim-value`) :
  on lit d'un coup d'œil ce qui vient de la requête et ce qui vient du joueur.
- **Établie** : l'hôte retire `claim-frame`, `ClaimTag` et `.claim-value` (état calculé, §1.2 de la
  spec) ; tampon + cadenas + liseré violet comme toute case.
- **Couleur jamais seule** : forme (cartouche, tirets, guillemets, romain vs gras capitales).
  Contrastes : texte du cartouche 7,09:1, valeur déclarée ≥ 6,61:1 sur tout papier, tirets 7,74:1
  sur la fiche ; HC : encre `oklch(0.25 0.035 212)` sur blanc, 15,85:1. Couleurs forcées : tirets
  `CanvasText` (`border: dashed`), cartouche `Canvas`/`CanvasText`.
- **Mouvement** : retirer une valeur déclarée la fait **glisser vers la marge** (`--unclaim-shift`
  14 px, pivot 4°, fondu) en `--dur-unclaim` (200 ms) ; le cartouche se dégrafe de la même façon
  quand le dernier champ déclaré part, et se ré-agrafe à l'envers (« Rétablir la déclaration »).
  Transition Svelte `unclaim` (§8.6) ou classe `.mv-unclaim` (§8.3). **Mouvement réduit : 0 ms**
  (ni glissé ni fondu). La valeur sortante et l'entrante se superposent dans un `.claim-stack`
  (`inline-grid`, une seule case) : aucun saut de mise en page, rien de bloquant.
- **API** :
  - `ClaimTag` : `label` (déf. « Déclaré ») · `straddle` (à cheval sur le bord haut, hôte
    positionné) · `shown` (pose / dégrafe avec `unclaim`) · `decorative` (`aria-hidden` quand le
    nom accessible de l'hôte dit déjà « case revendiquée », cas de la case de l'arbre) · `class`.
  - `IndexCard` : `claimed` (ajoute `.claim-frame` + `ClaimTag straddle`) · `claimLabel`.
  - Classes (`materials.css`) : `.claim-frame` (sur un `.mat-card` ou tout hôte positionné ; ne
    prend que `::before`, `::after` reste à l'hôte), `.claim-value`, `.claim-stack`.
- **Case de l'arbre** (bouton `.slot.mat-card` de `TreePanel`, recette §13.3). Faute de largeur, le
  prénom et le nom déclarés s'y passent des guillemets (cartouche, tirets et romain suffisent) ; le
  métier les garde. Dans la fiche, le portrait déclaré n'est pas en `.claim-value` : vignette et
  texte limité à deux lignes, texte complet en `visually-hidden`.

```svelte
<button class="slot mat-card mv-liftable" class:claim-frame={claimed} …>
  <ClaimTag shown={claimed} straddle decorative />
  <span class="name">
    <span class="claim-stack">
      {#if declared.given}<span class="claim-value" transition:unclaim>{g.given}</span>
      {:else}<span>{g?.given || pm.tree.unknown}</span>{/if}
    </span>
    …
```

  `claimed` = au moins un champ déclaré et case non établie ; `declared.<champ>` = valeur égale à
  celle de la déclaration. Le cartouche déborde de 10 px au-dessus de la fiche : prévoir cet
  espace entre générations (ou `--space-2` de plus en tête de fiche). Le portrait déclaré garde son
  cadre ; sa marque est le cartouche et le nom accessible (« Portrait : visage 12, déclaré »).

### 6.10 Les chemises d'affaire (`CaseFolder`, `CaseFolderGroup`) — v2.2, écran E04

Nouvelle partie : une **chemise kraft par affaire** posée sur le bureau (AFFAIRE-2 §2.1). Même
matière que `Folder` (fibres, onglet `--radius-tab`, coin corné, contexte `kraft`) mais c'est un
**choix** : chaque chemise est un **bouton radio natif** (invisible, couvrant toute la chemise)
dans une étiquette ; `CaseFolderGroup` est le `<fieldset>` qui les range.

- **Contenu** : onglet = cote à l'étiqueteuse rouge (`.mat-label.red`) ; titre Fraunces
  `--step-1` ; ligne Courier Prime `--text-muted` : durée (`clock`) · état (« Non ouvert », « En
  cours, 42 % », « Rapport remis · fins vues 2 / 4 ») ; **mention** facultative (snippet `note`)
  sur une bande de manille (`--surface-1`, icône `info`, Instrument Sans, titre d'affaire en
  `<em>` rendu en Literata italique) : « Se joue seule. Conseillé après *Succession Varenque*… »,
  jamais un verrou ; **tampon de la dernière décision** (`decision`) : `Stamp tone="ink" size="s"`
  en bas à droite, dans le flux (ne couvre jamais le titre), encre neutre : aucune décision n'est
  « la bonne ».
- **Choisie** : soulevée de 2 × `--lift`, liseré intérieur `--border-strong` `--accent` (laiton
  bruni du kraft, ≥ 3:1), ombre `--shadow-lifted`, **coche** dans l'onglet (forme, pas seulement
  couleur). Survol : soulevée de `--lift`. Focus : anneau 3 px `--focus` tracé dans le carton (décalé
  de −6 px : mesuré sur le kraft, pas sur le bureau sombre ; `:has(:focus-visible)`). Mouvement réduit : `--lift` = 0 (liseré et coche restent).
- **Disposition** : cible entière ≥ 72 px de haut ; `CaseFolderGroup` empile sous 600 px
  (37,5 rem), côte à côte au-delà (colonnes égales). Distribution à l'apparition : `deal={rang}`.
- **Accessibilité** : groupe radio natif (Tab entre une fois, flèches changent l'affaire) ; nom =
  titre (`aria-labelledby`), description = durée et état, mention, « Dernière décision : … »
  (`aria-describedby`, le tampon lui-même est `aria-hidden`). Légende du `fieldset` visible
  (`.kicker`) ou masquée (`legendHidden`). Couleurs forcées : cadre `CanvasText`, choisie
  `Highlight`.
- **Contrastes** : paires existantes du contexte kraft (`--text` sur kraft et manille,
  `--text-muted`, `--accent` non-texte, étiqueteuse rouge) : aucun nouveau token.
- **API** : `CaseFolder` : `name` · `value` · `checked` · `onselect(value)` · `title` · `cote` ·
  `duration` · `status` · `note` (snippet) · `decision` · `decisionLabel` (déf. « Dernière
  décision : ») · `tone: kraft|manila` · `deal` · `disabled` · `id` · `class`.
  `CaseFolderGroup` : `legend` · `legendHidden` · `class` · enfants.

```svelte
<CaseFolderGroup legend="Choisir une affaire">
  {#each cases as c, i (c.id)}
    <CaseFolder name="case" value={c.id} checked={choice === c.id} onselect={(v) => (choice = v)}
      title={c.title} cote={c.cote} duration={c.duration} status={statusOf(c)}
      decision={lastDecisionStamp(c)} deal={i}>
      {#snippet note()}Se joue seule. Conseillé après <em>Succession Varenque</em> : …{/snippet}
    </CaseFolder>
  {/each}
</CaseFolderGroup>
```

Les trois **tampons de décision** du rapport final : §6.11.

### 6.11 Les tampons de décision (`DecisionCard`, `DecisionGroup`) — v2.3, rapport final

Dernière étape du rapport quand une question est de type `choice` (AFFAIRE-2 §3.2) : une **fiche
bristol par décision**, même motif que `CaseFolder` (radio natif invisible couvrant la fiche, dans
une étiquette) ; `DecisionGroup` est le `<fieldset>` qui les range.

- **Contenu** : case à cocher dessinée (carré `--ink-muted`, coche quand choisie), **effet
  administratif** en Courier Prime (`--font-type`), jamais l'issue narrative. Choisie : gras,
  liseré intérieur `--border-strong` `--accent`, soulevée de 2 × `--lift`, `--shadow-lifted`, et
  **tampon** `Stamp tone="ink" size="s"` (« Visé ») qui frappe (`animate`), encre neutre : aucune
  décision n'est « la bonne ».
- **Indisponible** (`reason`, donnée par le contenu : `unavailableReason`, ARCHITECTURE §3.2) :
  fiche sans réglure ni ombre, bord en tirets 1 px `--ink-muted`, case en tirets, libellé
  `--ink-muted` ; la **raison** reste à l'encre pleine (`--ink`, icône `info`, préfixe gras
  « Indisponible : ») : lisible au contraste AA, jamais par opacité. Radio `disabled` (exposé
  indisponible, sauté par les flèches), raison en `aria-describedby`. Action facultative
  (`action`, ex. « Revenir au dossier ») sous la fiche, **hors** de l'étiquette.
- **Disposition** : cible ≥ 72 px ; `DecisionGroup` empile sous 600 px (37,5 rem), en ligne
  au-delà (colonnes égales). Distribution `deal={rang}`. Mouvement réduit : `--lift` = 0, le
  tampon se pose en fondu (§9.15).
- **Accessibilité** : groupe radio natif (Tab entre une fois, flèches) ; nom = libellé ; légende
  du `fieldset` = la question (« Décision de l'Office »), visible ou `legendHidden`. Confirmation
  « Apposer ce tampon ? », focus initial sur « Relire ». Couleurs forcées : cadre `CanvasText`,
  choisie `Highlight`, indisponible `GrayText` en tirets.
- **Contrastes** : paires existantes du contexte papier (`--ink`, `--ink-muted` sur `--card`,
  `--accent` non-texte) : aucun nouveau token.
- **API** : `DecisionCard` : `name` · `value` · `checked` · `onselect(value)` · `label` · `stamp`
  (déf. « Visé ») · `reason` · `reasonLabel` (déf. « Indisponible : ») · `action` (snippet) ·
  `deal` · `id` · `class`. `DecisionGroup` : `legend` · `legendHidden` · `class` · enfants.

```svelte
<DecisionGroup legend={q.prompt} legendHidden>
  {#each q.options as o, i (o.id)}
    <DecisionCard name="report-{q.id}" value={o.id} label={o.label} reason={o.unavailableReason}
      checked={answer === o.id} onselect={choose} deal={i} />
  {/each}
</DecisionGroup>
<!-- une option grisée : un seul « Revenir au dossier » sous le groupe (fiches d'égale hauteur) -->
```

Rapport final : fiches d'**égale hauteur** en ligne ; le « Revenir au dossier » est posé **une fois
sous le groupe** (le snippet `action` d'une fiche grandirait toute la rangée).

---

## 7. Mouvement : le langage

### 7.1 Personnalité : « le geste d'archiviste »

**Net, lesté, avec un rebond court au contact.** Les objets ont un poids : ils arrivent vite,
freinent, se calent d'un rien (`--ease-deal`, `--ease-paper`) ; les sorties sont escamotées, plus
courtes que les entrées (`--ease-flick`, ≈ 60 %). Le bureau a une vie lente en fond (≥ 5 s par
cycle, amplitudes minimes). Rien de « digital » : pas de glissements linéaires, de zooms d'interface,
de rebonds élastiques longs, de parallaxes fortes.

### 7.2 Règles

1. Animer **uniquement** `transform`, `opacity`, `filter`. Les couleurs changent sans transition ;
   un tracé se révèle par **balayage** (`mv-wipe`, translation d'un masque), jamais par
   `stroke-dashoffset` (les `pathLength="1"` des ornements de `art/keyart` servent au balayage par
   étapes ou restent statiques).
2. Entrées en `animation-fill-mode: backwards` (jamais `both`) : l'élément revient à ses styles et
   peut être survolé, incliné, saisi pendant et après l'animation.
3. **Rien ne bloque** : pas de `pointer-events: none` pendant une transition, pas d'attente avant
   d'agir, caméra et cascades interruptibles ; une nouvelle action annule l'animation en cours.
4. **Chorégraphie** : un seul « héros » par instant ; cascade = rang × `--stagger-deal` (55 ms,
   ≤ 12 éléments animés, au-delà apparition directe) ou × `--stagger` (120 ms, tampons) ;
   durée totale d'une séquence ≤ 900 ms (hors boucles et titre).
5. **Boucles d'ambiance** : uniquement décor `aria-hidden`, lisent `animation-play-state:
   var(--idle-state)`, période ≥ 5 s, jamais sur un texte à lire ; arrêtées en mouvement réduit,
   et quand l'onglet est caché (le navigateur s'en charge).
6. **Mouvement réduit** = `prefers-reduced-motion: reduce` (sauf `data-motion='full'`) **ou**
   `data-motion='reduced'` : durées ~0, fondus 100–150 ms, écran et balayage 150 ms, pas de
   montée, de flou, de rebond, de secousse, de parallaxe ; boucles figées (`--idle-state: paused`
   et `animation: none`) ; les transitions Svelte deviennent des fondus (`motion.ts`).
7. **Aucune bibliothèque d'animation** dans le jeu ni dans le site (décision v2, §8.10).

### 7.3 Entrées et sorties par surface

| Surface | Entrée | Sortie | Réduit |
|---|---|---|---|
| Écran (titre → bureau, retour menu) | `screenIn` / `.mv-screen-in` : la lumière remonte (opacité, échelle 1,04 → 1, flou 6 px → 0, luminosité 0,6 → 1), 720 ms | `screenOut` : la lumière baisse, 430 ms, `--ease-flick` | fondu 150 ms |
| Chemise (panneau principal) | `.mv-deal` (`Folder enter`) : glissée de biais sur le bureau | fondu court | fondu |
| Onglet de chemise | `.mv-tab` en cascade 40 ms ; onglet actif monte (`translateY` 6 → 0, `--ease-snap`) | — | instantané |
| Document ouvert | `sheetPull` / `.mv-sheet` : tiré de la chemise (montée 70 %, rotation 2,5° → 0), 520 ms | `sheetPull` inverse / `.mv-sheet-out` | fondu |
| Fiche, carte, vignette d'archive | `deal` / `.mv-deal` en cascade | `paperIn` inverse | fondu |
| Feuille posée (note, toast, révélation) | `paperIn` / `.mv-settle` : se pose avec rebond | `.mv-sheet-out` | fondu |
| Modale | se pose (`--ease-paper`) | escamotée (`--ease-flick`) | fondu |
| Toast | distribué depuis le bord (`deal`), incliné −0,6° | fondu + glissé | fondu |
| Tampon | `stampIn` / `.mv-stamp` + `.mv-spread` (halo d'encre) + `.mv-thud` (la cible encaisse) | — | fondu 100 ms |
| Case d'arbre établie | `.mv-lock` (cadenas qui claque) puis `Celebrate` | — | fondu, pas de confettis |
| Titre, accroche | `.mv-ink` (flou → net) mot à mot, `InkReveal` (balayage) | — | fondu |
| Section du site | `use:reveal` → `[data-reveal='in']` (distribution) | — | visible d'emblée |

### 7.4 Micro-interactions (toutes les primitives interactives)

| Primitive | Survol | Appui | Focus | Saisie (glisser) |
|---|---|---|---|---|
| `Button` | monte de 1 px, l'icône frétille (rotation −8°) ; primaire : tranche visible | s'enfonce de `--press-depth` (tranche absorbée) | anneau 3 px | — |
| `IconButton` | icône pivote de 6°, info-bulle Dymo qui se déroule (`scaleX`) | `scale(.94)` | anneau + info-bulle | — |
| `Tabs` | onglet de chemise remonte de 4 px | s'enfonce de 1 px | anneau | — |
| `Card` (interactive), `.mv-liftable` | se soulève (`--lift`) et pivote de −0,4° ; ombre `--shadow-lifted` | se repose, `scale(.99)` | anneau | `.mv-held` : `scale(1.04) rotate(2deg)`, ombre longue |
| `Toggle` | — | piste s'enfonce | anneau | curseur claque (`--ease-snap`) |
| `Slider` | — | pouce `scale(1.15)` | anneau | idem |
| `TextField` | — | — | trait d'encre qui se tire sous le champ (`scaleX` 0 → 1) | — |
| `Badge` dans un compteur | — | — | — | nouvelle valeur : `.mv-pop` |
| Nouvel indice dans un document | — | — | — | `use:rustle={key}` (froissement) |
| Site : carte de fonctionnalité | `use:tilt` (inclinaison 3D ≤ 4° au pointeur souris) | — | — | — |

### 7.5 Ambiance (le bureau vit)

Lampe qui vacille (`mv-flicker`, paliers irréguliers, opacité ≥ 0,8), halo qui respire
(`mv-breathe`, 5,2 s), poussières (`mv-dust`, 16 s), feuille épinglée qui se balance
(`mv-sway`, ±0,6°, 7 s), art clé (§8.5). Un écran a au plus **une** boucle visible au premier plan
en plus de la lumière.

---

## 8. Mouvement : tokens, catalogue, outils

### 8.1 Courbes

| Token | Valeur | Usage |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrées, survols |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Caméra, changements d'état |
| `--ease-in` | `cubic-bezier(0.5, 0, 0.75, 0)` | Sorties simples |
| `--ease-paper` | `cubic-bezier(0.22, 1.2, 0.36, 1)` | La feuille se pose (léger rebond) |
| `--ease-stamp` | `cubic-bezier(0.55, 0, 0.3, 1.45)` | Le tampon frappe |
| `--ease-deal` | `cubic-bezier(0.18, 0.89, 0.32, 1.12)` | **v2** La fiche est distribuée, glisse et se cale |
| `--ease-snap` | `cubic-bezier(0.3, 1.5, 0.5, 1)` | **v2** L'onglet claque, l'interrupteur bascule, le verrou |
| `--ease-flick` | `cubic-bezier(0.6, 0, 0.9, 0.4)` | **v2** Sortie escamotée |
| `--ease-sway` | `cubic-bezier(0.37, 0, 0.63, 1)` | **v2** Boucles (sinus) |
| `--ease-ink` | `cubic-bezier(0.7, 0, 0.2, 1)` | **v2** L'encre se répand, la carte se dessine |

### 8.2 Durées et amplitudes

| Token | Valeur | Réduit | Usage |
|---|---|---|---|
| `--dur-instant` / `--dur-fast` / `--dur-base` / `--dur-open` / `--dur-slow` | 80 / 140 / 220 / 250 / 420 ms | 0,01 ms | Appui / petits déplacements / états / ouverture / révélations |
| `--dur-stamp` | 320 ms | 0,01 ms | Frappe du tampon |
| `--dur-camera` | 600 ms | 0,01 ms | Caméra carte et arbre |
| `--dur-deal` | 480 ms | 0,01 ms | **v2** Distribution d'une fiche |
| `--dur-flip` | 560 ms | 0,01 ms (fondu) | **v2** Recto / verso |
| `--dur-sheet` | 520 ms | 0,01 ms | **v2** Feuille tirée d'une chemise |
| `--dur-screen` | 720 ms | **150 ms** | **v2** Changement d'écran |
| `--dur-draw` | 1600 ms | **150 ms** | **v2** Balayage d'encre (carte, volute) |
| `--dur-spread` | 900 ms | 0,01 ms | **v2** L'encre du tampon s'étale |
| `--dur-celebrate` | 1800 ms | 0,01 ms | **v2** Branche révélée |
| `--dur-rustle` | 360 ms | 0,01 ms | **v2** Froissement |
| `--dur-unclaim` / `--unclaim-shift` | 200 ms / 14 px | 0,01 ms / 0 | **v2.2** Valeur déclarée retirée, cartouche dégrafé (§6.9) |
| `--dur-loop` | 1000 ms | figé | Spinner, plume du `Loader` |
| `--dur-flicker` / `--dur-sway` / `--dur-dust` / `--dur-breathe` | 6,4 / 7 / 16 / 5,2 s | figé | **v2** Boucles d'ambiance |
| `--dur-fade-fast` / `--dur-fade` | 140 / 220 ms | **100 / 150 ms** | Fondus |
| `--stagger` / `--stagger-deal` | 120 / 55 ms | 0 | Cascades (tampons / fiches) |
| `--rise` / `--lift` / `--press-depth` | 8 px / −3 px / 2 px | 0 | Montée / soulèvement / enfoncement |
| `--deal-distance` / `--deal-rotate` | 56 px / 7° | 0 | D'où arrive une fiche |
| `--sway-angle` / `--tilt-max` / `--blur-ink` / `--stamp-from` | 0,6° / 1,5° / 3 px / 1,35 | 0 / statique / 0 / 1 | |
| `--idle-state` | `running` | `paused` | Interrupteur des boucles |
| `--toast-timeout` / `--tooltip-delay` / `--long-press` | 6000 / 400 / 400 ms | — | |

### 8.3 Catalogue (`motion.css`)

Classes `mv-*` (préfixe distinct de `m-` des images-clés, et des classes `m-sheet`/`m-fullscreen`
de `Dialog`). Index de cascade : `style="--i: n"`.

| Nom | Déclencheur | Durée, courbe | Mouvement | Réduit |
|---|---|---|---|---|
| `.mv-deal` | montage (fiche, chemise, carte du site) | `--dur-deal`, `--ease-deal` ; retard `--i × --stagger-deal` | arrive de `(--deal-x, --deal-distance)` en pivotant de `--deal-rotate`, se cale à `--tilt` | fondu |
| `.mv-settle` | montage (feuille, note, panneau) | `--dur-open`, `--ease-paper` | monte de 3 × `--rise`, se redresse, rebond | fondu |
| `.mv-sheet` / `.mv-sheet-out` | ouverture / fermeture d'un document | `--dur-sheet` `--ease-out` / `--dur-base` `--ease-flick` | tiré du bas (origine en bas), se redresse / rentre | fondu |
| `.mv-rise` | montage (texte, liste) | `--dur-slow`, `--ease-out` | monte de `--rise` | fondu |
| `.mv-ink` | montage (titre, mot) | `--dur-slow` ; rang × `--stagger` | flou `--blur-ink` → net | fondu |
| `.mv-stamp` | case établie, tampon | `--dur-stamp`, `--ease-stamp` | `scale(--stamp-from)` → 1, rotation | fondu 100 ms |
| `.mv-spread` | après la frappe (+½ `--dur-stamp`) | `--dur-spread` | halo d'encre qui s'étale et pâlit | absent |
| `.mv-thud` | la cible du tampon | `--dur-fast` | encaisse : `scale(.985)` + 1 px | absent |
| `.mv-lock` | case verrouillée | `--dur-slow`, `--ease-snap` | le cadenas tombe et claque | fondu |
| `.mv-ripple` | dépôt réussi | `--dur-slow` | onde concentrique qui pâlit | absent |
| `.mv-rustle` | nouvel indice, page tournée (`use:rustle`) | `--dur-rustle` | froissement (micro-rotations autour de `--tilt`, amplitude × `--rustle-amp`, 0–1, défaut 1) | absent |
| `.mv-unclaim` | valeur déclarée retirée (§6.9) | `--dur-unclaim`, `--ease-out`, `forwards` | glisse de `--unclaim-shift` vers la marge, pivote de 4°, s'efface | instantané |
| `.mv-pop` | compteur qui change | `--dur-base`, `--ease-snap` | `scale` 1,25 → 1 | absent |
| `.mv-tab` | onglets au montage | `--dur-base`, `--ease-snap`, 40 ms / rang | sortent de la chemise | instantané |
| `.mv-screen-in` / `-out` | changement d'écran | `--dur-screen` / `--dur-base` | §7.3 | fondu 150 ms |
| `.mv-wipe` + `.mv-wipe-inner` (`InkReveal`) | tracé, titre, carte | `--dur-draw`, `--ease-ink` | balayage (le cadre avance, le contenu reste fixe) | 150 ms |
| `.mv-flicker` | boucle | `--dur-flicker`, `steps` | vacillement (opacité ≥ 0,8) | figé |
| `.mv-breathe` | boucle | `--dur-breathe` | halo respire (`scale`, opacité) | figé |
| `.mv-sway` | boucle | `--dur-sway` | balancement ±`--sway-angle` (origine en haut) | figé |
| `.mv-dust` | boucle | `--mote-d` (≈ `--dur-dust`) | dérive `(--mote-dx, --mote-dy)` | masqué |
| `.mv-liftable` / `.mv-pressable` / `.mv-held` | survol, appui, saisie | `--dur-base` / `--dur-instant` / `--dur-fast` | §7.4 | statique |
| `[data-reveal]` (`use:reveal`) | entrée dans la vue | comme `.mv-deal` | §7.3 | visible d'emblée |
| `.mv-parallax` | défilement (`animation-timeline: view()`) | linéaire | dérive de `--parallax` (40 px) | absent |
| Confettis (`Celebrate`) | branche révélée (`key` change) | `--dur-celebrate` | ≤ 40 papiers (vermillon, safran, céladon, kraft) en gerbe | absent |
| `FlipCard` | `flipped` | `--dur-flip`, `--ease-paper` | rotation Y 180° (face cachée `inert`) | fondu croisé |

### 8.4 Primitives de mouvement

- **`InkReveal`** : `from: left|right|top|bottom`, `index`, `blur`, `key` (rejoue), snippet. Balayage
  d'encre de n'importe quel contenu (volute, titre, tracé de carte, vigne de fougère).
- **`Celebrate`** : `key` (rejoue), `count` (≤ 40), `x`, `y` (%). Gerbe de confettis de papier.
- **`FlipCard`** : `flipped` (bindable), snippets `front`, `back`.
- **`LampLight`** (§6.7), **`Wordmark animate`** (§4.3), **`KeyArt animate`** (§8.5).

### 8.5 L'art clé vivant (`KeyArt`, `keyart.css`)

Fichiers : `art/keyart/keyart-desk.svg` (16:9, viewBox 1600 × 900) et `keyart-desk-tall.svg`
(4:5, 800 × 1000, **recomposé**, pas recadré). L'app importe le SVG brut (`?raw`) et le passe à
`<KeyArt svg={…} />` ; **`<ArtDefs />` doit être rendu sur l'écran** (motifs `#art-hatch…`).

- **Palette** : inliné avec `class="art"` seulement, **jamais `on-night`** (la nuit est peinte dans
  l'image ; `on-night` l'inverserait).
- **Cadrage** : `fit="cover"` (déf.) via `preserveAspectRatio … slice` ; `anchor: start|center|end`
  (start garde la fenêtre et la lampe). 16:9 au-dessus de 760 px, 4:5 en dessous (n'inliner
  qu'une des deux : `matchMedia`).
- **Bords** : les bords valent ~L 0,27, plus clairs que `--desk` : `fade="edges"` (masque sur les
  quatre bords), `"right"`, `"bottom"` (4:5 au-dessus d'un menu) ou `"none"` (plein cadre).
- **Zone calme** : tiers droit du 16:9 (mur sombre, liège, carte dans la pénombre). Un menu ou un
  titre s'y pose sur un voile `linear-gradient(to left, var(--scrim-art) 62 %, transparent)`.
- **Animation** (`animate`, déf. vrai → classe `.keyart-live`) : groupes et origines du README de
  l'art, en `transform-box: view-box`, `transform`/`opacity` seulement :

| Groupe (`keyart-desk-…` / `keyart-desk-tall-…`) | Origine 16:9 / 4:5 | Animation | Réduit |
|---|---|---|---|
| `-lamp-light` | 748 278 / 285 304 | vacillement en paliers (`--dur-flicker`, opacité 1 → 0,82 → 1, jamais < 0,8) + respiration `scale(1.012)` | figé (opacité 1) |
| `-dust-far` / `-dust-near` | 789 423 / 319 460 | `translate(6px,-18px)` en 14 s / `translate(-10px,-26px)` en 9 s, aller-retour, opacité 0,5 → 1 | figé |
| `-steam` | 1270 467 / 170 357 | `translateY(-14px) scaleX(1.15)`, opacité 0 → 1 → 0, ≈ 5 s | figé |
| `-curtain` | 512 2 / 422 4 | `rotate(±0.8deg) skewX(±1.2deg)`, `--dur-sway`, aller-retour | figé |
| `-pages` + `-pages-shadow` | 141 644 / 13 844 | la feuille se soulève (`rotate(-4deg) skewY(-2deg)`) une fois toutes les ≈ 10 s, ombre 1 → 0,5 | figé |

Ornements animés de `art/keyart` (`flourish-fern-vine`, `-seal`, `-tampon`) : vigne de fougère
inlinée dans un `InkReveal` (séparateur de section du site) ; cachet et tampon : `scale` + opacité
selon leur README, **sans** `stroke-dashoffset` (§7.2).

### 8.6 Transitions Svelte et actions (`@arbre/ui` → `motion.ts`)

Sans dépendance ; lisent les tokens au moment de jouer (réglages et mouvement réduit inclus).

| Export | Type | Paramètres | Effet | Réduit |
|---|---|---|---|---|
| `deal` | transition | `index`, `delay`, `dir` | fiche distribuée | fondu `--dur-fade` |
| `paperIn` | transition | `index`, `delay` | feuille posée | fondu |
| `sheetPull` | transition (in et out) | `index`, `delay` | feuille tirée / rangée | fondu |
| `screenIn` / `screenOut` | transition | `delay` | changement d'écran | fondu |
| `stampIn` | transition | `index`, `delay` | coup de tampon | fondu |
| `inkIn` | transition | `index`, `delay` | encre qui sèche | fondu |
| `unclaim` | transition (in et out) | `index`, `delay` | **v2.2** valeur déclarée qui glisse hors de la fiche, cartouche dégrafé / ré-agrafé (§6.9) | **0 ms** |
| `reveal` | action | `threshold`, `once` | `data-reveal` pending → in (IntersectionObserver) | `in` d'emblée |
| `tilt` | action | `max` (déf. 4°) | `--tilt-x/--tilt-y` au pointeur souris | inactif |
| `rustle` | action | `key` | rejoue `.mv-rustle` | neutralisé |
| `prefersReducedMotion()`, `tokenMs(name)`, `EASE` | utilitaires | | réglage effectif, durée d'un token, courbes JS | |

### 8.7 Transitions d'écran (chorégraphies)

- **Titre → Bureau** : le menu s'escamote (`screenOut`, 430 ms) ; le Bureau entre (`screenIn`) ;
  puis la chemise active est distribuée (`mv-deal`), ses onglets sortent (`mv-tab`), les fiches
  de l'arbre arrivent en cascade (rang × 55 ms, ≤ 12), le Lecteur est tiré (`sheetPull`, +120 ms).
  Total perçu ≈ 1,2 s, interactif dès la première image.
- **Changement de panneau** (onglet de chemise) : contenu sortant escamoté (`--dur-base`,
  `--ease-flick`), entrant distribué ; pas de glissement latéral de tout l'écran.
- **Ouverture d'un document** : la vignette (Archives) reste en place, la feuille est **tirée** du
  bas du Lecteur (`sheetPull`) ; fermeture : elle rentre. Deux documents comparés : le second avec
  `index: 1`.
- **Révélation** : `Dialog surface="paper"` se pose ; à la fermeture, s'il y a verrouillage :
  tampon (`stampIn`) → choc (`mv-thud`) → cadenas (`mv-lock`) → `Celebrate`, en ≤ 900 ms.

### 8.8 Site : révélations au défilement

Sections et cartes : `use:reveal` (+ `style="--i: n"` pour la cascade) ; séparateurs : vigne
`InkReveal` ; éléments de décor : `.mv-parallax` (CSS `animation-timeline: view()`, ignoré là où
ce n'est pas pris en charge). Sans JavaScript, rien n'est masqué (l'attribut n'est posé que par
l'action).

### 8.9 Mesures

Aucune animation ne touche la mise en page ; `will-change` réservé aux groupes de l'art clé.
Clips de référence : `captures/ds2-motion-{title,title-phone,desk,catalogue,hero}.webm`.

### 8.10 Décision : pas de bibliothèque d'animation, même pour le site

Évaluée pour le site : une petite bibliothèque (Motion One ≈ 4 Ko) n'apporterait que le
défilement piloté, déjà couvert par `IntersectionObserver` (`reveal`) et `animation-timeline:
view()` (parallaxe). Tout le reste est CSS + transitions Svelte, partagé par le jeu (qui doit
rester sans dépendance). Coût nul en JS, mouvement réduit garanti par les tokens. Décision à
revoir seulement pour une scène défilée complexe (artbook interactif).

---

## 9. Iconographie et composants (`packages/ui/src/primitives/`)

### 9.0 Icônes, curseurs

- **Encrées à la main** (v2) : chaque icône est dessinée en géométrie propre sur la grille 24
  (`icon-geometry.ts`), puis **encrée** par `scripts/ink-icons.mjs` : rééchantillonnage, trait
  irrégulier (bruit sinusoïdal déterministe), dépassements de plume aux extrémités, recouvrement
  des formes fermées, et un **second passage d'encre** (`ICON_RETRACE`, 0,4 × l'épaisseur, 50 %
  d'opacité). Sortie : `icons.ts` (généré, 38,8 Ko, 11,4 Ko gzip). Régénérer :
  `npm run icons:ink -w @arbre/ui`.
- `Icon` : `name`, `size`, `weight` (déf. 1,75), `wash` (tache d'aquarelle derrière : `true` =
  safran, ou une couleur token), `clean` (géométrie nette, pour 16 px et moins).
- **61 icônes** (`ICON_NAMES`) : panneaux `tree archives reader catalog notebook map pinboard
  journal faces help` · navigation `menu pause back forward chevron-down chevron-up close plus minus
  external grip list layers settings sound` · verbes `look search take write pin use highlight note`
  · lecteur `flip transcript zoom-in zoom-out fit` · états `lock check stamp face unknown-person
  star clock info warning danger trash save quill` · **v2** `lamp fern folder envelope photo compass
  typewriter clip sparkle` · **v2.2** `staple` (agrafe de la case revendiquée).
- Une icône = un sens partout. Toujours `aria-hidden` ; le nom est porté par le contrôle.
- **Curseurs** v2 : flèche taillée à l'encre de nuit (`#182039`) à liseré vélin (`#f7efdc`), trait de
  safran (`#f2b33d`) sur le fût ; pastille du verbe dessinée à la plume. 32 px, point chaud (3, 2),
  repli système. Actifs sur toute la page avec `:root[data-cursors='ink']`, par élément avec `data-verb`.

| Verbe | `data-verb` | Token | Repli |
|---|---|---|---|
| Regarder | `look` | `--cursor-look` | `zoom-in` |
| Prendre | `take` | `--cursor-take` | `grab` |
| Déplacer (tenu) | `hold`, `.is-dragging` | `--cursor-hold` | `grabbing` |
| Écrire | `write` | `--cursor-write` | `text` |
| Épingler | `pin` | `--cursor-pin` | `copy` |
| Utiliser | `use` | `--cursor-use` | `alias` |

### 9.0 bis Règles communes

Svelte 5 runes, tokens sémantiques seulement, focus `outline 3px --focus` décalé de 2 px, cibles
≥ 44 px, conformes en contextes lampe, papier, kraft, HC et couleurs forcées ; textes par défaut
lus dans `UiStrings` (§4.4), jamais en dur.
`{@html}` interdit **sauf** `KeyArt` (SVG du dépôt, vérifié par `checkSvg`).

| # | Primitive | API | v2 : matière et mouvement | Accessibilité |
|---|---|---|---|---|
| 9.1 | `Button` | `variant: primary\|secondary\|ghost\|danger` · `size: m\|l` · `href` · `loading` · `block` · `iconName`/`icon`/`iconEnd` · `verb` | Libellé **Oswald capitales** ; primaire safran à **tranche** (`--shadow-press`) qui s'enfonce ; survol : +1 px, icône qui frétille | `aria-busy` en chargement ; un seul `primary` par vue |
| 9.2 | `IconButton` | `label` · `icon` · `variant` · `size` · `pressed` · `badge`, `badgeLabel` · `tooltip`, `tooltipPlacement` | Icône encrée qui pivote ; **info-bulle étiqueteuse** ; pastille `mv-pop` | `aria-label`, `aria-pressed` |
| 9.3 | `Tabs` | `items` · `value` · `label` · `variant: line\|bar\|rail\|folder` · `compact` · `activation` · snippet | **`folder`** (v2) : onglets de chemise kraft, actif monté et lié au carton, trait vermillon ; Oswald capitales ; `line` et `folder` passent en icônes seules quand ça déborde | Motif ARIA tabs complet |
| 9.4 | `Panel` | `title` · `kicker` · `surface: desk\|paper\|kraft` · `enter: sheet\|settle\|false` · … | Sous-main surpiqué (desk), feuille (paper), **carton** (kraft) ; titre Fraunces `--step-2`, surtitre `.kicker` | `<section aria-labelledby>` |
| 9.5 | `Card` | `variant: fiche\|document\|photo\|index` · `deal` · … | **`index`** : fiche bristol réglée ; `deal` = rang de distribution ; survol soulevé `--shadow-lifted` | Titre = lien/bouton |
| 9.6 | `Dialog` | inchangée | se pose, sort escamotée ; surpiqûre ; surtitre Oswald ; titre `--step-3` ; au téléphone, `m-sheet` et `m-fullscreen` (pleine largeur) entrent et sortent en translation verticale seule, sans rotation ni échelle (jamais de défilement horizontal, même pendant l'animation) | `<dialog>` modal |
| 9.7 | `TextField` | inchangée | trait d'encre au focus | |
| 9.8–9.9 | `Select`, `Combobox` | inchangées | | |
| 9.10 | `Toggle` | inchangée | curseur qui claque (`--ease-snap`) | `role="switch"` |
| 9.11 | `Slider` | inchangée | pouce qui grossit à l'appui | |
| 9.12 | `Toast` | inchangée | **fiche papier** distribuée, inclinée −0,6°, titre tapé. **Téléphone** (< 600 px) : bande compacte pleine largeur, titre en `--font-ui` demi-gras casse normale (`--tracking-read`, `--leading-snug`), glyphe 20 px, inclinaison −0,3° ; `ToastRegion` la pose en bas, à `--space-2` des bords et des encoches (`env(safe-area-inset-*)`), au-dessus de la barre d'onglets (`offset`) | `aria-live` |
| 9.13 | `Tooltip` | inchangée | bande d'étiqueteuse | |
| 9.14 | `Badge` | inchangée | | |
| 9.15 | `Stamp` | `text` · `tone` · `size` · `rotate` · `animate` · `delay` · `label` | **Structure v2** : `.stamp-wrap` (`role="img"`) contenant le tampon et son **halo d'encre** `.spread` ; Oswald ; frappe + étalement | `aria-label` |
| 9.16–9.20 | `KeyHint`, `FocusRing`, `VisuallyHidden`, `SkipLink`, `Loader`, `Icon`, `ArtDefs` | inchangées | `Icon` encrée (§9.0) | |
| 9.22 | `Folder` | §6.2 | chemise kraft/manille | vrai titre `hN` |
| 9.23 | `PaperSheet` | §6.1 | feuille | `as` sémantique |
| 9.24 | `IndexCard` | §6.3 · `claimed`, `claimLabel` (§6.9) | fiche bristol ; revendiquée : tirets + cartouche | vrai titre `hN` |
| 9.25 | `Tape`, `DymoLabel` | §6.5, §6.6 | | décor `aria-hidden` (Tape) / texte réel (Dymo) |
| 9.26 | `Ornament` | `name` · `size` · `weight` · `flip: x\|y\|xy` · `rotate` | §10.11 | `aria-hidden` |
| 9.27 | `LampLight` | §6.7 | | `aria-hidden` |
| 9.28 | `Wordmark` | §4.3 | | `aria-label` |
| 9.29 | `KeyArt` | `svg` · `animate` · `fade: none\|edges\|right\|bottom` · `fit: cover\|contain` · `anchor: start\|center\|end` · `label` | §8.5 | décor (`aria-hidden`) ou `role="img"` + `label` |
| 9.30 | `InkReveal`, `Celebrate`, `FlipCard` | §8.4 | | `inert` sur la face cachée |
| 9.32 | `ClaimTag` | §6.9 | cartouche agrafé, transition `unclaim` | texte réel, ou `decorative` (`aria-hidden`) |
| 9.33 | `CaseFolder`, `CaseFolderGroup` | §6.10 | chemise kraft qui se soulève ; `deal` | radio natif dans un `fieldset` |
| 9.34 | `DecisionCard`, `DecisionGroup` | §6.11 | fiche de décision, tampon `ink` qui frappe ; grisée avec sa raison | radio natif dans un `fieldset`, indisponible `disabled` + description |
| 9.35 | `LanguageSwitch` | §9.35 | réglette, langue choisie en bande d'étiqueteuse collée | radios natifs dans un `fieldset`, ou liens `hreflang` + `aria-current` ; `lang` par nom |
| 9.36 | `TicketStatus` | §9.36 | frise de tampons, l'étape actuelle frappe | `<ol>`, `aria-current="step"`, état lu en texte |
| 9.31 | `Coachmark` | `anchor` (fonction) · `kicker` · `text` · `actionLabel`/`onaction` · `skipLabel`/`onskip` · `placement` · `bottomInset` · `id` · snippet | **Note de service** : bande de papier (contexte papier) à liseré safran, posée près de sa cible avec une flèche, liseré pointillé autour de la cible ; se pose comme une feuille (`--dur-open`, `--ease-paper`) | `<aside>` nommé par son surtitre, décrit par son texte ; jamais de focus pris ; §9.31 |

Utilitaires CSS : base.css (`.reading`, `.ink-type`, `.ink-hand`, `.num`, `.caps`, `.grain`,
`.kw[data-state]`, `.hl-1…5`, `.visually-hidden`, `.skip-link`, `[data-verb]`, `.logo-mono`),
materials.css (§6, dont `.claim-frame`, `.claim-value`, `.claim-stack`), motion.css (§8.3).

### 9.3 bis Onglets compacts (`line` et `folder`)

Le volet latéral du Bureau porte six onglets (Lecteur, Archives, Catalogue, Carnet, Journal,
Aide) : à 440 px, icônes + libellés débordent. `compact` règle le repli :

- `'auto'` (défaut) : une copie invisible, hors flux et rognée, mesure la largeur naturelle des
  libellés (`ResizeObserver` sur la liste et la copie, donc aucune oscillation) ; s'ils ne tiennent
  pas **et que tous les onglets ont une icône**, la liste passe en **icônes seules** (cases ≥ 44 px
  réparties, libellé `visually-hidden` toujours lu, info-bulle sous l'onglet au survol/focus,
  pastilles en exposant). Dès que la place revient, les libellés reviennent.
- `true` : icônes seules en permanence (si toutes les icônes existent) ; `false` : jamais.
- **Repli sans icônes** (ou icônes elles-mêmes trop nombreuses) : défilement horizontal visible —
  barre fine `--line-strong`, **fondus de bord** (masque `linear-gradient`, alpha seul, non animé)
  du côté où il reste du contenu, et l'onglet actif est ramené dans la vue (sans défilement animé).

Recommandation Bureau : `Tabs variant="line"` du volet avec les icônes de `PANEL_ICONS` (déjà le
cas) — le mode `'auto'` suffit, aucune prop à ajouter.

v2 : la même mesure s'applique à `variant="folder"` (barre de chemises du Bureau à 390 px :
icônes seules, info-bulle sous l'onglet).

### 9.31 Bulle de tutoriel (`Coachmark`)

Le tutoriel (GAME_DESIGN §15) parle par **notes de service** : une collègue de l'Office de
réinscription civile glisse un mot au nouveau rapporteur, à côté de l'élément réel qu'il doit
toucher. Une seule note à la fois, **au moment du geste** (jamais de diaporama d'entrée).

- **Matière** : `data-surface="paper"` (`--surface-1`, `--text`), liseré `--accent` de 5 px au
  début, `--radius-paper`, `--shadow-lifted`, inclinaison −0,4° ; surtitre `--font-label`
  capitales `--step--1` en `--accent` avec la plume (`quill`) ; texte `--step-0`,
  `--leading-snug`. Largeur `min(22rem, 100vw − 2 × --space-2)`. Boutons : « Passer le
  tutoriel » (`ghost`) puis « Compris » (`primary`, le seul de la note), cibles ≥ 44 px.
- **Ancrage** : `anchor()` est relue à chaque image (défilement, panneau changé, redimensionnement).
  La note se place au-dessous, au-dessus, à droite ou à gauche de la cible (`placement` préféré),
  centrée ou alignée sur un de ses bords, en choisissant la position qui **couvre le moins de
  contrôles** (boutons, onglets, champs : relus toutes les 300 ms), avec une hystérésis pour ne
  pas sautiller. Flèche (carré de papier tourné de 45°) vers la cible ; liseré pointillé
  `--border-strong` `--accent` autour de la cible (`pointer-events: none`, ne capte rien).
  Cible trop grande : note posée dans son bas, sans flèche. **Pas de cible visible** (panneau
  fermé au téléphone…) : note posée en bas de l'écran, au-dessus de la barre d'onglets
  (`bottomInset`), jamais d'impasse.
- **Jamais un obstacle** : la note est `pointer-events: none`, seuls ses boutons captent le
  pointeur ; un clic sur son texte passe à ce qu'elle recouvre.
- **Pile** : `--z-popover` (sous les modales, toasts et info-bulles). Une modale ouverte
  (`dialog[open]`) masque la note (elle serait inerte) ; elle revient à la fermeture.
- **Mouvement** : entrée `m-fade-in` + pose (montée de 1,5 × `--rise`, rotation 1,2° → 0),
  `--dur-open` `--ease-paper` ; aucune boucle, aucune pulsation. Mouvement réduit : fondu seul
  (tokens). Aucune note ne disparaît seule par minuterie (GAME_DESIGN §17) ; elle se range quand
  le geste attendu est fait, sur « Compris », sur Échap / B / retour Android.
- **Accessibilité** : `<aside>` (`complementary`) nommé « Note de service », décrit par le texte.
  La note **ne prend jamais le focus** ; l'hôte l'annonce dans la région live **polie
  permanente** de l'application (une région créée avec son texte n'est pas toujours lue).
  Échap est routé par l'hôte (intercepte le retour avant la pause). Si le focus était sur un
  bouton de la note quand elle se range, il revient sur la cible ou sur `#contenu`.
  Couleurs forcées : cadre `CanvasText`, liseré et cible `Highlight`, flèche masquée. Texte au
  verbe du périphérique actif (« touchez », « cliquez sur », « sélectionnez »).
- **Contrastes** : paires existantes du contexte papier (`--text` / `--surface-1`,
  `--accent` sur papier pour le surtitre, bouton primaire) : aucun nouveau token.

### 9.35 Sélecteur de langue (`LanguageSwitch`) — v2.4

Une **réglette** (liseré `--line`, `--radius-s`) où la langue choisie est une **bande
d'étiqueteuse collée** (`.mat-label` bleue, relief, de travers de −1,5°) et l'autre de simples
capitales Oswald `--text-muted`. La différence est une **forme** (bande en relief contre texte nu),
pas seulement une couleur. Survol : la langue non choisie passe en `--text` et se soulève de
`--lift` ; la bande se pose en `--dur-fast` `--ease-snap` (transform seul ; mouvement réduit : 0).

- **Écran titre** (sans `hrefs`) : `fieldset` + radios natifs invisibles couvrant chaque
  étiquette (Tab entre une fois, flèches pour changer, Espace). Légende « Langue » / “Language”
  masquée sauf `labelVisible`. Sous le menu, à droite des crédits.
- **En-tête du site** (`hrefs`) : `nav` + liens `hreflang`, la page courante dans chaque langue
  (mêmes slugs sous `/en/`, D8), `aria-current="true"` sur la langue courante. `short` à 360 px.
- Chaque nom porte son `lang` (`lang="fr"` sur « Français », `lang="en"` sur « English ») ;
  `short` affiche FR / EN ; le nom accessible (`aria-label` du lien ou du radio) commence par ce
  texte visible, suivi du nom complet (« EN, English », WCAG 2.5.3 : le nom contient le libellé
  visible). Cibles ≥ `--hit` ; focus 3 px `--focus` autour de
  l'étiquette (`:has(:focus-visible)`). Couleurs forcées : réglette `CanvasText`, bande choisie
  `CanvasText`/`Canvas` (règle `.mat-label`).
- **Contrastes** : paires existantes (`--label-tape-text` / `--label-tape`, `--text-muted` sur
  `--canvas` et `--surface-*`, tous contextes) : aucun nouveau token.
- **API** : `value` (bindable, `'fr' | 'en'`) · `onchange(locale)` · `locales` · `hrefs` · `short`
  · `label` · `labelVisible` · `name` · `class`.

```svelte
<LanguageSwitch value={app.lang} onchange={(l) => app.setLanguage(l)} />            <!-- titre -->
<LanguageSwitch value={lang} hrefs={{ fr: `/le-monde/`, en: `/en/le-monde/` }} short /> <!-- site -->
```

Le réglage `system` (« Langue du système ») n'est pas dans la réglette : c'est une option du
`Select` des Options (ARCHITECTURE, `LanguageSetting`), **seul contrôle de langue des Options**
(pas de réglette à côté : deux contrôles nommés « Langue » seraient ambigus au lecteur d'écran).
La réglette de l'écran titre montre la langue résolue.

### 9.36 Suivi d'un signalement (`TicketStatus`) — v2.4

Une **frise de tampons** : Reçu → Confirmé → En cours → **issue**. L'issue est un seul cran à
deux visages, parce que les deux statuts terminaux s'excluent (ARCHITECTURE §8 : un ticket fermé
avec jalon est `fixed`, sans jalon `closed`) : « Corrigé v1.2.0 » au **tampon violet de la vérité
établie** (`tone="established"`), ou « Classé » à l'encre neutre, suivi de sa raison en Courier
Prime `--text-muted` (Résolu, Doublon, Non retenu). Tant qu'il n'y a pas d'issue, le cran porte
« Corrigé ou classé » en attente.

- **États** : étape franchie = tampon `ink` `size="s"`, pastille pleine, fil plein
  (`--text-muted`) ; étape actuelle = tampon qui **frappe** (`animate`, §9.15 ; mouvement réduit :
  fondu) ; à venir = cadre de tampon vide en tirets `--line-strong`, libellé Oswald `--text-muted`,
  pastille creuse, fil en tirets. Un statut sauté (Reçu → En cours) marque les étapes précédentes
  franchies : la frise dit où en est le ticket, pas son historique.
- **Disposition** : en colonne (fil vertical) sous 36 rem **de conteneur** (`@container`) ; en
  ligne au-delà (4 colonnes égales, fil horizontal, tampons centrés sous les pastilles). Tampons
  inclinés −4° / +3° en alternance. 360 px : sans débordement, « Fixed in v1.2.0 » compris.
- **Matière** : posée sur papier (`PaperSheet`, `Panel surface="paper"`) ou sur le bureau ; pas sur
  `.mat-card` sans `data-surface="paper"` (les jetons resteraient ceux du bureau).
- **Accessibilité** : `<ol>` nommée « Suivi du signalement » ; étape actuelle `aria-current="step"` ;
  chaque tampon `role="img"` nommé « Reçu, étape franchie », « Classé · Doublon, étape actuelle » ;
  étapes à venir en texte + « à venir » masqué. Jamais la couleur seule (tampon, pastille, tirets).
  Couleurs forcées : pastilles, fils et cadres `CanvasText`.
- **Contrastes** (mesurés, §17) : `--text-muted` sur `--surface-1` 9,96:1 (lampe), 7,30:1
  (papier), 7,81:1 (kraft) ; `--established` sur `--surface-1` 7,53:1 / 7,23:1 / 5,53:1 ; HC ≥ 10,76:1
  et ≥ 14,61:1. Aucun nouveau token.
- **API** : `status: 'received' | 'confirmed' | 'in-progress' | 'fixed' | 'closed'` (= `TicketStatus`
  du contrat) · `fixedIn` · `closedReason: 'resolved' | 'duplicate' | 'not-planned'` · `animate` ·
  `label` · `class`. Textes : `UiStrings.ticket` (`status`, `fixedIn(v)`, `closedReason`,
  `outcome`, `state`), réutilisables par l'hôte pour l'en-tête du ticket.

```svelte
<PaperSheet>
  <p><DymoLabel text={t.ticket} tone="red" /> <span class="ink-type">{categoryLabel} · {date}</span></p>
  <TicketStatus status={t.status} fixedIn={t.fixedIn} closedReason={t.closedReason} animate />
</PaperSheet>
```

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
- Les pastilles (« ? » `info`, nombre de non lus `accent`, « + » nouvelles pièces à rouvrir
  `accent`, coche `success`) et l'anneau de focus sont des **surimpressions HTML** (`Badge`,
  `FocusRing rect`) positionnées par la caméra : jamais dans le SVG. Chaque pastille est doublée
  d'un libellé dans le nom accessible du lieu (« nouvelles pièces à consulter »…).
- **Cartouche** (bas gauche) : rectangle `paper`, double filet `ink` 2–3 u + `ink-soft` 0,8, titre
  `label-major`, sous-titre `label-note`, mention « dressée et gravée par CM Creative Lab » en
  `label-note` (seule mention de la maison sur la carte). **Rose des vents** : cercles `ink-soft`/
  `ink-faint`, aiguille `ink` (moitié nord `fill="currentColor"`). **Échelle fantaisie** dans une
  unité du monde. **Cadre** : double filet comme le cartouche.
- Lieux de fiction dans la fiction (rumeurs, lieux disparus) : étiquette `font-style="italic"`.
- **Boutons de zoom** (bas droite) : en vue d'ensemble, la caméra cadre la carte hors de leur colonne
  ou de leur bande (celle qui réduit le moins la carte), mesurée sur les boutons eux-mêmes
  (`reserveCorner`) : aucun lieu ne démarre sous eux. Rien n'est réservé quand la carte part zoomée
  (téléphone en portrait) ou ne touche pas le coin.

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

### 10.9 Art autonome (site vitrine)

Hors des pages hydratées, le site sert l'art en **SVG autonomes** (`/art/<nom>.<hash>.svg`, cache
immuable) : `art.css` y est embarqué avec chaque `var()` résolue depuis `tokens.css` au build, et les
motifs de `ArtDefs` copiés. Les toponymes restent en `<text>` inline par-dessus, car un SVG chargé en
image ne peut pas utiliser les polices web.

### 10.10 Art de nuit (`.art.on-night`)

Un SVG d'art posé **directement sur le bureau sombre** (écran titre, vignettes) reste illisible
avec la palette papier : trait bleu-noir sur fond nuit. Ajouter `on-night` à la racine
(`<svg class="art on-night">`, ou `on-night` sur un ancêtre) remappe les `--art-*` : gravure
« à la lueur de la lampe ». Aucune nouvelle classe d'élément ; les SVG de contenu ne changent pas.
Constante : `ART_NIGHT_CLASS` (`'on-night'`), posée par l'application, jamais par le contenu.

| Token | Papier (défaut) | Nuit | HC nuit |
|---|---|---|---|
| `--art-ink` | encre `oklch(0.27 0.045 264)` | vélin `oklch(0.93 0.015 85)` | `oklch(1 0 0)` |
| `--art-ink-soft` | `oklch(0.44 0.045 262)` | `oklch(0.8 0.02 82)` | `oklch(0.92 0 0)` |
| `--art-ink-faint` | `oklch(0.58 0.035 262)` | `oklch(0.64 0.025 250)` | `oklch(0.75 0 0)` |
| `--art-paper` / `--art-paper-shade` | papier clair | feuille dans l'ombre `oklch(0.3 0.02 75)` / `oklch(0.26 0.02 70)` | `oklch(0.2 0 0)` / `oklch(0.17 0 0)` |
| `--art-wash-*` | pigments clairs L 0,79–0,86 | pigments sourds L 0,40–0,46, même teinte (safran 80, carmin 18, indigo 265, sienne 50, sauge 135, lilas 310, céladon 170, ardoise 250) | idem, opacité 0,45 / 0,65 |
| `--art-water` / `-deep` / `-ink` | | `oklch(0.42 0.05 215)` / `oklch(0.36 0.06 220)` / `oklch(0.82 0.06 220)` | eau `oklch(0.36 0.05 215)`, nom `oklch(0.92 0.04 220)` |
| `--art-ombre` | | `oklch(0.08 0.02 258)` | |
| `--art-wash-opacity` / `-active` | 0,6 / 0,9 | 0,7 / 0,95 | 0,45 / 0,65 |

Carnations, cheveux et photographies **ne changent pas** : portraits et photos restent sur papier.
Le halo des toponymes (`stroke: --art-paper`) devient sombre de lui-même. Contrastes (contextes
« carte nuit » de §17) : toponyme sur lavis pur ≥ 5,85 (HC ≥ 7,2), nom d'eau sur l'eau ≥ 4,83,
trait et légendes sur le bureau ≥ 4,5, trait fin ≥ 4,07 (non-texte).

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

Exports annexes : `ART_ROOT_CLASS` (`'art'`), `ART_NIGHT_CLASS` (`'on-night'`, §10.10), `ART_PATTERN_IDS`, `ART_PAINT_KEYWORDS`,
`isArtClass()`. Tokens d'art : `--art-*` (§10.3–10.7, valeurs dans tokens.css), dont
`--art-skin-opacity` 0,9, `--art-blush-opacity` 0,5, `--art-ombre-opacity` 0,22,
`--art-rehaut-opacity` 0,85, `--art-water-opacity` 0,75, `--art-hatch-width` 0,5,
`--art-hatch-dense-width` 0,6, `--art-label-weight` 500, `--art-mentioned-dash` `2 2.5`.

Couleurs forcées : papier → `Canvas`, trait et texte → `CanvasText`, lavis supprimés.

### 10.11 Ornements de l'interface (`Ornament`, `ORNAMENTS`)

Même encrage que les icônes (`ornament-geometry.ts` → `ornaments.ts`, `currentColor`, couleur
secondaire `--ornament-tone` pour la tête de punaise) :

| Nom | Boîte | Usage |
|---|---|---|
| `corner` | 64 × 64 | Coin de cadre (double filet, volute, fougère) ; `rotate`/`flip` pour les autres coins |
| `fern` | 160 × 48 | Fronde : pied de section, état vide |
| `divider` | 240 × 20 | Filet de séparation (losange, points) |
| `seal` | 72 × 72 | Cachet administratif rond |
| `clip` | 24 × 64 | Trombone (`PaperSheet fastener="clip"`) |
| `pin` | 32 × 32 | Punaise (`fastener="pin"`) |
| `flourish` | 240 × 36 | Volute sous le titre du jeu |

Couleur : `--brand` (vermillon) ou `--fern` sur le bureau, `--metal` pour l'acier ; jamais
`--accent` (réservé à l'action).

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

## 12. Page de démo `/design` et aperçu autonome

**`/design`** (`apps/site/src/routes/design/+page.svelte`, prérendue, `noindex`) suit l'ordre de
ce document. **À ajouter pour la v2 (frontend)** : palette v2 (bois, crépuscule, `--scrim-art`),
typographie Fraunces/Oswald et `Wordmark` (3 tailles, animé), matières (§6 : bureau, sous-main,
feuilles et bords, chemises, fiche, ruban, étiqueteuse), icônes encrées + `wash`/`clean`,
ornements, curseurs `data-cursors="ink"`, catalogue de mouvement rejouable (§8.3) et transitions
`motion.ts`, `Tabs variant="folder"`, `Folder`, `PaperSheet`, `IndexCard`, `Card variant="index"`,
`FlipCard`, `Celebrate`, `KeyArt` (16:9 et 4:5, `ArtDefs`), sélecteurs mouvement / contraste /
vision des couleurs.
v2.4 (fait) : section « Langue et signalements » : `LanguageSwitch` (radios, court, liens) qui
pose `setUiStrings` sur toute la page, `TicketStatus` (statut au choix, tampon rejouable, trois
variantes), maquette « Signaler un problème » avec aperçu des diagnostics.
v2.2 (fait) : section « Case revendiquée et chemises d'affaire » (fiche ordinaire, revendiquée
avec retrait / rétablissement animé, établie ; `ClaimTag` seul ; `CaseFolderGroup` de deux chemises,
mention et tampon de décision).

**Aperçu autonome** du design system (non versionné, `packages/ui/.gitignore`) :
`npx vite --config packages/ui/.preview/vite.config.mjs` → `http://localhost:5199/` (système),
`?page=title|desk|hero` (maquettes), paramètres `motion`, `contrast`, `color-vision`, `texture`.
Scripts : `.preview/scripts/shot.mjs` (captures), `record.mjs` (clips WebM), `overflow.mjs`
(défilement horizontal à 360 px), `bgcheck.mjs` (contraste du texte sur l'art clé).
Captures : `captures/ds2-system-*.png`, `ds2-mock-{title,desk,hero}-*.png`, `ds2-motion-*.webm`.

---

## 13. Recettes d'écrans du jeu

Chaque recette dit **quoi poser**, avec quelles primitives, et le mouvement. Les valeurs viennent
toutes des tokens.

### 13.0 Écran fixe (téléphone)

Le jeu ne se zoome pas et ne glisse pas latéralement comme une page web : `touch-action: pan-x
pan-y` et `overscroll-behavior: none` sur `html`, `overflow-x: clip` sur `html` et `body`
(`App.svelte`) ; le Bureau est en `position: fixed; inset: 0` (pas de `100dvh`, ignoré par
certaines WebView). Le viewport garde le zoom autorisé (`user-scalable=no` est refusé par axe,
WCAG 1.4.4) : c'est `touch-action` qui bloque le pincement de la page dans Chrome et la WebView.
Le pincement reste disponible là où il a un sens (arbre, carte), géré par le jeu ; la lisibilité
passe par la taille du texte des options (87,5 % à 200 %), pas par le zoom du navigateur.
Le site vitrine, lui, garde le zoom.

### 13.1 Écran titre

- **Fond** : `<KeyArt svg={keyartDesk} anchor="start" fade="none" />` plein cadre (16:9) ; sous
  760 px, `keyart-desk-tall` en haut (`fade="bottom"`, ratio 4:5, ≤ 68 dvh) et le menu dessous,
  remonté de 22 vw sur le fondu. `<ArtDefs />` rendu une fois.
- **Zone calme** (≥ 760 px) : colonne droite `minmax(22rem, 33.4%)` sur voile
  `linear-gradient(to left, var(--scrim-art) 62%, transparent)` (46 % de large).
- **Contenu** : `Wordmark size="hero" animate glow kicker="Dossier O.R.C. 74" tagline=…` ; menu
  `nav` : `Button primary l block` « Reprendre l'enquête » (`lamp`), `secondary l block` « Nouvelle
  affaire » (`folder`), `ghost` Options / Crédits ; « Dernier classement » en `DymoLabel` + date en
  Courier Prime ; crédits studio en Oswald en bas à gauche.
- **Mouvement** : `in:screenIn` ; art clé vivant ; titre encré mot à mot, volute balayée,
  menu `mv-rise` (rang 7–8) ; focus initial sur le premier bouton.
- Capture : `ds2-mock-title-1440.png`, `-390.png`, `-hc-1440.png`, `-reduced-1440.png`.

### 13.2 Bureau

- `.desk-surface` plein écran + `LampLight x={64} y={-6} dust={12}`.
- En-tête : `Wordmark size="header" as="p"`, `DymoLabel` rouge de l'affaire, `IconButton ghost`
  (recherche, journal avec pastille, pause).
- Zone principale : `Folder title cote enter` dont le snippet `tabs` porte
  `Tabs variant="folder"` (Arbre, Archives, Catalogue, Carte, Carnet ; icônes seules sous ~600 px).
- Volet : `PaperSheet` (Lecteur) + notes `IndexCard` scotchées (`Tape`).
- Un panneau à la fois (téléphone, tablette portrait) : la cote rouge n'est plus dans la chemise
  mais **sur la rangée de l'onglet**, à droite (comme au desktop) ; l'onglet du dossier se limite à
  60 % et s'abrège (ellipse, vrai titre hN complet), la cote à 40 % moins les marges. L'étiquette
  rouge du panneau (« Arbre ») ouvre donc directement la chemise.
- Mouvement : chorégraphie §8.7. Capture : `ds2-mock-desk-1440.png`, `-390.png`. Bureau v2.1 : `v2-1-jeu-bureau-{avant,apres}-{390,768}.png`.

### 13.3 Case d'arbre

`IndexCard title cote={génération en chiffres romains} deal={rang} tilt={±1}` :
- dates en Courier Prime sur la réglure ;
- métier **sous le portrait**, sur toute la largeur de la fiche (`lang="fr"`, `hyphens: auto`,
  coupure entre les mots seulement), 2 lignes au plus puis points de suspension (texte complet dans
  le nom accessible) ; un mot trop long pour une ligne réduit le corps (`--occ-chars`) ; le cadenas
  se place à droite du portrait ;
- case **établie** : `Stamp text="Établi" size="s"` en bas à droite, débordant de la fiche ;
- case **ouverte** : titre « ? », aide « Déposer une pièce » + `Icon unknown-person`, opacité 0,88 ;
- case **revendiquée** (affaire 2) : `.claim-frame` + `ClaimTag straddle decorative` + `.claim-value`
  sur chaque champ déclaré, sans cadenas ni tampon ; retrait en `unclaim` (§6.9) ;
- cible de dépôt : lavis `--accent-tint` + anneau ; objet saisi : `mv-held` ;
- générations reliées par le **fil rouge** (`--string`, 2 px : barre horizontale + attache) ;
- verrouillage : `stampIn` → `mv-thud` → `mv-lock` → `Celebrate` sur la branche.

### 13.4 Lecteur de document

`PaperSheet` (ou `Panel surface="paper"`) selon le type (§10.8), `edge` et `fastener` cohérents
(registre : perforé ; coupure : déchiré ; lettre : trombone ; photo : ruban) ; surtitre Oswald
`--paper-accent-strong` (fonds, cote) ; titre Fraunces `--step-2` ; corps `.reading` ou Courier
Prime ; mots-clés `.kw`, surlignages `.hl-*` ; actions `Button secondary` (Épingler) et `ghost`
(Surligner). Ouverture `sheetPull`, nouvel indice `use:rustle`.

Illustration d'en-tête (`illustration` du document) : `Figure` entre le titre et le texte (au recto
des pièces retournables, et dans la loupe), chargée à l'approche de l'écran, nommée par son `alt` ;
en mode Transcription ou en cas d'échec, l'`alt` s'affiche en texte. Pas de doublon si le corps
contient déjà la même figure.

Barre d'outils du Lecteur (v2.1) : **deux rangées**, dans l'ordre du DOM (= ordre de tabulation) —
1) affichage Original / Transcription, zoom, épingle et note (à droite) ; 2) surlignage (5 pastilles)
et Retourner (à droite, photos et cartes). Sous **40 rem** de large (mesure de la barre, donc volet
latéral étroit compris), tout passe en `IconButton` (icônes `reader`, `transcript`, `flip` ;
`aria-pressed`, nom accessible et info-bulle étiqueteuse conservés) et le facteur de zoom affiché
devient le bouton « Ajuster » (nom « ×1 · Ajuster », cible ≥ 44 px). À 390 px : deux lignes au lieu
de quatre. Captures : `v2-1-jeu-lecteur-*`, `v2-1-jeu-toast-*`.

**Taille du texte A− / A+** (v2.5) : groupe `role="group"` « Taille du texte » entre le zoom et
l'épingle, deux `IconButton` dont le glyphe est un « A » en police de lecture (`--step--1` pour A−,
`--step-1` pour A+, cible ≥ 44 px) et, hors mode compact, le pourcentage en Courier (`--step--1`).
Boutons désactivés au cran extrême ; chaque cran est annoncé dans le `role="status"` du Lecteur
(« Texte à 115 % »). Raccourcis remappables `Alt+=` / `Alt+-` (`aria-keyshortcuts`) — `Ctrl` est
pris par le zoom du navigateur. Réglage mémorisé (`Settings.readScale`), aussi dans Options ›
Affichage. Présent sur tous les formats (téléphone et tablette portrait : c'est le seul réglage de
confort de lecture, le Lecteur y est déjà plein écran).

**Plein écran** (v2.5) : `IconButton` `external` en tête du groupe de droite (avant l'épingle),
`aria-pressed` et libellé « Plein écran » / « Quitter le plein écran », touche `F` ; voir §5.3.

### 13.5 Catalogue (LX-2)

Champ `TextField variant="typewriter"` ; résultats = `Card variant="index"` distribuées en
cascade (≤ 12 animées) ; aucune réponse : vignette `spot-catalogue.svg` (`.art.on-night`) + texte.

### 13.6 Panneau de la carte

La carte est une **feuille** (`data-surface="paper"`) dans une chemise ; elle **s'encre** à
l'ouverture (`InkReveal` couche par couche, `--dur-draw`, rang × 2 × `--stagger`) ; lieux :
lavis qui prend au survol (`opacity`) ; épingles et fil rouge en surimpression.

### 13.7 Rapport final et fin

Rapport = **chemise manille** (`Folder tone="manila"`) contenant des `IndexCard` par conclusion ;
une question `choice` (décision) se pose en tampons de décision (§6.11) ;
validation : `Stamp` « Établi » ou « Contredit » en cascade (`--stagger`) ; écran de fin : art clé
`fade="edges"` + `Wordmark size="title"` + `Celebrate` une fois ; crédits avec logos (§11).

### 13.8 « Signaler un problème » (v2.4)

Accès : écran titre (lien discret sous les crédits), Pause, Aide, écran d'erreur. Un **formulaire
de l'Office** : `Dialog surface="paper" size="l"` (plein écran au téléphone, `mobile="fullscreen"`),
surtitre « Formulaire de signalement », titre « Signaler un problème ».

- **Champs** dans l'ordre : catégorie (`Select`, libellés humains : « Je suis bloqué », « Faute ou
  texte incorrect »…) ; description (`TextField multiline`, 4 lignes, `maxlength` 4000, compteur ;
  aide « Au moins 20 caractères. Ce que vous faisiez, ce que vous attendiez. ») ; contact facultatif
  (`TextField`, aide « Jamais publié. Seulement pour vous répondre. ») ; « Joindre ma sauvegarde
  anonymisée » (`Toggle showState`, décochée par défaut, description « Sans vos notes ni vos
  recherches »). Le pot de miel `website` est un champ hors écran (`visually-hidden`,
  `tabindex="-1"`, `autocomplete="off"`, `aria-hidden`).
- **Aperçu des diagnostics** : `<details>` « Voir exactement ce qui sera envoyé » sous les
  champs, fermé par défaut ; contenu `<pre class="ink-type">` du JSON **réel** (celui qui partira,
  recalculé quand la case change), `--step--1`, cadre en tirets `--line-strong`,
  `max-block-size: 16rem` avec défilement **vertical** et `white-space: pre-wrap` (jamais de
  défilement horizontal à 360 px) ; résumé ≥ `--hit`, focus 3 px. Une ligne au-dessus en clair :
  « Version 1.2.0 · démo · Android · English · Succession Varenque ».
- **Actions** : `Button primary` « Envoyer le signalement » (`envelope`, `loading` pendant
  l'envoi, 10 s au plus) ; `ghost` « Annuler ». Envoi désactivé tant que la description fait moins de
  20 caractères, avec la raison en aide (pas de bouton grisé muet).
- **Reçu** : la feuille est **tamponnée** « Reçu » (`Stamp animate`), numéro sur une étiqueteuse
  rouge (`DymoLabel` `AA-0042`), phrase « Gardez ce numéro : le suivi est aussi dans Mes
  signalements », `Button secondary` « Ouvrir le suivi sur le site » (`external`). Annonce polie.
- **Échec** (hors ligne, 503, 429) : `Toast tone="warning"` + dans la feuille un encart papier
  (`--surface-2`) « Le service ne répond pas. Rien n'est perdu : » avec « Copier le rapport »
  (`secondary`, `Toast success` « Rapport copié ») et « Forum itch.io » (`ghost`, `external`).
  429 : le délai (`Retry-After`) en clair. Jamais de perte du texte saisi.

### 13.9 « Mes signalements » (v2.4)

Panneau des Options (ou de l'Aide) : un **tiroir de fiches**. Chaque signalement =
`Card variant="index"` : cote `DymoLabel` rouge `AA-0042`, catégorie et date (`Intl`) en Courier
Prime, **dernier tampon** de la frise (`Stamp size="s"`, violet si corrigé), activation = ouvre la
feuille de suivi (`Dialog surface="paper"`, `TicketStatus animate`, réponses de l'équipe en
`PaperSheet` citées, texte brut en `--font-read`, date au-dessus). Actions de la feuille :
« Ouvrir sur le site » (`secondary`, `external`), « Supprimer mon signalement » (`danger`,
confirmation `Dialog` « Supprimer ce signalement ? Le ticket ne sera plus lisible. », focus initial
sur « Garder »). Vide : vignette `spot-archives.svg` (`.art.on-night`) + « Aucun signalement
envoyé depuis cet appareil. » Statut indisponible (hors ligne) : la frise garde le dernier statut
connu, mention « vu le 12 oct. » en `--text-muted`.

### 13.10 Typographie anglaise des écrans

Recettes inchangées en anglais (§4.4) ; vérifier à 360 et 390 px : menu de l'écran titre
(« Resume the investigation »), onglets du Bureau (le mode compact se déclenche plus tôt, c'est
voulu), barre du Lecteur, rapport final (« Endorsed »), chemises d'affaire (« Last decision: »).
Le `LanguageSwitch` de l'écran titre se place sous le menu ; les Options n'ont que le `Select` de langue (§9.35).

### 13.11 « Nouveautés » (notes de version)

Accès : écran titre, entrée `ghost` « Nouveautés » (`sparkle`) en fin de la grille des entrées
secondaires. Tant que les notes de la version installée n'ont pas été ouvertes par un joueur qui a
déjà joué, `Badge tone="accent" variant="solid" dot` « Nouveau » dans le bouton (son nom devient
« Nouveautés Nouveau ») et l'entrée prend toute la rangée.

`ScreenFrame` (bureau), surtitre étiqueteuse rouge « Version 1.3.1 » (version installée), accroche
Fraunces italique `--text-muted`. Une `PaperSheet` par version (`new` pour la plus récente, `paper`
ensuite, inclinaison ±0,3°, `mv-deal`) : `DymoLabel` rouge du numéro (« Version » en texte masqué),
date en Courier Prime `--step--1`, titre `h2` Fraunces `--step-2`, puis une liste : pastille de
nature (`Badge` : Nouveauté `accent` + `sparkle`, Amélioration `info` + `plus`, Correction
`success` + `check` ; toujours icône + texte) et texte en `--font-read`. Chaque version est un arrêt
de focus (`tabindex="0"`, nommée par son titre, anneau `--focus` 3 px) : clavier et manette font
défiler la liste. Sous 40 rem, la pastille passe au-dessus de sa ligne. Pas de nouveau token.

---

## 14. Recettes du site

### 14.1 Héros

En-tête transparent (`Wordmark header`, liens Oswald, `Button primary` « Jouer la démo ») posé
sur l'art clé (marge négative de `--space-16`). `KeyArt fade="edges" anchor="start"` en fond
absolu ; colonne de texte à droite `minmax(24rem, 36%)` sur `--scrim-art` (64 %) :
`Wordmark hero animate glow kicker=… tagline=…`, deux boutons (`primary` démo, `secondary`
artbook), plateformes en `DymoLabel`. Mobile : art 4:5 `fade="bottom"` puis texte remonté.

### 14.2 Cartes de fonctionnalités

Grille `auto-fit minmax(17rem, 1fr)`, `gap --space-10`. Chaque carte = `PaperSheet tone="paper"`
inclinée (−1,4° / 0,8° / −0,6°), fixée par ruban ou punaise, avec une vignette `spot-*.svg` (art
papier), surtitre Oswald, titre Fraunces `--step-2`, texte `--ink-muted`. `use:reveal` +
`--i` (cascade), `use:tilt={3}`. Séparateur au-dessus : `flourish-fern-vine.svg` dans un
`InkReveal from="left" blur`.

### 14.3 Galerie (artbook)

Colonnes CSS (masonry simple), chaque planche en `PaperSheet` (photo : `fastener="tape"`) ou
`Card variant="photo"` ; révélation `use:reveal` ; agrandissement en `Dialog size="l"`.

### 14.5 Façade de vidéo (bande-annonce)

Accueil, entre le principe et les gestes : cadre 16:9 (`--radius-m`, `--surface-3`,
`--shadow-lifted`), affiche locale (`<picture>` WebP 640/1280, JPEG de repli, `loading="lazy"`)
sous un voile `--scrim` vers le bas ; disque de lecture safran (`--accent`, `--shadow-press`,
triangle `--accent-contrast` découpé en CSS, aucune icône « lecture » au jeu d'icônes) qui grossit
de 6 % au survol et au focus (coupé en mouvement réduit) ; libellé Oswald capitales + durée en
Courier Prime. C'est un **lien** vers YouTube (repli sans JS) que `video-facade.js` (en ligne,
accueil seulement) change en bouton puis remplace au clic par le lecteur `youtube-nocookie.com`
focalisé : aucune requête ni cookie YouTube avant le clic. Mention sous le cadre en Courier Prime
`--text-muted`.

### 14.6 Pages de signalement et de suivi (v2.4)

- **`/signaler/`** (et `/en/…`) : même recette que §13.8 posée dans une `PaperSheet` centrée
  (≤ 48 rem), sans diagnostics de partie (plateforme `site`, langue, fenêtre) ; repli `<noscript>` :
  adresse du forum itch.io.
- **`/suivi/#<jeton>`** : la **fiche de suivi**. En-tête : `DymoLabel` rouge du numéro, catégorie
  et dates (`Intl`) en Courier Prime ; `TicketStatus animate` (la frise frappe une fois) ; réponses
  publiques en `PaperSheet` (texte brut, jamais de HTML) ; pied : « Supprimer mon signalement »
  (`danger`, confirmation). Jeton inconnu ou expiré : `Panel surface="paper"` « Ce suivi n'existe
  plus » + lien vers `/signaler/`. Le fragment est effacé de l'historique dès la lecture.
- **`/problemes-connus/`** : liste de `Card variant="index"` (titre, `TicketStatus` réduite à son
  dernier tampon, « Corrigé v1.2.0 » en tête de fiche), triée par mise à jour.
- **`/tickets/`** (tickets ouverts) : le **registre**. Une `PaperSheet` qui porte une `<ol>` de
  lignes séparées d'un filet en tirets `--line-strong` : numéro en Courier Prime gras, sujet en
  `h3` (titre relu s'il est public, sinon la catégorie, jamais le texte du joueur), ligne de
  métadonnées Courier `--text-muted` (catégorie, source, envoi, mise à jour, `Intl`), `Stamp ink
  size="s"` du statut (Reçu, Confirmé, En cours) incliné −4° / +3°, nommé « Statut : Reçu ». Au-dessus,
  le total en Oswald et une `<dl>` des comptes par statut. Feuille sous 34 rem **de conteneur** :
  numéro et tampon sur une ligne, sujet dessous. Pas de nouvelle primitive ni de nouveau token.
- **En-tête du site** : `LanguageSwitch hrefs short` à droite de la navigation (§9.35). Dernier
  lien de la navigation : **« Signaler »** (`Icon envelope` + libellé court, vers `/signaler/`). Entre
  64 et 80 rem, l'enveloppe seule (libellé gardé comme nom accessible, `title` en infobulle), liens
  en `--step--1` avec `--space-2` de marge et écarts resserrés, pour tenir à 1024 px ; dans le menu
  `<details>` étroit, libellé complet. Le menu s'ancre au bord droit des outils (dans l'écran à
  360 px).

### 14.7 Page « Nouveautés » (`/nouveautes/`, `/en/nouveautes/`)

Même lecture que §13.11, prérendue sans JS : `page-head` (surtitre « Journal des versions », `h1`,
accroche, « Version actuelle : 1.3.1 » en Courier Prime), puis une `<ol>` de `PaperSheet` (la plus
récente `new` avec trombone), mêmes pastilles et même grille (colonne de pastilles 9 rem, une seule
colonne sous 40 rem). Pied : « Problèmes connus » (`secondary`) et « Signaler un problème »
(`ghost`, `envelope`). Lien dans le pied de page du site, après Crédits.

### 14.4 Pied de page

Filet `--line`, crédits studio en Oswald capitales + `Icon fern`, mention en Courier Prime
(« Velmarche, 1974 — un monde imaginaire »), logos monochromes (§11).

Capture : `ds2-mock-hero-1440.png`, `-390.png`.

---

## 15. Migration v1 → v2 (renommages, compatibilité)

Toutes les exportations v1 continuent de fonctionner. Changements à connaître :

| Quoi | v1 | v2 |
|---|---|---|
| Palette | nuit teinte 258, chroma 0,02–0,03 ; laiton `0.81 0.125 78` | encre de nuit teinte 260, chroma ≈ 0,055 ; safran `0.84 0.155 80` ; + vermillon, céladon, kraft, bois, crépuscule |
| Titrage | Literata 600 | **Fraunces** (`--font-display`) ; nouveau `--font-label` (Oswald) |
| Rayons | 4 / 6 / 10 / 16 / 24 | 3 / 5 / 7 / 10 / 16 + `--radius-tab` |
| `ICONS` | tracés propres | tracés **encrés** (mêmes noms, même ordre des tracés) ; tracés propres dans `ICON_GEOMETRY` ; second passage `ICON_RETRACE` |
| `Stamp` | élément unique | `.stamp-wrap` (porte `role="img"`) > tampon + `.spread` : un sélecteur CSS externe visant `.stamp` doit viser `.stamp-wrap` pour le placement |
| Classes de mouvement | — | préfixe **`mv-`** (images-clés `m-`) ; `.desk-surface` (et non `.desk`, réservé à `Panel`) |
| `Tabs` | `line\|bar\|rail` | + `folder` ; mesure compacte aussi pour `folder` |
| `Card` | `fiche\|document\|photo` | + `index`, prop `deal` |
| `Panel` | `surface: desk\|paper` | + `kraft`, prop `enter` |
| `--scrim` en HC | voile | presque opaque ; + `--scrim-art` |
| Nouveaux exports | | `Folder PaperSheet IndexCard Tape DymoLabel Ornament LampLight Celebrate InkReveal FlipCard Wordmark KeyArt ORNAMENTS ORNAMENT_NAMES ORNAMENT_GEOMETRY OrnamentName ICON_GEOMETRY ICON_RETRACE` + `motion.ts` (`deal paperIn sheetPull screenIn screenOut stampIn inkIn reveal tilt rustle prefersReducedMotion tokenMs EASE`), aussi via `@arbre/ui/motion` |
| Script | | `npm run icons:ink -w @arbre/ui` |

---

## 16. Checklist de conformité (utilisée par `qa-reviewer`)

Tokens et styles
- [x] Aucune couleur, police, durée, ombre ou rayon en dur dans les primitives (exceptions : images de curseur, masques alpha)
- [x] Composants ne lisant que la sémantique et les matières (jamais `--raw-*`)
- [x] Aucune variable CSS utilisée sans définition (vérifié par script lors de la v2)
- [x] Contextes papier et kraft : tout composant posé dedans reste conforme
- [x] `contrast:check --strict` (720 paires : matières, kraft, art clé compris) dans `npm run check`
- [ ] SVG d'art : seulement `ART_CLASSES`, `none`, `currentColor`, `url(#…)` (`content:check`)

Accessibilité
- [x] Contrastes calculés (§3.8, §17) ; texte sur l'art clé mesuré sur rendu (`bgcheck.mjs`)
- [x] Focus visible 3 px sur tout contrôle, y compris onglets de chemise
- [x] Cibles ≥ 44 px ; info-bulles jamais indispensables
- [x] Aucune information par la couleur seule (tampon + texte, cadenas, motifs)
- [x] Réglages joueur (§4.2) tous effectifs, y compris sur `--font-label`, la réglure des fiches et le grain du kraft
- [x] Décor (`LampLight`, `KeyArt`, `Tape`, `Ornament`, confettis) `aria-hidden`, absent en couleurs forcées
- [ ] `/design` v2 (§12, frontend)

Mouvement et performance
- [x] Seuls `transform`, `opacity`, `filter` animés ; pas de `stroke-dashoffset`
- [x] Entrées en `backwards` ; aucune animation bloquante
- [x] Mouvement réduit (système ou réglage) : fondus ≤ 150 ms, boucles figées, art clé figé, transitions Svelte en fondu
- [x] Boucles décoratives seulement, période ≥ 5 s, `--idle-state`
- [x] Polices WOFF2 OFL auto-hébergées ; ≤ 2 préchargements (Instrument Sans + Fraunces romain, 150 Ko)
- [x] 360 px sans défilement horizontal (aperçu : système, titre, bureau, héros)
- [x] Aucune bibliothèque d'animation (§8.10)

Illustration
- [ ] Traits ≥ 0,5 u, toponymes `label*`, lavis ≤ 2 couches, portraits ≤ 25 Ko (cartographe)

---

## 17. Annexe : contrastes calculés

Généré par `node packages/ui/scripts/contrast.mjs --md` (à régénérer à chaque changement de
couleur). Fonds composés : « A sur B » = A translucide posé sur B. Seuils : 4,5 texte ; 3
non-texte / grand texte ; 7 en contraste élevé. Contextes « vision des couleurs » : seules les
paires impliquant un ton d'état, chacune en vision normale puis « (vision simulée) ».

#### Vision des couleurs : tons d’état distinguables (ΔE OKLab, vision simulée)

| Contexte | Écart minimal (paire) | Palette par défaut | Seuil |
|---|---|---|---|
| lampe protanopia | **0,105** ✓ (`--success` / `--info`) | 0,088 (`--danger` / `--warning`) | 0,06 et > défaut |
| papier protanopia | **0,105** ✓ (`--success` / `--info`) | 0,061 (`--danger` / `--warning`) | 0,06 et > défaut |
| lampe HC protanopia | **0,100** ✓ (`--success` / `--info`) | 0,058 (`--info` / `--established`) | 0,06 et > défaut |
| papier HC protanopia | **0,113** ✓ (`--info` / `--established`) | 0,042 (`--warning` / `--success`) | 0,06 et > défaut |
| lampe deuteranopia | **0,103** ✓ (`--success` / `--established`) | 0,054 (`--danger` / `--success`) | 0,06 et > défaut |
| papier deuteranopia | **0,099** ✓ (`--success` / `--info`) | 0,025 (`--danger` / `--warning`) | 0,06 et > défaut |
| lampe HC deuteranopia | **0,089** ✓ (`--info` / `--established`) | 0,021 (`--info` / `--established`) | 0,06 et > défaut |
| papier HC deuteranopia | **0,113** ✓ (`--info` / `--established`) | 0,022 (`--danger` / `--warning`) | 0,06 et > défaut |
| lampe tritanopia | **0,110** ✓ (`--success` / `--info`) | 0,022 (`--success` / `--info`) | 0,06 et > défaut |
| papier tritanopia | **0,127** ✓ (`--success` / `--info`) | 0,032 (`--success` / `--info`) | 0,06 et > défaut |
| lampe HC tritanopia | **0,101** ✓ (`--danger` / `--established`) | 0,036 (`--success` / `--info`) | 0,06 et > défaut |
| papier HC tritanopia | **0,113** ✓ (`--warning` / `--established`) | 0,021 (`--success` / `--info`) | 0,06 et > défaut |

#### Contexte lampe

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--text` | `--canvas` | **16,17** ✓ | 4,5 | texte |
| `--text` | `--surface-1` | **14,49** ✓ | 4,5 | texte |
| `--text` | `--surface-2` | **12,81** ✓ | 4,5 | texte |
| `--text` | `--surface-3` | **11,73** ✓ | 4,5 | texte |
| `--text-muted` | `--canvas` | **11,11** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-1` | **9,96** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-2` | **8,81** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-3` | **8,07** ✓ | 4,5 | texte secondaire |
| `--text-faint` | `--surface-1` | **6,59** ✓ | 3 | grand texte, désactivé |
| `--line-strong` | `--canvas` | **5,86** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-1` | **5,25** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-2` | **4,64** ✓ | 3 | bordure de contrôle |
| `--accent` | `--canvas` | **10,95** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--surface-1` | **9,81** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--surface-2` | **8,68** ✓ | 4,5 | lien, texte d’action |
| `--accent-contrast` | `--accent` | **11,88** ✓ | 4,5 | texte du bouton principal |
| `--accent-contrast` | `--accent-strong` | **15,09** ✓ | 4,5 | bouton principal survolé |
| `--text` | `--accent-tint sur --surface-1` | **10,61** ✓ | 4,5 | texte sur lavis d’accent |
| `--focus` | `--canvas` | **13,91** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-1` | **12,47** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-2` | **11,02** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-3` | **10,10** ✓ | 3 | anneau de focus |
| `--danger` | `--surface-1` | **6,90** ✓ | 4,5 | erreur |
| `--success` | `--surface-1` | **9,15** ✓ | 4,5 | succès |
| `--warning` | `--surface-1` | **8,42** ✓ | 4,5 | avertissement |
| `--info` | `--surface-1` | **8,86** ✓ | 4,5 | information |
| `--established` | `--surface-1` | **7,53** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **8,40** ✓ | 4,5 | tampon « Établi » |
| `--keyword` | `--surface-1` | **9,81** ✓ | 4,5 | mot-clé souligné |
| `--established-contrast` | `--established` | **9,12** ✓ | 4,5 | texte sur tampon plein |
| `--canvas` | `--success` | **10,21** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **7,70** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **9,39** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **9,89** ✓ | 4,5 | pastille pleine |
| `--success` | `--surface-3` | **7,41** ✓ | 4,5 | pastille douce succès |
| `--warning` | `--surface-3` | **6,82** ✓ | 4,5 | pastille douce avertissement |
| `--danger` | `--surface-3` | **5,59** ✓ | 4,5 | pastille douce erreur |
| `--info` | `--surface-3` | **7,18** ✓ | 4,5 | pastille douce information |
| `--established` | `--surface-3` | **6,10** ✓ | 4,5 | pastille douce établi |
| `--accent` | `--surface-3` | **7,95** ✓ | 4,5 | pastille douce accent |
| `--canvas` | `--text` | **16,17** ✓ | 4,5 | info-bulle (inversée) |
| `--text` | `--selection sur --surface-1` | **8,16** ✓ | 4,5 | sélection de texte |
| `--claim-ink-desk` | `--canvas` | **10,68** ✓ | 4,5 | valeur déclarée sur le bureau |
| `--claim-ink-desk` | `--surface-1` | **9,57** ✓ | 4,5 | valeur déclarée (fiche de case, sélecteur) |
| `--claim-ink-desk` | `--surface-2` | **8,46** ✓ | 4,5 | valeur déclarée (survol) |
| `--claim-ink-desk` | `--surface-3` | **7,75** ✓ | 4,5 | valeur déclarée (ligne active) |

#### Contexte papier

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--text` | `--canvas` | **13,26** ✓ | 4,5 | texte |
| `--text` | `--surface-1` | **14,19** ✓ | 4,5 | texte |
| `--text` | `--surface-2` | **12,11** ✓ | 4,5 | texte |
| `--text` | `--surface-3` | **10,86** ✓ | 4,5 | texte |
| `--text-muted` | `--canvas` | **6,82** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-1` | **7,30** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-2` | **6,23** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-3` | **5,59** ✓ | 4,5 | texte secondaire |
| `--text-faint` | `--surface-1` | **4,02** ✓ | 3 | grand texte, désactivé |
| `--line-strong` | `--canvas` | **3,76** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-1` | **4,02** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-2` | **3,43** ✓ | 3 | bordure de contrôle |
| `--accent` | `--canvas` | **5,81** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--surface-1` | **6,21** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--surface-2` | **5,30** ✓ | 4,5 | lien, texte d’action |
| `--accent-contrast` | `--accent` | **6,21** ✓ | 4,5 | texte du bouton principal |
| `--accent-contrast` | `--accent-strong` | **7,55** ✓ | 4,5 | bouton principal survolé |
| `--text` | `--accent-tint sur --surface-1` | **11,92** ✓ | 4,5 | texte sur lavis d’accent |
| `--focus` | `--canvas` | **5,81** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-1` | **6,21** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-2` | **5,30** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-3` | **4,75** ✓ | 3 | anneau de focus |
| `--danger` | `--surface-1` | **6,67** ✓ | 4,5 | erreur |
| `--success` | `--surface-1` | **6,40** ✓ | 4,5 | succès |
| `--warning` | `--surface-1` | **6,16** ✓ | 4,5 | avertissement |
| `--info` | `--surface-1` | **6,32** ✓ | 4,5 | information |
| `--established` | `--surface-1` | **7,23** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **6,75** ✓ | 4,5 | tampon « Établi » |
| `--keyword` | `--surface-1` | **6,21** ✓ | 4,5 | mot-clé souligné |
| `--established-contrast` | `--established` | **7,23** ✓ | 4,5 | texte sur tampon plein |
| `--canvas` | `--success` | **5,98** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **6,24** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **5,76** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **5,91** ✓ | 4,5 | pastille pleine |
| `--success` | `--surface-3` | **4,90** ✓ | 4,5 | pastille douce succès |
| `--warning` | `--surface-3` | **4,72** ✓ | 4,5 | pastille douce avertissement |
| `--danger` | `--surface-3` | **5,11** ✓ | 4,5 | pastille douce erreur |
| `--info` | `--surface-3` | **4,84** ✓ | 4,5 | pastille douce information |
| `--established` | `--surface-3` | **5,53** ✓ | 4,5 | pastille douce établi |
| `--accent` | `--surface-3` | **4,75** ✓ | 4,5 | pastille douce accent |
| `--canvas` | `--text` | **13,26** ✓ | 4,5 | info-bulle (inversée) |
| `--text` | `--selection sur --surface-1` | **11,43** ✓ | 4,5 | sélection de texte |
| `--text` | `--hl-1 sur --surface-1` | **12,33** ✓ | 4,5 | surlignage 1 |
| `--text` | `--hl-2 sur --surface-1` | **12,04** ✓ | 4,5 | surlignage 2 |
| `--text` | `--hl-3 sur --surface-1` | **11,30** ✓ | 4,5 | surlignage 3 |
| `--text` | `--hl-4 sur --surface-1` | **11,24** ✓ | 4,5 | surlignage 4 |
| `--text` | `--hl-5 sur --surface-1` | **11,30** ✓ | 4,5 | surlignage 5 |
| `--ink-hand` | `--surface-1` | **9,50** ✓ | 4,5 | écriture manuscrite |
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
| `--success` | `--surface-3` | **12,97** ✓ | 4,5 | pastille douce succès |
| `--warning` | `--surface-3` | **11,76** ✓ | 4,5 | pastille douce avertissement |
| `--danger` | `--surface-3` | **10,14** ✓ | 4,5 | pastille douce erreur |
| `--info` | `--surface-3` | **12,14** ✓ | 4,5 | pastille douce information |
| `--established` | `--surface-3` | **10,95** ✓ | 4,5 | pastille douce établi |
| `--accent` | `--surface-3` | **13,13** ✓ | 4,5 | pastille douce accent |
| `--canvas` | `--text` | **20,59** ✓ | 4,5 | info-bulle (inversée) |
| `--text` | `--selection sur --surface-1` | **9,58** ✓ | 4,5 | sélection de texte |
| `--claim-ink-desk` | `--canvas` | **16,96** ✓ | 7 | valeur déclarée sur le bureau |
| `--claim-ink-desk` | `--surface-1` | **16,57** ✓ | 7 | valeur déclarée (fiche de case, sélecteur) |
| `--claim-ink-desk` | `--surface-2` | **15,75** ✓ | 7 | valeur déclarée (survol) |
| `--claim-ink-desk` | `--surface-3` | **14,59** ✓ | 7 | valeur déclarée (ligne active) |

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
| `--success` | `--surface-3` | **8,04** ✓ | 4,5 | pastille douce succès |
| `--warning` | `--surface-3` | **7,40** ✓ | 4,5 | pastille douce avertissement |
| `--danger` | `--surface-3` | **8,34** ✓ | 4,5 | pastille douce erreur |
| `--info` | `--surface-3` | **8,31** ✓ | 4,5 | pastille douce information |
| `--established` | `--surface-3` | **9,02** ✓ | 4,5 | pastille douce établi |
| `--accent` | `--surface-3` | **8,60** ✓ | 4,5 | pastille douce accent |
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
| `--art-ink-soft` | `--art-paper` | **6,82** ✓ | 4,5 | légende secondaire |
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

#### Contexte carte nuit

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--art-ink` | `--art-paper` | **11,12** ✓ | 4,5 | toponyme sur papier |
| `--art-ink-soft` | `--art-paper` | **7,31** ✓ | 4,5 | légende secondaire |
| `--art-water-ink` | `--art-paper` | **7,96** ✓ | 4,5 | nom de cours d’eau |
| `--art-water-ink` | `--art-water` | **4,83** ✓ | 4,5 | nom de cours d’eau sur l’eau |
| `--art-ink` | `--art-water-deep` | **8,67** ✓ | 4,5 | toponyme sur eau profonde |
| `--art-ink` | `--art-wash-safran` | **5,85** ✓ | 4,5 | toponyme sur lavis safran pur |
| `--art-ink` | `--art-wash-carmin` | **7,21** ✓ | 4,5 | toponyme sur lavis carmin pur |
| `--art-ink` | `--art-wash-indigo` | **6,93** ✓ | 4,5 | toponyme sur lavis indigo pur |
| `--art-ink` | `--art-wash-sienne` | **6,51** ✓ | 4,5 | toponyme sur lavis sienne pur |
| `--art-ink` | `--art-wash-sauge` | **6,17** ✓ | 4,5 | toponyme sur lavis sauge pur |
| `--art-ink` | `--art-wash-lilas` | **7,10** ✓ | 4,5 | toponyme sur lavis lilas pur |
| `--art-ink` | `--art-wash-celadon` | **6,15** ✓ | 4,5 | toponyme sur lavis celadon pur |
| `--art-ink` | `--art-wash-ardoise` | **7,48** ✓ | 4,5 | toponyme sur lavis ardoise pur |
| `--art-ink-faint` | `--art-paper` | **4,07** ✓ | 3 | trait mine de plomb (non-texte) |
| `--art-ink` | `--canvas` | **14,77** ✓ | 4,5 | trait, toponyme sur le bureau |
| `--art-ink-soft` | `--canvas` | **9,71** ✓ | 4,5 | légende sur le bureau |
| `--art-ink-faint` | `--canvas` | **5,41** ✓ | 3 | trait fin sur le bureau (non-texte) |

#### Contexte carte nuit HC

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--art-ink` | `--art-paper` | **18,10** ✓ | 7 | toponyme sur papier |
| `--art-ink-soft` | `--art-paper` | **14,29** ✓ | 7 | légende secondaire |
| `--art-water-ink` | `--art-paper` | **14,44** ✓ | 7 | nom de cours d’eau |
| `--art-water-ink` | `--art-water` | **8,51** ✓ | 7 | nom de cours d’eau sur l’eau |
| `--art-ink` | `--art-water-deep` | **10,66** ✓ | 7 | toponyme sur eau profonde |
| `--art-ink` | `--art-wash-safran` | **7,20** ✓ | 7 | toponyme sur lavis safran pur |
| `--art-ink` | `--art-wash-carmin` | **8,87** ✓ | 7 | toponyme sur lavis carmin pur |
| `--art-ink` | `--art-wash-indigo` | **8,52** ✓ | 7 | toponyme sur lavis indigo pur |
| `--art-ink` | `--art-wash-sienne` | **8,00** ✓ | 7 | toponyme sur lavis sienne pur |
| `--art-ink` | `--art-wash-sauge` | **7,59** ✓ | 7 | toponyme sur lavis sauge pur |
| `--art-ink` | `--art-wash-lilas` | **8,73** ✓ | 7 | toponyme sur lavis lilas pur |
| `--art-ink` | `--art-wash-celadon` | **7,56** ✓ | 7 | toponyme sur lavis celadon pur |
| `--art-ink` | `--art-wash-ardoise` | **9,19** ✓ | 7 | toponyme sur lavis ardoise pur |
| `--art-ink-faint` | `--art-paper` | **8,14** ✓ | 3 | trait mine de plomb (non-texte) |
| `--art-ink` | `--canvas` | **20,59** ✓ | 7 | trait, toponyme sur le bureau |
| `--art-ink-soft` | `--canvas` | **16,25** ✓ | 7 | légende sur le bureau |
| `--art-ink-faint` | `--canvas` | **9,25** ✓ | 3 | trait fin sur le bureau (non-texte) |

#### Contexte matières

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--kraft-ink` | `--kraft` | **6,96** ✓ | 4,5 | texte sur kraft (chemise) |
| `--kraft-ink` | `--kraft-shade` | **5,15** ✓ | 4,5 | texte sur kraft ombré (dos de chemise) |
| `--kraft-ink` | `--manila` | **10,87** ✓ | 4,5 | texte sur manille (étiquette, onglet clair) |
| `--kraft-edge` | `--kraft` | **3,22** ✓ | 3 | tranche du carton (contour, non-texte) |
| `--ink` | `--card` | **14,19** ✓ | 4,5 | texte sur fiche bristol |
| `--card-margin` | `--card` | **3,75** ✓ | 3 | ligne de tête rouge (non-texte) |
| `--claim-ink` | `--claim-paper` | **7,09** ✓ | 4,5 | cartouche « Déclaré » : texte et agrafe |
| `--claim-ink` | `--card` | **7,74** ✓ | 4,5 | valeur déclarée sur fiche bristol |
| `--claim-ink` | `--paper` | **7,23** ✓ | 4,5 | valeur déclarée (liste hiérarchique, papier) |
| `--claim-ink` | `--paper-aged` | **6,61** ✓ | 4,5 | valeur déclarée sur papier vieilli (survol) |
| `--claim-edge` | `--card` | **7,74** ✓ | 3 | bord en tirets de la case revendiquée (non-texte) |
| `--claim-edge` | `--claim-paper` | **7,09** ✓ | 3 | filet du cartouche (non-texte) |
| `--claim-paper` | `--canvas` | **15,62** ✓ | 3 | cartouche à cheval sur le bord, côté bureau (non-texte) |
| `--ink` | `--tape sur --paper` | **12,53** ✓ | 4,5 | texte sous ruban adhésif |
| `--label-tape-text` | `--label-tape` | **10,09** ✓ | 4,5 | étiqueteuse : lettres en relief (bleu) |
| `--label-tape-text` | `--label-tape-red` | **5,33** ✓ | 4,5 | étiqueteuse : lettres en relief (rouge) |
| `--brand-contrast` | `--brand-fill` | **5,45** ✓ | 4,5 | texte sur aplat vermillon |
| `--brand` | `--canvas` | **6,84** ✓ | 3 | vermillon : grand titre, filet (≥ 3) |
| `--brand` | `--surface-1` | **6,13** ✓ | 3 | vermillon : ornement sur panneau (≥ 3) |
| `--fern` | `--canvas` | **9,76** ✓ | 3 | fougère : ornement (≥ 3) |
| `--accent-contrast` | `--accent-edge` | **6,17** ✓ | 3 | tranche du bouton principal (non-texte) |
| `--text` | `--lamp-pool sur --canvas` | **9,83** ✓ | 4,5 | texte dans le cône de la lampe |
| `--text-muted` | `--scrim-art sur --paper-new` | **9,92** ✓ | 4,5 | texte sur l’art clé (voile, pire cas) |
| `--brand` | `--scrim-art sur --paper-new` | **6,11** ✓ | 4,5 | « aux » du titre sur l’art clé (pire cas) |

#### Contexte matières HC

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--kraft-ink` | `--kraft` | **18,45** ✓ | 7 | texte sur kraft (chemise) |
| `--kraft-ink` | `--kraft-shade` | **14,93** ✓ | 7 | texte sur kraft ombré (dos de chemise) |
| `--kraft-ink` | `--manila` | **20,12** ✓ | 7 | texte sur manille (étiquette, onglet clair) |
| `--kraft-edge` | `--kraft` | **18,45** ✓ | 3 | tranche du carton (contour, non-texte) |
| `--ink` | `--card` | **20,12** ✓ | 7 | texte sur fiche bristol |
| `--card-margin` | `--card` | **8,07** ✓ | 3 | ligne de tête rouge (non-texte) |
| `--claim-ink` | `--claim-paper` | **15,85** ✓ | 7 | cartouche « Déclaré » : texte et agrafe |
| `--claim-ink` | `--card` | **15,85** ✓ | 7 | valeur déclarée sur fiche bristol |
| `--claim-ink` | `--paper` | **15,85** ✓ | 7 | valeur déclarée (liste hiérarchique, papier) |
| `--claim-ink` | `--paper-aged` | **14,53** ✓ | 7 | valeur déclarée sur papier vieilli (survol) |
| `--claim-edge` | `--card` | **15,85** ✓ | 3 | bord en tirets de la case revendiquée (non-texte) |
| `--claim-edge` | `--claim-paper` | **15,85** ✓ | 3 | filet du cartouche (non-texte) |
| `--claim-paper` | `--canvas` | **20,59** ✓ | 3 | cartouche à cheval sur le bord, côté bureau (non-texte) |
| `--ink` | `--tape sur --paper` | **15,41** ✓ | 7 | texte sous ruban adhésif |
| `--label-tape-text` | `--label-tape` | **20,59** ✓ | 7 | étiqueteuse : lettres en relief (bleu) |
| `--label-tape-text` | `--label-tape-red` | **20,59** ✓ | 7 | étiqueteuse : lettres en relief (rouge) |
| `--brand-contrast` | `--brand-fill` | **11,61** ✓ | 7 | texte sur aplat vermillon |
| `--brand` | `--canvas` | **13,15** ✓ | 3 | vermillon : grand titre, filet (≥ 3) |
| `--brand` | `--surface-1` | **12,85** ✓ | 3 | vermillon : ornement sur panneau (≥ 3) |
| `--fern` | `--canvas` | **15,76** ✓ | 3 | fougère : ornement (≥ 3) |
| `--accent-contrast` | `--accent-edge` | **20,59** ✓ | 3 | tranche du bouton principal (non-texte) |
| `--text` | `--lamp-pool sur --canvas` | **20,59** ✓ | 7 | texte dans le cône de la lampe |
| `--text-muted` | `--scrim-art sur --paper-new` | **15,56** ✓ | 7 | texte sur l’art clé (voile, pire cas) |
| `--brand` | `--scrim-art sur --paper-new` | **12,21** ✓ | 7 | « aux » du titre sur l’art clé (pire cas) |

#### Contexte kraft

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--text` | `--canvas` | **6,96** ✓ | 4,5 | texte |
| `--text` | `--surface-1` | **10,87** ✓ | 4,5 | texte |
| `--text` | `--surface-2` | **12,11** ✓ | 4,5 | texte |
| `--text-muted` | `--canvas` | **5,00** ✓ | 4,5 | texte secondaire |
| `--text-muted` | `--surface-1` | **7,81** ✓ | 4,5 | texte secondaire |
| `--text-faint` | `--surface-1` | **6,08** ✓ | 3 | grand texte, désactivé |
| `--line-strong` | `--canvas` | **3,22** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-1` | **5,02** ✓ | 3 | bordure de contrôle |
| `--accent` | `--surface-1` | **5,78** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--canvas` | **3,70** ✓ | 3 | accent (grand texte, icône) |
| `--accent-contrast` | `--accent` | **7,55** ✓ | 4,5 | texte du bouton principal |
| `--focus` | `--canvas` | **6,96** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-1` | **10,87** ✓ | 3 | anneau de focus |
| `--keyword` | `--surface-1` | **5,78** ✓ | 4,5 | mot-clé souligné |
| `--danger` | `--surface-1` | **5,11** ✓ | 4,5 | erreur (étiquette) |
| `--success` | `--surface-1` | **4,90** ✓ | 4,5 | succès (étiquette) |
| `--warning` | `--surface-1` | **4,72** ✓ | 4,5 | avertissement (étiquette) |
| `--info` | `--surface-1` | **4,84** ✓ | 4,5 | information (étiquette) |
| `--established` | `--surface-1` | **5,53** ✓ | 4,5 | tampon « Établi » (étiquette) |
| `--established` | `--canvas` | **3,54** ✓ | 3 | tampon « Établi » sur le carton (grand, ≥ 3) |
| `--brand` | `--canvas` | **3,58** ✓ | 3 | vermillon sur kraft (≥ 3) |
| `--brand` | `--surface-1` | **5,59** ✓ | 4,5 | vermillon sur manille (texte) |

#### Contexte kraft HC

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--text` | `--canvas` | **18,45** ✓ | 7 | texte |
| `--text` | `--surface-1` | **20,12** ✓ | 7 | texte |
| `--text` | `--surface-2` | **18,45** ✓ | 7 | texte |
| `--text-muted` | `--canvas` | **13,40** ✓ | 7 | texte secondaire |
| `--text-muted` | `--surface-1` | **14,61** ✓ | 7 | texte secondaire |
| `--text-faint` | `--surface-1` | **8,47** ✓ | 3 | grand texte, désactivé |
| `--line-strong` | `--canvas` | **18,45** ✓ | 3 | bordure de contrôle |
| `--line-strong` | `--surface-1` | **20,12** ✓ | 3 | bordure de contrôle |
| `--accent` | `--surface-1` | **10,25** ✓ | 4,5 | lien, texte d’action |
| `--accent` | `--canvas` | **9,40** ✓ | 3 | accent (grand texte, icône) |
| `--accent-contrast` | `--accent` | **10,25** ✓ | 4,5 | texte du bouton principal |
| `--focus` | `--canvas` | **18,45** ✓ | 3 | anneau de focus |
| `--focus` | `--surface-1` | **20,12** ✓ | 3 | anneau de focus |
| `--keyword` | `--surface-1` | **10,25** ✓ | 4,5 | mot-clé souligné |
| `--danger` | `--surface-1` | **9,94** ✓ | 4,5 | erreur (étiquette) |
| `--success` | `--surface-1` | **9,59** ✓ | 4,5 | succès (étiquette) |
| `--warning` | `--surface-1` | **8,83** ✓ | 4,5 | avertissement (étiquette) |
| `--info` | `--surface-1` | **9,91** ✓ | 4,5 | information (étiquette) |
| `--established` | `--surface-1` | **10,76** ✓ | 4,5 | tampon « Établi » (étiquette) |
| `--established` | `--canvas` | **9,86** ✓ | 3 | tampon « Établi » sur le carton (grand, ≥ 3) |
| `--brand` | `--canvas` | **8,41** ✓ | 3 | vermillon sur kraft (≥ 3) |
| `--brand` | `--surface-1` | **9,18** ✓ | 4,5 | vermillon sur manille (texte) |

#### Contexte lampe protanopia

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--danger` | `--surface-1` | **7,38** ✓ | 4,5 | erreur |
| `--danger` | `--surface-1` | **6,13** ✓ | 4,5 | erreur (vision simulée) |
| `--success` | `--surface-1` | **9,41** ✓ | 4,5 | succès |
| `--success` | `--surface-1` | **9,76** ✓ | 4,5 | succès (vision simulée) |
| `--warning` | `--surface-1` | **11,74** ✓ | 4,5 | avertissement |
| `--warning` | `--surface-1` | **10,78** ✓ | 4,5 | avertissement (vision simulée) |
| `--info` | `--surface-1` | **12,63** ✓ | 4,5 | information |
| `--info` | `--surface-1` | **12,68** ✓ | 4,5 | information (vision simulée) |
| `--established` | `--surface-1` | **6,23** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--surface-1` | **5,98** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established` | `--canvas` | **6,95** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **6,74** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established-contrast` | `--established` | **7,54** ✓ | 4,5 | texte sur tampon plein |
| `--established-contrast` | `--established` | **7,39** ✓ | 4,5 | texte sur tampon plein (vision simulée) |
| `--canvas` | `--success` | **10,49** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--success` | **10,99** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--danger` | **8,23** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **6,90** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--warning` | **13,09** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **12,13** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--info` | **14,09** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **14,28** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--success` | `--surface-3` | **7,62** ✓ | 4,5 | pastille douce succès |
| `--success` | `--surface-3` | **7,83** ✓ | 4,5 | pastille douce succès (vision simulée) |
| `--warning` | `--surface-3` | **9,50** ✓ | 4,5 | pastille douce avertissement |
| `--warning` | `--surface-3` | **8,64** ✓ | 4,5 | pastille douce avertissement (vision simulée) |
| `--danger` | `--surface-3` | **5,98** ✓ | 4,5 | pastille douce erreur |
| `--danger` | `--surface-3` | **4,92** ✓ | 4,5 | pastille douce erreur (vision simulée) |
| `--info` | `--surface-3` | **10,23** ✓ | 4,5 | pastille douce information |
| `--info` | `--surface-3` | **10,16** ✓ | 4,5 | pastille douce information (vision simulée) |
| `--established` | `--surface-3` | **5,04** ✓ | 4,5 | pastille douce établi |
| `--established` | `--surface-3` | **4,80** ✓ | 4,5 | pastille douce établi (vision simulée) |

#### Contexte papier protanopia

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--danger` | `--surface-1` | **10,35** ✓ | 4,5 | erreur |
| `--danger` | `--surface-1` | **12,31** ✓ | 4,5 | erreur (vision simulée) |
| `--success` | `--surface-1` | **6,70** ✓ | 4,5 | succès |
| `--success` | `--surface-1` | **6,19** ✓ | 4,5 | succès (vision simulée) |
| `--warning` | `--surface-1` | **6,15** ✓ | 4,5 | avertissement |
| `--warning` | `--surface-1` | **6,48** ✓ | 4,5 | avertissement (vision simulée) |
| `--info` | `--surface-1` | **9,67** ✓ | 4,5 | information |
| `--info` | `--surface-1` | **9,15** ✓ | 4,5 | information (vision simulée) |
| `--established` | `--surface-1` | **10,82** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--surface-1` | **9,47** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established` | `--canvas` | **10,11** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **8,81** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established-contrast` | `--established` | **10,82** ✓ | 4,5 | texte sur tampon plein |
| `--established-contrast` | `--established` | **9,47** ✓ | 4,5 | texte sur tampon plein (vision simulée) |
| `--canvas` | `--success` | **6,26** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--success` | **5,76** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--danger` | **9,68** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **11,46** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--warning` | **5,75** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **6,03** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--info` | **9,04** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **8,52** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--success` | `--surface-3` | **5,13** ✓ | 4,5 | pastille douce succès |
| `--success` | `--surface-3` | **4,67** ✓ | 4,5 | pastille douce succès (vision simulée) |
| `--warning` | `--surface-3` | **4,71** ✓ | 4,5 | pastille douce avertissement |
| `--warning` | `--surface-3` | **4,89** ✓ | 4,5 | pastille douce avertissement (vision simulée) |
| `--danger` | `--surface-3` | **7,92** ✓ | 4,5 | pastille douce erreur |
| `--danger` | `--surface-3` | **9,29** ✓ | 4,5 | pastille douce erreur (vision simulée) |
| `--info` | `--surface-3` | **7,40** ✓ | 4,5 | pastille douce information |
| `--info` | `--surface-3` | **6,91** ✓ | 4,5 | pastille douce information (vision simulée) |
| `--established` | `--surface-3` | **8,28** ✓ | 4,5 | pastille douce établi |
| `--established` | `--surface-3` | **7,15** ✓ | 4,5 | pastille douce établi (vision simulée) |

#### Contexte lampe HC protanopia

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--danger` | `--surface-1` | **10,40** ✓ | 4,5 | erreur |
| `--danger` | `--surface-1` | **9,16** ✓ | 4,5 | erreur (vision simulée) |
| `--success` | `--surface-1` | **14,61** ✓ | 4,5 | succès |
| `--success` | `--surface-1` | **15,29** ✓ | 4,5 | succès (vision simulée) |
| `--warning` | `--surface-1` | **13,56** ✓ | 4,5 | avertissement |
| `--warning` | `--surface-1` | **12,59** ✓ | 4,5 | avertissement (vision simulée) |
| `--info` | `--surface-1` | **11,23** ✓ | 4,5 | information |
| `--info` | `--surface-1` | **11,43** ✓ | 4,5 | information (vision simulée) |
| `--established` | `--surface-1` | **10,27** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--surface-1` | **10,03** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established` | `--canvas` | **10,51** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **10,27** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established-contrast` | `--established` | **10,51** ✓ | 4,5 | texte sur tampon plein |
| `--established-contrast` | `--established` | **10,27** ✓ | 4,5 | texte sur tampon plein (vision simulée) |
| `--canvas` | `--success` | **14,95** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--success` | **15,65** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--danger` | **10,64** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **9,37** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--warning` | **13,88** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **12,89** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--info` | **11,49** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **11,70** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--success` | `--surface-3` | **12,87** ✓ | 4,5 | pastille douce succès |
| `--success` | `--surface-3` | **13,47** ✓ | 4,5 | pastille douce succès (vision simulée) |
| `--warning` | `--surface-3` | **11,95** ✓ | 4,5 | pastille douce avertissement |
| `--warning` | `--surface-3` | **11,09** ✓ | 4,5 | pastille douce avertissement (vision simulée) |
| `--danger` | `--surface-3` | **9,16** ✓ | 4,5 | pastille douce erreur |
| `--danger` | `--surface-3` | **8,06** ✓ | 4,5 | pastille douce erreur (vision simulée) |
| `--info` | `--surface-3` | **9,89** ✓ | 4,5 | pastille douce information |
| `--info` | `--surface-3` | **10,07** ✓ | 4,5 | pastille douce information (vision simulée) |
| `--established` | `--surface-3` | **9,05** ✓ | 4,5 | pastille douce établi |
| `--established` | `--surface-3` | **8,84** ✓ | 4,5 | pastille douce établi (vision simulée) |

#### Contexte papier HC protanopia

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--danger` | `--surface-1` | **14,30** ✓ | 4,5 | erreur |
| `--danger` | `--surface-1` | **16,35** ✓ | 4,5 | erreur (vision simulée) |
| `--success` | `--surface-1` | **9,15** ✓ | 4,5 | succès |
| `--success` | `--surface-1` | **8,72** ✓ | 4,5 | succès (vision simulée) |
| `--warning` | `--surface-1` | **8,97** ✓ | 4,5 | avertissement |
| `--warning` | `--surface-1` | **9,74** ✓ | 4,5 | avertissement (vision simulée) |
| `--info` | `--surface-1` | **14,04** ✓ | 4,5 | information |
| `--info` | `--surface-1` | **12,92** ✓ | 4,5 | information (vision simulée) |
| `--established` | `--surface-1` | **9,99** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--surface-1` | **8,74** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established` | `--canvas` | **9,99** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **8,74** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established-contrast` | `--established` | **9,99** ✓ | 4,5 | texte sur tampon plein |
| `--established-contrast` | `--established` | **8,74** ✓ | 4,5 | texte sur tampon plein (vision simulée) |
| `--canvas` | `--success` | **9,15** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--success` | **8,72** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--danger` | **14,30** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **16,35** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--warning` | **8,97** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **9,74** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--info` | **14,04** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **12,92** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--success` | `--surface-3` | **7,67** ✓ | 4,5 | pastille douce succès |
| `--success` | `--surface-3` | **7,31** ✓ | 4,5 | pastille douce succès (vision simulée) |
| `--warning` | `--surface-3` | **7,53** ✓ | 4,5 | pastille douce avertissement |
| `--warning` | `--surface-3` | **8,17** ✓ | 4,5 | pastille douce avertissement (vision simulée) |
| `--danger` | `--surface-3` | **11,99** ✓ | 4,5 | pastille douce erreur |
| `--danger` | `--surface-3` | **13,72** ✓ | 4,5 | pastille douce erreur (vision simulée) |
| `--info` | `--surface-3` | **11,77** ✓ | 4,5 | pastille douce information |
| `--info` | `--surface-3` | **10,83** ✓ | 4,5 | pastille douce information (vision simulée) |
| `--established` | `--surface-3` | **8,38** ✓ | 4,5 | pastille douce établi |
| `--established` | `--surface-3` | **7,33** ✓ | 4,5 | pastille douce établi (vision simulée) |

#### Contexte lampe deuteranopia

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--danger` | `--surface-1` | **7,38** ✓ | 4,5 | erreur |
| `--danger` | `--surface-1` | **8,22** ✓ | 4,5 | erreur (vision simulée) |
| `--success` | `--surface-1` | **9,41** ✓ | 4,5 | succès |
| `--success` | `--surface-1` | **9,17** ✓ | 4,5 | succès (vision simulée) |
| `--warning` | `--surface-1` | **11,74** ✓ | 4,5 | avertissement |
| `--warning` | `--surface-1` | **12,35** ✓ | 4,5 | avertissement (vision simulée) |
| `--info` | `--surface-1` | **12,63** ✓ | 4,5 | information |
| `--info` | `--surface-1` | **12,58** ✓ | 4,5 | information (vision simulée) |
| `--established` | `--surface-1` | **6,23** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--surface-1` | **6,42** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established` | `--canvas` | **6,95** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **7,12** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established-contrast` | `--established` | **7,54** ✓ | 4,5 | texte sur tampon plein |
| `--established-contrast` | `--established` | **7,67** ✓ | 4,5 | texte sur tampon plein (vision simulée) |
| `--canvas` | `--success` | **10,49** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--success` | **10,16** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--danger` | **8,23** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **9,11** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--warning` | **13,09** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **13,69** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--info` | **14,09** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **13,95** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--success` | `--surface-3` | **7,62** ✓ | 4,5 | pastille douce succès |
| `--success` | `--surface-3` | **7,47** ✓ | 4,5 | pastille douce succès (vision simulée) |
| `--warning` | `--surface-3` | **9,50** ✓ | 4,5 | pastille douce avertissement |
| `--warning` | `--surface-3` | **10,06** ✓ | 4,5 | pastille douce avertissement (vision simulée) |
| `--danger` | `--surface-3` | **5,98** ✓ | 4,5 | pastille douce erreur |
| `--danger` | `--surface-3` | **6,70** ✓ | 4,5 | pastille douce erreur (vision simulée) |
| `--info` | `--surface-3` | **10,23** ✓ | 4,5 | pastille douce information |
| `--info` | `--surface-3` | **10,25** ✓ | 4,5 | pastille douce information (vision simulée) |
| `--established` | `--surface-3` | **5,04** ✓ | 4,5 | pastille douce établi |
| `--established` | `--surface-3` | **5,23** ✓ | 4,5 | pastille douce établi (vision simulée) |

#### Contexte papier deuteranopia

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--danger` | `--surface-1` | **10,35** ✓ | 4,5 | erreur |
| `--danger` | `--surface-1` | **9,38** ✓ | 4,5 | erreur (vision simulée) |
| `--success` | `--surface-1` | **6,70** ✓ | 4,5 | succès |
| `--success` | `--surface-1` | **7,05** ✓ | 4,5 | succès (vision simulée) |
| `--warning` | `--surface-1` | **6,15** ✓ | 4,5 | avertissement |
| `--warning` | `--surface-1` | **5,96** ✓ | 4,5 | avertissement (vision simulée) |
| `--info` | `--surface-1` | **9,67** ✓ | 4,5 | information |
| `--info` | `--surface-1` | **10,03** ✓ | 4,5 | information (vision simulée) |
| `--established` | `--surface-1` | **10,82** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--surface-1` | **10,02** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established` | `--canvas` | **10,11** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **9,38** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established-contrast` | `--established` | **10,82** ✓ | 4,5 | texte sur tampon plein |
| `--established-contrast` | `--established` | **10,02** ✓ | 4,5 | texte sur tampon plein (vision simulée) |
| `--canvas` | `--success` | **6,26** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--success` | **6,60** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--danger` | **9,68** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **8,79** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--warning` | **5,75** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **5,58** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--info` | **9,04** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **9,40** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--success` | `--surface-3` | **5,13** ✓ | 4,5 | pastille douce succès |
| `--success` | `--surface-3` | **5,44** ✓ | 4,5 | pastille douce succès (vision simulée) |
| `--warning` | `--surface-3` | **4,71** ✓ | 4,5 | pastille douce avertissement |
| `--warning` | `--surface-3` | **4,60** ✓ | 4,5 | pastille douce avertissement (vision simulée) |
| `--danger` | `--surface-3` | **7,92** ✓ | 4,5 | pastille douce erreur |
| `--danger` | `--surface-3` | **7,24** ✓ | 4,5 | pastille douce erreur (vision simulée) |
| `--info` | `--surface-3` | **7,40** ✓ | 4,5 | pastille douce information |
| `--info` | `--surface-3` | **7,74** ✓ | 4,5 | pastille douce information (vision simulée) |
| `--established` | `--surface-3` | **8,28** ✓ | 4,5 | pastille douce établi |
| `--established` | `--surface-3` | **7,73** ✓ | 4,5 | pastille douce établi (vision simulée) |

#### Contexte lampe HC deuteranopia

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--danger` | `--surface-1` | **10,40** ✓ | 4,5 | erreur |
| `--danger` | `--surface-1` | **11,20** ✓ | 4,5 | erreur (vision simulée) |
| `--success` | `--surface-1` | **14,61** ✓ | 4,5 | succès |
| `--success` | `--surface-1` | **14,17** ✓ | 4,5 | succès (vision simulée) |
| `--warning` | `--surface-1` | **13,56** ✓ | 4,5 | avertissement |
| `--warning` | `--surface-1` | **14,17** ✓ | 4,5 | avertissement (vision simulée) |
| `--info` | `--surface-1` | **11,23** ✓ | 4,5 | information |
| `--info` | `--surface-1` | **11,10** ✓ | 4,5 | information (vision simulée) |
| `--established` | `--surface-1` | **10,27** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--surface-1` | **10,47** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established` | `--canvas` | **10,51** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **10,72** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established-contrast` | `--established` | **10,51** ✓ | 4,5 | texte sur tampon plein |
| `--established-contrast` | `--established` | **10,72** ✓ | 4,5 | texte sur tampon plein (vision simulée) |
| `--canvas` | `--success` | **14,95** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--success` | **14,51** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--danger` | **10,64** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **11,47** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--warning` | **13,88** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **14,50** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--info` | **11,49** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **11,36** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--success` | `--surface-3` | **12,87** ✓ | 4,5 | pastille douce succès |
| `--success` | `--surface-3` | **12,48** ✓ | 4,5 | pastille douce succès (vision simulée) |
| `--warning` | `--surface-3` | **11,95** ✓ | 4,5 | pastille douce avertissement |
| `--warning` | `--surface-3` | **12,48** ✓ | 4,5 | pastille douce avertissement (vision simulée) |
| `--danger` | `--surface-3` | **9,16** ✓ | 4,5 | pastille douce erreur |
| `--danger` | `--surface-3` | **9,87** ✓ | 4,5 | pastille douce erreur (vision simulée) |
| `--info` | `--surface-3` | **9,89** ✓ | 4,5 | pastille douce information |
| `--info` | `--surface-3` | **9,77** ✓ | 4,5 | pastille douce information (vision simulée) |
| `--established` | `--surface-3` | **9,05** ✓ | 4,5 | pastille douce établi |
| `--established` | `--surface-3` | **9,23** ✓ | 4,5 | pastille douce établi (vision simulée) |

#### Contexte papier HC deuteranopia

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--danger` | `--surface-1` | **14,30** ✓ | 4,5 | erreur |
| `--danger` | `--surface-1` | **13,20** ✓ | 4,5 | erreur (vision simulée) |
| `--success` | `--surface-1` | **9,15** ✓ | 4,5 | succès |
| `--success` | `--surface-1` | **9,44** ✓ | 4,5 | succès (vision simulée) |
| `--warning` | `--surface-1` | **8,97** ✓ | 4,5 | avertissement |
| `--warning` | `--surface-1` | **8,54** ✓ | 4,5 | avertissement (vision simulée) |
| `--info` | `--surface-1` | **14,04** ✓ | 4,5 | information |
| `--info` | `--surface-1` | **14,00** ✓ | 4,5 | information (vision simulée) |
| `--established` | `--surface-1` | **9,99** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--surface-1` | **9,51** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established` | `--canvas` | **9,99** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **9,51** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established-contrast` | `--established` | **9,99** ✓ | 4,5 | texte sur tampon plein |
| `--established-contrast` | `--established` | **9,51** ✓ | 4,5 | texte sur tampon plein (vision simulée) |
| `--canvas` | `--success` | **9,15** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--success` | **9,44** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--danger` | **14,30** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **13,20** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--warning` | **8,97** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **8,54** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--info` | **14,04** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **14,00** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--success` | `--surface-3` | **7,67** ✓ | 4,5 | pastille douce succès |
| `--success` | `--surface-3` | **7,91** ✓ | 4,5 | pastille douce succès (vision simulée) |
| `--warning` | `--surface-3` | **7,53** ✓ | 4,5 | pastille douce avertissement |
| `--warning` | `--surface-3` | **7,16** ✓ | 4,5 | pastille douce avertissement (vision simulée) |
| `--danger` | `--surface-3` | **11,99** ✓ | 4,5 | pastille douce erreur |
| `--danger` | `--surface-3` | **11,07** ✓ | 4,5 | pastille douce erreur (vision simulée) |
| `--info` | `--surface-3` | **11,77** ✓ | 4,5 | pastille douce information |
| `--info` | `--surface-3` | **11,74** ✓ | 4,5 | pastille douce information (vision simulée) |
| `--established` | `--surface-3` | **8,38** ✓ | 4,5 | pastille douce établi |
| `--established` | `--surface-3` | **7,98** ✓ | 4,5 | pastille douce établi (vision simulée) |

#### Contexte lampe tritanopia

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--danger` | `--surface-1` | **6,61** ✓ | 4,5 | erreur |
| `--danger` | `--surface-1` | **5,96** ✓ | 4,5 | erreur (vision simulée) |
| `--success` | `--surface-1` | **11,15** ✓ | 4,5 | succès |
| `--success` | `--surface-1` | **10,87** ✓ | 4,5 | succès (vision simulée) |
| `--warning` | `--surface-1` | **11,22** ✓ | 4,5 | avertissement |
| `--warning` | `--surface-1` | **10,40** ✓ | 4,5 | avertissement (vision simulée) |
| `--info` | `--surface-1` | **7,62** ✓ | 4,5 | information |
| `--info` | `--surface-1` | **7,57** ✓ | 4,5 | information (vision simulée) |
| `--established` | `--surface-1` | **6,24** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--surface-1` | **6,24** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established` | `--canvas` | **6,96** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **6,98** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established-contrast` | `--established` | **7,55** ✓ | 4,5 | texte sur tampon plein |
| `--established-contrast` | `--established` | **7,64** ✓ | 4,5 | texte sur tampon plein (vision simulée) |
| `--canvas` | `--success` | **12,44** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--success` | **12,16** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--danger` | **7,38** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **6,66** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--warning` | **12,52** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **11,63** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--info` | **8,50** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **8,47** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--success` | `--surface-3` | **9,03** ✓ | 4,5 | pastille douce succès |
| `--success` | `--surface-3` | **8,87** ✓ | 4,5 | pastille douce succès (vision simulée) |
| `--warning` | `--surface-3` | **9,09** ✓ | 4,5 | pastille douce avertissement |
| `--warning` | `--surface-3` | **8,48** ✓ | 4,5 | pastille douce avertissement (vision simulée) |
| `--danger` | `--surface-3` | **5,35** ✓ | 4,5 | pastille douce erreur |
| `--danger` | `--surface-3` | **4,86** ✓ | 4,5 | pastille douce erreur (vision simulée) |
| `--info` | `--surface-3` | **6,17** ✓ | 4,5 | pastille douce information |
| `--info` | `--surface-3` | **6,18** ✓ | 4,5 | pastille douce information (vision simulée) |
| `--established` | `--surface-3` | **5,05** ✓ | 4,5 | pastille douce établi |
| `--established` | `--surface-3` | **5,09** ✓ | 4,5 | pastille douce établi (vision simulée) |

#### Contexte papier tritanopia

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--danger` | `--surface-1` | **6,09** ✓ | 4,5 | erreur |
| `--danger` | `--surface-1` | **6,10** ✓ | 4,5 | erreur (vision simulée) |
| `--success` | `--surface-1` | **6,09** ✓ | 4,5 | succès |
| `--success` | `--surface-1` | **6,03** ✓ | 4,5 | succès (vision simulée) |
| `--warning` | `--surface-1` | **9,68** ✓ | 4,5 | avertissement |
| `--warning` | `--surface-1` | **9,73** ✓ | 4,5 | avertissement (vision simulée) |
| `--info` | `--surface-1` | **10,16** ✓ | 4,5 | information |
| `--info` | `--surface-1` | **10,10** ✓ | 4,5 | information (vision simulée) |
| `--established` | `--surface-1` | **6,30** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--surface-1` | **6,11** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established` | `--canvas` | **5,89** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **5,71** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established-contrast` | `--established` | **6,30** ✓ | 4,5 | texte sur tampon plein |
| `--established-contrast` | `--established` | **6,11** ✓ | 4,5 | texte sur tampon plein (vision simulée) |
| `--canvas` | `--success` | **5,69** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--success` | **5,63** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--danger` | **5,70** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **5,70** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--warning` | **9,05** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **9,09** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--info` | **9,50** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **9,43** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--success` | `--surface-3` | **4,66** ✓ | 4,5 | pastille douce succès |
| `--success` | `--surface-3` | **4,60** ✓ | 4,5 | pastille douce succès (vision simulée) |
| `--warning` | `--surface-3` | **7,41** ✓ | 4,5 | pastille douce avertissement |
| `--warning` | `--surface-3` | **7,43** ✓ | 4,5 | pastille douce avertissement (vision simulée) |
| `--danger` | `--surface-3` | **4,66** ✓ | 4,5 | pastille douce erreur |
| `--danger` | `--surface-3` | **4,66** ✓ | 4,5 | pastille douce erreur (vision simulée) |
| `--info` | `--surface-3` | **7,78** ✓ | 4,5 | pastille douce information |
| `--info` | `--surface-3` | **7,71** ✓ | 4,5 | pastille douce information (vision simulée) |
| `--established` | `--surface-3` | **4,82** ✓ | 4,5 | pastille douce établi |
| `--established` | `--surface-3` | **4,67** ✓ | 4,5 | pastille douce établi (vision simulée) |

#### Contexte lampe HC tritanopia

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--danger` | `--surface-1` | **13,72** ✓ | 4,5 | erreur |
| `--danger` | `--surface-1` | **13,53** ✓ | 4,5 | erreur (vision simulée) |
| `--success` | `--surface-1` | **15,81** ✓ | 4,5 | succès |
| `--success` | `--surface-1` | **15,64** ✓ | 4,5 | succès (vision simulée) |
| `--warning` | `--surface-1` | **10,47** ✓ | 4,5 | avertissement |
| `--warning` | `--surface-1` | **9,59** ✓ | 4,5 | avertissement (vision simulée) |
| `--info` | `--surface-1` | **10,94** ✓ | 4,5 | information |
| `--info` | `--surface-1` | **11,05** ✓ | 4,5 | information (vision simulée) |
| `--established` | `--surface-1` | **10,42** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--surface-1` | **10,59** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established` | `--canvas` | **10,66** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **10,84** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established-contrast` | `--established` | **10,66** ✓ | 4,5 | texte sur tampon plein |
| `--established-contrast` | `--established` | **10,84** ✓ | 4,5 | texte sur tampon plein (vision simulée) |
| `--canvas` | `--success` | **16,18** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--success` | **16,01** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--danger` | **14,04** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **13,84** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--warning` | **10,72** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **9,81** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--info` | **11,20** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **11,31** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--success` | `--surface-3` | **13,92** ✓ | 4,5 | pastille douce succès |
| `--success` | `--surface-3` | **13,78** ✓ | 4,5 | pastille douce succès (vision simulée) |
| `--warning` | `--surface-3` | **9,22** ✓ | 4,5 | pastille douce avertissement |
| `--warning` | `--surface-3` | **8,44** ✓ | 4,5 | pastille douce avertissement (vision simulée) |
| `--danger` | `--surface-3` | **12,09** ✓ | 4,5 | pastille douce erreur |
| `--danger` | `--surface-3` | **11,91** ✓ | 4,5 | pastille douce erreur (vision simulée) |
| `--info` | `--surface-3` | **9,64** ✓ | 4,5 | pastille douce information |
| `--info` | `--surface-3` | **9,73** ✓ | 4,5 | pastille douce information (vision simulée) |
| `--established` | `--surface-3` | **9,17** ✓ | 4,5 | pastille douce établi |
| `--established` | `--surface-3` | **9,33** ✓ | 4,5 | pastille douce établi (vision simulée) |

#### Contexte papier HC tritanopia

| Premier plan | Fond | Ratio | Seuil | Usage |
|---|---|---|---|---|
| `--danger` | `--surface-1` | **9,57** ✓ | 4,5 | erreur |
| `--danger` | `--surface-1` | **8,65** ✓ | 4,5 | erreur (vision simulée) |
| `--success` | `--surface-1` | **13,30** ✓ | 4,5 | succès |
| `--success` | `--surface-1` | **13,36** ✓ | 4,5 | succès (vision simulée) |
| `--warning` | `--surface-1` | **9,33** ✓ | 4,5 | avertissement |
| `--warning` | `--surface-1` | **9,40** ✓ | 4,5 | avertissement (vision simulée) |
| `--info` | `--surface-1` | **9,08** ✓ | 4,5 | information |
| `--info` | `--surface-1` | **8,54** ✓ | 4,5 | information (vision simulée) |
| `--established` | `--surface-1` | **14,54** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--surface-1` | **14,20** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established` | `--canvas` | **14,54** ✓ | 4,5 | tampon « Établi » |
| `--established` | `--canvas` | **14,20** ✓ | 4,5 | tampon « Établi » (vision simulée) |
| `--established-contrast` | `--established` | **14,54** ✓ | 4,5 | texte sur tampon plein |
| `--established-contrast` | `--established` | **14,20** ✓ | 4,5 | texte sur tampon plein (vision simulée) |
| `--canvas` | `--success` | **13,30** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--success` | **13,36** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--danger` | **9,57** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--danger` | **8,65** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--warning` | **9,33** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--warning` | **9,40** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--canvas` | `--info` | **9,08** ✓ | 4,5 | pastille pleine |
| `--canvas` | `--info` | **8,54** ✓ | 4,5 | pastille pleine (vision simulée) |
| `--success` | `--surface-3` | **11,16** ✓ | 4,5 | pastille douce succès |
| `--success` | `--surface-3` | **11,21** ✓ | 4,5 | pastille douce succès (vision simulée) |
| `--warning` | `--surface-3` | **7,82** ✓ | 4,5 | pastille douce avertissement |
| `--warning` | `--surface-3` | **7,88** ✓ | 4,5 | pastille douce avertissement (vision simulée) |
| `--danger` | `--surface-3` | **8,03** ✓ | 4,5 | pastille douce erreur |
| `--danger` | `--surface-3` | **7,26** ✓ | 4,5 | pastille douce erreur (vision simulée) |
| `--info` | `--surface-3` | **7,61** ✓ | 4,5 | pastille douce information |
| `--info` | `--surface-3` | **7,16** ✓ | 4,5 | pastille douce information (vision simulée) |
| `--established` | `--surface-3` | **12,19** ✓ | 4,5 | pastille douce établi |
| `--established` | `--surface-3` | **11,91** ✓ | 4,5 | pastille douce établi (vision simulée) |
