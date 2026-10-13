# ARCHITECTURE — L'Arbre aux absents

> Maintenu par l'orchestrateur et `architect`. **Le contrat (§3) est modifié AVANT toute implémentation.**
> Source de vérité du contrat : `packages/contract/src/`.

## 0. Projets liés / références

| Repo | Mode | Usage |
|---|---|---|
| `fs0ciety7000/carte-mons` | lecture + copie de code adaptée | Caméra pure, `SvgRenderer`, gestes, règles SVG de `content:check`. Source et commit notés dans `packages/map/SOURCE.md`. Référence de style de la carte (gravure rehaussée d'aquarelle). |
| `fs0ciety7000/mons-corp` | assets | Logos CARDOR Media, CM Interactive, CM Creative Lab (`static/brand/`, source dans `SOURCE.md`), pour les crédits et le pied de page uniquement. |
| `fs0ciety7000/mons-corp`, `fs0ciety7000/occ-studios` | mise à jour (après mise en ligne) | Ajout au catalogue apps et aux projets CM Interactive, par PR. |

Aucune autre référence aux projets de la maison dans le jeu ou le site (demande explicite).

## 1. Vue d'ensemble

```
content/world/** + art/map/*.svg ─┐
content/cases/<id>/** ────────────┼─ content:build (zod, parseur Markdown, hachage, svgo, éditions full/démo)
                                  │      → apps/game/src/generated/   (ignoré par git)
                                  │      → apps/site/src/generated/
packages/contract   types + schémas zod
packages/engine     moteur pur (applyAction, search, validate, settle…)
packages/map        caméra pure + MapView Svelte (port carte-mons)
packages/ui         tokens, art.css, polices, primitives Svelte
apps/game           Vite + Svelte 5 SPA (base './')
   ├─ build web  → dist/ → zip itch.io (complet + démo)
   └─ src-tauri  → Tauri 2 : Windows, macOS, Linux, Android (CI uniquement)
apps/site           SvelteKit adapter-static → nginx (Docker) → Coolify → arbre.fs0ciety.org
```

Aucun serveur de jeu : tout est hors ligne. Le site est entièrement statique.

## 2. Stack

| Couche | Choix | Pourquoi | Écarté |
|---|---|---|---|
| Langage | TypeScript strict, Node 22 (dev, build) | Cohérence avec l'écosystème | — |
| Shell natif | **Tauri 2** (≥ 2.9) + plugins `fs` et `dialog`, aucune commande Rust maison | Binaires légers, un outil pour 4 OS | Godot 4 (texte, a11y et SVG faibles, export web lourd), Electron + Capacitor (deux shells, > 100 Mo) |
| UI du jeu | **Svelte 5 (runes) + Vite, SPA sans SvelteKit**, `base: './'` | Un seul écran à états ; chemins relatifs valides dans l'iframe itch et en `tauri://` | SvelteKit SPA, React |
| Site vitrine | **SvelteKit + adapter-static**, tout prérendu | Réutilise la carte et les tokens | Astro (2e framework) |
| Monorepo | npm workspaces | Natif, 4 commandes identiques | pnpm, turbo, nx |
| Contrat et contenu | **zod 4** ; `z.toJSONSchema()` pour l'éditeur | Comme carte-mons | valibot |
| Documents | Markdown restreint + frontmatter YAML, **parseur maison** vers AST typé ; `yaml` en devDependency | Zéro HTML, zéro `{@html}`, liens automatiques au build | marked, micromark, JSON pur |
| Carte | Caméra pure + `SvgRenderer` + gestes portés de carte-mons | Éprouvé, ≤ 50 Ko gz, clavier compris | OpenSeadragon, Leaflet |
| Styles | CSS natif + tokens (custom properties), classes d'art pour les SVG | Contraste élevé par changement de classes | Tailwind |
| Motion | CSS + transitions de caméra, coupées en mouvement réduit | Pas de lib | GSAP |
| Audio | Web Audio API + `<audio>` (Opus + repli AAC) | Aucune dépendance | Howler |
| Sauvegarde | Interface `SaveStore` : fichiers JSON (`plugin-fs`) sous Tauri, IndexedDB + export/import en web | Robuste, portable | `plugin-store`, localStorage de la WebView |
| Tests | Vitest (moteur, contenu, caméra) ; Playwright chromium + webkit + axe | WebKit ≈ WKWebView/WebKitGTK | — |
| Lint / format | Prettier + ESLint (typescript-eslint, eslint-plugin-svelte) ; `cargo fmt` + `clippy` en CI | Comme les projets liés | Biome |
| Service du site | nginx-unprivileged :8080, précompressé, `/healthz` | Pas de Node au runtime | — |

Dépendances d'exécution du jeu : `svelte`, `zod`, et sous Tauri seulement (import dynamique quand
`VITE_TARGET=tauri`) `@tauri-apps/api`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`.
Textes d'UI regroupés dans `apps/game/src/messages.fr.ts` (prépare les traductions).

Porte de sortie : le cœur web ne dépend du shell que par l'interface `Platform` (§4). Si WebKitGTK
bloque sous Linux, cette seule cible peut passer en Electron.

## 3. Contrat (source de vérité : `packages/contract/src/`)

### 3.1 Identifiants et conditions

```ts
// ids.ts : kebab-case ; id = nom de fichier quand il y en a un
export type CaseId = string; export type PersonId = string; export type SlotId = string;
export type DocumentId = string; export type KeywordId = string; export type PlaceId = string;
export type PortraitId = string; export type OccupationId = string; export type GroupId = string;
export type SecretId = string; export type EndingId = string; export type AchievementId = string;
export type HintId = string;
export type PartialDate = string;            // "1923", "1923-04", "1923-04-17" (calendrier du monde)
export interface NormPoint { x: number; y: number } // fractions [0,1], origine en haut à gauche

// condition.ts : MONOTONE pour tout déblocage (l'état ne fait que croître : pas d'impasse)
export type Condition =
  | { read: DocumentId } | { unlocked: DocumentId } | { searched: KeywordId }
  | { visited: PlaceId } | { locked: SlotId } | { groupLocked: GroupId }
  | { secret: SecretId } | { lockedCount: { gte: number } }
  | { all: Condition[] } | { any: Condition[] };
/** Réservée aux fins et aux succès : autorise `not`. */
export type OutcomeCondition = Condition | { not: OutcomeCondition }
  | { answered: { question: string; option: string } }   // réponse au rapport final
  | { all: OutcomeCondition[] } | { any: OutcomeCondition[] };
```

### 3.2 Contenu source (écrit à la main)

```ts
// case.json (scenariste)
export interface CaseMeta {
  id: CaseId; title: string; subtitle?: string; version: string; // semver
  intro: DocumentId; epilogue?: DocumentId; timedTargetsMs?: number[]; credits?: string[];
}
// family.json (scenariste : vérité de la bible)
export interface Person {
  id: PersonId;
  given: string[];   // variantes acceptées, la première = canonique
  family: string[];  // nom de naissance, d'usage, graphies
  nicknames?: string[];
  occupation: OccupationId; portrait: PortraitId;
  born?: PartialDate; died?: PartialDate;
  parents?: [PersonId | null, PersonId | null]; unions?: PersonId[];
  bibleNotes?: string; // retiré au build
}
export interface Occupation { id: OccupationId; label: string }
export interface Portrait { id: PortraitId; file: string /* portraits/<id>.svg */; alt: string; caption?: string }
export interface Family { persons: Person[]; occupations: Occupation[]; portraits: Portrait[] }

// tree.json (level-designer)
export interface TreeSlot {
  id: SlotId; person: PersonId; generation: number; column: number;
  prefilled?: boolean;      // connue d'emblée (tutoriel)
  revealedBy?: Condition;   // branche cachée
}
export interface ValidationGroup { id: GroupId; label: string; slots: SlotId[]; threshold: number /* ≥ 3 */ }
export interface TreeSpec { slots: TreeSlot[]; groups: ValidationGroup[] }

// documents/<id>.md : frontmatter YAML (scenariste) + Markdown restreint
export type DocumentKind = 'letter' | 'newspaper' | 'photo' | 'register' | 'certificate'
  | 'postcard' | 'directory' | 'telegram' | 'catalog' | 'note' | 'object' | 'report' | 'advert';
export interface DocumentFrontmatter {
  kind: DocumentKind; title: string; date?: PartialDate; author?: string;
  place?: PlaceId; archive?: string; // fonds, cote
  reveals?: { portraits?: PortraitId[]; occupations?: OccupationId[] };
  illustration?: { file: string; alt: string };
  optional?: boolean; // non requis par le solveur
}
export type Inline =
  | { t: 'text'; v: string } | { t: 'em' | 'strong' | 'hand' | 'strike'; c: Inline[] }   // strike : ~~texte barré~~
  | { t: 'ref'; keyword: KeywordId; c: Inline[] }
  | { t: 'redacted'; length: number };
export type Block =
  | { t: 'p' | 'signature'; c: Inline[] } | { t: 'h'; level: 2 | 3; c: Inline[] }
  | { t: 'quote'; c: Block[] } | { t: 'list'; ordered: boolean; items: Inline[][] }
  | { t: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { t: 'figure'; asset: string; alt: string; caption?: Inline[] }
  | { t: 'stamp'; text: string } | { t: 'hr' };

// progression.json (level-designer)
export interface Keyword {
  id: KeywordId; label: string;
  kind: 'person' | 'place' | 'organization' | 'event' | 'object' | 'other';
  terms: string[];        // variantes, normalisées et uniques au build
  autolink?: boolean;     // défaut true
  hiddenTerm?: boolean;   // jamais écrit tel quel : déduction du joueur
  results: { documents: DocumentId[]; requires?: Condition }[];
}
export interface CasePlace { place: PlaceId; revealedBy?: Condition; documents: { id: DocumentId; requires?: Condition }[] }
export interface Progression {
  start: DocumentId[];
  unlocks: Record<DocumentId, Condition>;
  keywords: Keyword[]; places: CasePlace[];
  occupationsUnlock?: Record<OccupationId, Condition>;
  secrets: { id: SecretId; title: string; discoveredBy: Condition }[];
  endings: { id: EndingId; file: string /* endings/<id>.md */; when: OutcomeCondition; priority: number;
    sections?: Record<string /* étiquette `## [S2] …` */, OutcomeCondition> }[];
  report?: ReportQuestion[];   // rapport final, posé au dénouement avant `finish`
  demo?: { documents: DocumentId[]; slots: SlotId[]; end: DocumentId };
}
export interface ReportQuestion { id: string; prompt: string; kind: 'question' | 'choice';
  askedWhen?: OutcomeCondition; options: { id: string; label: string; availableWhen?: Condition }[] /* ≥ 2 */ }
// hints.json, achievements.json (level-designer) : tableaux racine Hint[] et Achievement[]
export interface Hint { id: HintId; target: { slot: SlotId } | { group: GroupId }; level: 1 | 2 | 3; text: string; availableWhen: Condition }
export type AchievementCondition = OutcomeCondition
  | { endingReached: EndingId } | { timedUnderMs: number } | { allSecrets: true }
  | { all: AchievementCondition[] } | { any: AchievementCondition[] } | { not: AchievementCondition };
export interface Achievement { id: AchievementId; title: string; description: string; hidden: boolean; when: AchievementCondition }

// content/world (cartographe)
export interface Place { id: PlaceId; name: string; kind: 'region' | 'city' | 'village' | 'building' | 'landmark' | 'sea' | 'mountain' | 'river'; position: NormPoint; description?: string; focusZoom?: number; hitRadius?: number }
export interface WorldMap { aspect: number; layers: ('base' | 'relief' | 'water' | 'places' | 'labels')[]; minZoom: number; maxZoom: number; title: string; attribution?: string }
```

### 3.3 Contenu compilé (seule donnée lue par le jeu)

```ts
export interface SlotAnswer { given: string[]; family: string[]; portrait: string; occupation: string } // hachages cyrb53(salt|slot|champ|normalize(v))
export interface CompiledDocument extends DocumentFrontmatter { id: DocumentId; body: Block[]; keywords: KeywordId[] }
export interface CompiledCase {
  format: 1; id: CaseId; edition: 'full' | 'demo'; contentHash: string /* 8 hex */; salt: string;
  meta: CaseMeta;
  documents: Record<DocumentId, CompiledDocument>;
  searchIndex: Record<string /* terme normalisé */, KeywordId>;
  keywords: Record<KeywordId, Omit<Keyword, 'terms'>>;
  slots: Record<SlotId, Omit<TreeSlot, 'person'> & { prefilledGuess?: SlotGuess; answer: SlotAnswer; parents: SlotId[]; unions: SlotId[] }>;
  groups: ValidationGroup[]; portraits: Record<PortraitId, Portrait & { svg: string }>; occupations: Record<OccupationId, Occupation>;
  places: Record<PlaceId, Place & Omit<CasePlace, 'place'>>;
  progression: Pick<Progression, 'start' | 'unlocks' | 'occupationsUnlock' | 'secrets'>;
  endings: Record<EndingId, { when: OutcomeCondition; priority: number; title: string;
    sections: { label: string | null; title: string | null; when?: OutcomeCondition; body: Block[] }[] }>;
  report: ReportQuestion[];
  hints: Hint[]; achievements: Achievement[];
  // illustrations SVG : écrites à part (generated/assets.<édition>.json), clé = chemin `illustrations/<file>`
  candidates: { given: string[]; family: string[] }; // noms proposables (lus dans les documents), pour la saisie par liste
}
```

### 3.4 Partie, profil, réglages

```ts
export type SaveSlotId = 'auto' | 'slot-1' | 'slot-2' | 'slot-3';
export interface SlotGuess { given: string; family: string; portrait: PortraitId | null; occupation: OccupationId | null }
export interface Pin { kind: 'document' | 'keyword' | 'slot'; id: string }
export interface SaveState {
  schemaVersion: 1; caseId: CaseId; contentHash: string; edition: 'full' | 'demo';
  slot: SaveSlotId; mode: 'standard' | 'timed';
  createdAt: number; updatedAt: number; elapsedMs: number;
  unlocked: Record<DocumentId, number>; read: Record<DocumentId, number>;
  searched: KeywordId[]; searchLog: { query: string; keyword: KeywordId | null; at: number }[]; // ≤ 200
  visited: PlaceId[]; revealedSlots: SlotId[];
  tree: Record<SlotId, SlotGuess>; locked: Record<SlotId, number>;
  secrets: Record<SecretId, number>; hintsUsed: Record<HintId, number>;
  notebook: {
    pins: Pin[]; // ≤ 60
    highlights: { doc: DocumentId; path: number[]; start: number; end: number; color: 1 | 2 | 3 | 4 | 5 }[];
    notes: { id: string; target?: Pin; text: string /* ≤ 2000 */; at: number }[];
  };
  report: Record<string /* question */, string /* option */>;
  ending: EndingId | null;
}
export interface SaveSlotSummary { slot: SaveSlotId; caseTitle: string; updatedAt: number; elapsedMs: number; mode: SaveState['mode']; progress: number }
export interface HintSettings { preset: 0 | 1 | 2 | 3 | 'custom'; unreadBadges: boolean; exhaustedTerms: boolean;
  placeCounters: boolean; whereToLook: boolean; groupCounter: boolean; progressiveHints: boolean } // GAME_DESIGN §10
export interface Settings {
  textScale: 0.875 | 1 | 1.25 | 1.5 | 2; readingFont: 'default' | 'hyperlegible' | 'dyslexic';
  lineSpacing: 'default' | 'wide' | 'wider'; letterSpacing: boolean; transcriptByDefault: boolean;
  replaceHandwriting: boolean; highContrast: boolean; reducePaperTexture: boolean;
  colorVision: 'default' | 'protanopia' | 'deuteranopia' | 'tritanopia'; motion: 'system' | 'reduced' | 'full';
  hints: HintSettings; validation: 'auto' | 'manual'; showTimer: boolean;
  volume: { master: number; music: number; ambience: number; sfx: number; ui: number };
  mono: boolean; muteInBackground: boolean; haptics: boolean; longPressMs: 300 | 400 | 600;
  confirmClear: boolean; inputGlyphs: 'auto' | 'keyboard' | 'gamepad';
}
export interface Profile { schemaVersion: 1; settings: Settings; achievements: Record<AchievementId, number>; completed: Record<CaseId, { bestTimedMs?: number; endings: EndingId[] }> }
```

### 3.5 Moteur pur (`packages/engine`)

Déterministe : le temps arrive par `at`, aucune exception sur une action valide, aucune mutation.

```ts
export type Action =
  | { type: 'openDocument'; id: DocumentId; at: number }
  | { type: 'search'; query: string; at: number }
  | { type: 'visitPlace'; id: PlaceId; at: number }
  | { type: 'setSlot'; slot: SlotId; patch: Partial<SlotGuess>; at: number }
  | { type: 'clearSlot'; slot: SlotId; at: number }
  | { type: 'validate'; at: number }
  | { type: 'pin' | 'unpin'; target: Pin; at: number }
  | { type: 'highlight'; h: SaveState['notebook']['highlights'][number]; at: number }
  | { type: 'removeHighlight'; index: number; at: number }
  | { type: 'note'; id?: string; target?: Pin; text: string; at: number }
  | { type: 'deleteNote'; id: string; at: number }
  | { type: 'useHint'; id: HintId; at: number }
  | { type: 'answer'; question: string; option: string; at: number } // rapport final, avant `finish`
  | { type: 'tick'; deltaMs: number }   // borné à [0, 5000]
  | { type: 'finish'; at: number };
export type GameEvent =
  | { type: 'documentsUnlocked'; ids: DocumentId[] } | { type: 'searchResult'; outcome: SearchOutcome }
  | { type: 'slotsRevealed'; ids: SlotId[] } | { type: 'slotsLocked'; ids: SlotId[]; groups: GroupId[] }
  | { type: 'validationFailed' }   // aucun détail par case
  | { type: 'secretFound'; id: SecretId } | { type: 'endingReached'; id: EndingId }
  | { type: 'rejected'; reason: 'unknownId' | 'slotLocked' | 'notAvailable' | 'tooLong' | 'limit' };
export interface SearchOutcome { query: string; normalized: string; keyword: KeywordId | null; documents: DocumentId[]; newDocuments: DocumentId[] }

normalize(text): string                                   // NFKD + œ/æ/ß/ø/ł dépliés, sans diacritiques, minuscules, ponctuation → espace
newGame(c, { slot, mode, at }): SaveState
applyAction(s, a, c): { state; events }                   // en validation auto, setSlot déclenche validate
search(query, s, c): SearchOutcome                        // correspondance exacte du terme normalisé, sans flou
validate(s, c): { lock: SlotId[]; groups: GroupId[] }
settle(s, c): { state; events }                           // point fixe des déblocages
evaluate(cond, s, c): boolean
evaluateAchievements(s, profile, c): AchievementId[]
parseSave(raw, c): { ok: true; state; dropped: string[] } | { ok: false; error }
summarize(s, c): SaveSlotSummary
// sélecteurs
knownKeywords, availablePortraits, availableOccupations, availableNames, visiblePlaces, visibleSlots, progress, endingFor,
reportQuestions /* questions posées + options disponibles + réponse */, endingSections /* sections visibles d'une fin */
```

**Validation par groupes** (détail : `docs/game/GAME_DESIGN.md`) : pour chaque groupe, on compte les
cases non verrouillées dont les quatre champs sont justes ; si ce nombre atteint
`min(threshold, cases restantes du groupe)`, ces cases se verrouillent ; sinon `validationFailed`,
sans détail. Une case n'est vérifiée que si ses quatre champs sont remplis.

**Rapport final et fins à sections** : au dénouement, le jeu pose les questions de `report`
(celles dont `askedWhen` est vraie, options filtrées par `availableWhen`) ; chaque réponse est une
action `answer` (refusée si la question n'est pas posée ou l'option indisponible ; modifiable tant
que `finish` n'a pas eu lieu). `finish` choisit la fin (priorité, conditions pouvant utiliser
`answered`), puis l'écran affiche ses sections dont `when` est vraie. Dans `endings/<id>.md`, une
section commence par `## [étiquette] Titre` ; le texte avant la première section ou étiqueté
`[commun]` s'affiche toujours. Le solveur vérifie qu'au moins une combinaison de réponses mène à
chaque fin.

### 3.6 Fichiers de contenu

```
content/world/map.json                         WorldMap
content/world/places/<placeId>.json            Place
art/map/{base,relief,water,places,labels}.svg  couches, viewBox 0 0 1000·aspect 1000
content/cases/<caseId>/
  case.json  family.json                       scenariste
  documents/<docId>.md  endings/<endingId>.md (frontmatter `title`)  scenariste
  tree.json  progression.json  hints.json  achievements.json   level-designer
  portraits/<portraitId>.svg  illustrations/*.svg              cartographe
content/*.schema.json                          générés par z.toJSONSchema()
```

Markdown admis : paragraphes, `*em*`, `**strong**`, `~~barré~~`, `> citation`, listes, tableaux pipe, `## titres`,
`![alt](illustrations/x.svg "légende")`, `[[texte|keyword-id]]`, `::hand[…]`, `::stamp[…]`,
`::signature[…]`, `::redacted[6]`, `---`. Tout HTML brut est une erreur.

### 3.7 Règles de `npm run content:check`

1. **Schémas** zod stricts, clés inconnues refusées, id = nom de fichier, kebab-case, unicité.
2. **Références** toutes résolues (documents, mots-clés, lieux, portraits, métiers, cases, groupes, secrets, fins, assets).
3. **Arbre** : personnes uniques par case ; groupes = partition des cases non pré-remplies ; seuil ≥ 3 ;
   liens familiaux cohérents (pas de cycle, ≤ 2 parents, parent né avant l'enfant).
4. **Conditions** : `not` interdit hors fins et succès ; pas d'auto-dépendance.
5. **Mots-clés** : termes uniques après normalisation ; au moins un résultat ; chaque mot-clé non
   `hiddenTerm` apparaît dans un texte accessible ; pas de chevauchement de liens.
6. **Solvabilité** (solveur) : tout document non `optional`, toute case, tout secret et toute fin
   atteignables ; pour chaque case hors tutoriel, le nom figure dans **au moins deux** documents
   atteignables avant son verrouillage, portrait et métier débloqués ; une fin au moins est vraie à
   100 %. Rapport : `npm run content:solve -- --report`.
7. **Markdown** : syntaxe admise seulement, images existantes, `alt` non vide, aucune URL externe.
8. **SVG** : interdits `<script>`, `on*`, `<foreignObject>`, `href` externes, couleurs en dur, `style=` ;
   seules les classes de `ART_CLASSES`, `none`, `currentColor`, `url(#…)` ; ids préfixés par fichier ;
   viewBox des couches conformes.
9. **Budgets gzip** après svgo : portrait ≤ 25 Ko, illustration ≤ 60 Ko, couche `base` ≤ 60 Ko, couches
   de carte ≤ 300 Ko au total, affaire compilée (texte) ≤ 600 Ko, DOM de la carte ≤ 6 000 nœuds.
10. **Démo** : solvable jusqu'à `demo.end`, aucun texte hors démo dans le bundle démo (canaris).
11. **Fuite** : aucun `bibleNotes` ni réponse en clair dans le compilé.

## 4. Plateforme

```ts
interface SaveStore {
  list(): Promise<SaveSlotSummary[]>; load(slot: SaveSlotId): Promise<unknown | null>;
  save(slot: SaveSlotId, s: SaveState): Promise<void>; remove(slot: SaveSlotId): Promise<void>;
  exportFile(slot: SaveSlotId): Promise<void>; importFile(): Promise<unknown | null>;
  loadProfile(): Promise<unknown | null>; saveProfile(p: Profile): Promise<void>;
}
interface Platform { kind: 'web' | 'desktop' | 'android'; saves: SaveStore;
  setFullscreen?(on: boolean): Promise<void>; onBack(cb: () => boolean): () => void; quit?(): void }
```

- **Tauri** : `$APPDATA/saves/<slot>.json`, écriture atomique (`.tmp` + renommage) et `.bak` ; capability
  limitée à `$APPDATA/saves/**` ; `plugin-dialog` pour export/import.
- **Web** : IndexedDB natif, repli localStorage, `navigator.storage.persist()` ; export/import visibles
  (le stockage de l'iframe itch peut être purgé par Safari et Firefox).
- Sauvegarde auto 2 s après chaque action, et à `visibilitychange`, `pagehide`, mise en arrière-plan.
  Tout import passe par `parseSave`.
- **Entrées** : Pointer Events unifiés, cibles ≥ 44 px ; clavier complet (roving tabindex, raccourcis) ;
  manette par Gamepad API avec navigation spatiale par focus (`input/spatial-nav.ts`), polling seulement
  si une manette est branchée ; retour Android via `onBackButtonPress` ; safe areas.
- **Polices** : WOFF2 OFL auto-hébergées, sous-ensemble Latin étendu couvrant les diacritiques de la
  langue inventée. Aucune police pixel art.
- **Audio** : Web Audio (bus master, musique, effets), Opus + repli AAC ; `bundleMediaFramework` pour
  l'AppImage. Aucune information portée par le son seul.

## 5. Sécurité

- Aucun `{@html}` sur du texte de contenu ; SVG nettoyés et contrôlés au build.
- CSP Tauri `default-src 'self'`, aucun domaine distant, capabilities minimales.
- CSP stricte du site (nginx). Aucun secret dans le repo (keystore Android, clés butler, signature :
  secrets GitHub Actions uniquement).
- Les réponses sont hachées dans le contenu compilé (anti-spoiler léger, pas une protection).

## 6. Arborescence et périmètres

```
package.json, tsconfig.base.json, eslint.config.js, prettier   orchestrateur
packages/contract/src/**            types + schémas zod               orchestrateur (backend en lot 0)
packages/engine/**                  moteur pur + tests                backend
packages/content-tools/**           parseur, compile, check, solveur   backend
scripts/*.ts                        content-check/build/solve, package-itch   backend
packages/map/src/camera/**          caméra pure (port carte-mons)     backend
packages/map/src/svelte/**          MapView, SvgRenderer, gestes      frontend-jeu
packages/ui/**                      tokens.css, art.css, polices, primitives Svelte   design-lead
apps/game/src/platform/**           adaptateurs web / Tauri           backend
apps/game/src/** (hors platform), index.html, vite.config.ts            frontend-jeu
apps/game/src-tauri/**              Tauri (config, capabilities, icônes)   devops
apps/site/src/routes/design/**      démo du design system             design-lead
apps/site/src/** (hors design)      accueil, monde, artbook, charte, crédits, presse   frontend-site
apps/site/static/brand/**           logos (copie de static/brand/)    orchestrateur
Dockerfile, nginx.conf, .github/**, docs/DEPLOYMENT.md, scripts/*.sh   devops
docs/DESIGN.md                      design-lead
docs/game/**                        game-designer
docs/scenario/**, docs/monde/**     scenariste
docs/level/**                       level-designer
content/world/**, art/**            cartographe
content/cases/<id>/{case,family}.json, documents/**, endings/**   scenariste
content/cases/<id>/{tree,progression,hints,achievements}.json     level-designer
content/cases/<id>/{portraits,illustrations}/**                   cartographe
tests/e2e/**                        qa-reviewer
```

## 7. CI/CD (détail : `docs/DEPLOYMENT.md`)

| Workflow | Déclencheur | Jobs |
|---|---|---|
| `ci.yml` | push / PR | check · build (web, zips itch complet et démo, site) · e2e (chromium + webkit + axe) · docker (site, `/healthz`) · rust-lint |
| `tauri.yml` | tag `v*` + manuel | matrice Linux (AppImage, deb) / Windows (NSIS) / macOS (universel, dmg) + Android (APK/AAB, signés si secrets présents) → release brouillon |
| `itch.yml` (plus tard) | release publiée | `butler push` par canal |
