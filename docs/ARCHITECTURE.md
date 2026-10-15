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
content/cases/<id>/** ────────────┼─ content:build (zod, parseur Markdown, hachage, svgo, éditions full/démo, langues fr/en)
                                  │      → apps/game/src/generated/   (ignoré par git)
                                  │      → apps/site/src/generated/
packages/contract   types + schémas zod
packages/engine     moteur pur (applyAction, search, validate, settle…)
packages/map        caméra pure + MapView Svelte (port carte-mons)
packages/ui         tokens, art.css, polices, primitives Svelte
apps/game           Vite + Svelte 5 SPA (base './')
   ├─ build web  → dist/ → zip itch.io (complet + démo)
   └─ src-tauri  → Tauri 2 : Windows, macOS, Linux, Android (CI uniquement)
apps/site           SvelteKit adapter-static → nginx (Docker) → Coolify → arbre.cardormedia.com (FR + /en/)
apps/report         service de signalement Node 22 + node:sqlite → Coolify → arbre-api.cardormedia.com (§8)
```

Aucun serveur de jeu : tout est hors ligne. Le site est entièrement statique. Le seul service est
celui des signalements (§8) ; le jeu reste jouable sans lui (repli « Copier le rapport »).

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
| i18n | **Catalogues TypeScript typés**, aucune bibliothèque : `fr.ts` source, `en.ts` `satisfies Messages`, Proxy réactif ; contenu traduit par calques (§3.6) | Zéro dépendance, clés et signatures vérifiées par le typage, chunk anglais chargé à la demande | FormatJS, paraglide |
| Service de signalement | **Node 22 + `node:http` + `node:sqlite`**, zod embarqué au build (`vite build --ssr`, un seul `dist/server.js`), volume `/data` | Aucune dépendance au runtime, ~40 Mo de RAM ; comme arcade-cardor | Express/Fastify, base externe, formulaire tiers |
| Liens externes (Tauri) | `@tauri-apps/plugin-opener`, limité à `https://arbre.cardormedia.com/*` et `https://cardorinteractive.itch.io/*` | Plugin officiel, seule manière propre d'ouvrir le suivi ou le forum | URL à copier |

Dépendances d'exécution du jeu : `svelte`, `zod`, et sous Tauri seulement (import dynamique quand
`VITE_TARGET=tauri`) `@tauri-apps/api`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`,
`@tauri-apps/plugin-opener`.
Textes d'UI dans `apps/game/src/i18n/` : `fr.ts` (source, `type Messages = typeof fr`), `en.ts`
(`satisfies Messages`, chunk chargé seulement en anglais) et `index.svelte.ts` (langue courante en
`$state.raw`, `messages` en Proxy réactif ; aucune capture de `messages.*` au niveau d'un module).
`messages.fr.ts` et `panels/messages.ts` réexportent ce catalogue. Langue résolue avant l'écran
titre : profil, puis `?lang=`, puis `Platform.systemLocales()` (`fr-*` → français, sinon anglais, D6).

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
  order?: number; // rang d'affichage (menu, succès) ; tri (order ?? ∞, id)
}
// family.json (scenariste : vérité de la bible)
export interface Person {
  id: PersonId;
  given: string[];   // variantes acceptées, la première = canonique
  family: string[];  // nom de naissance, d'usage, graphies
  nicknames?: string[];
  occupation: OccupationId; portrait: PortraitId;
  altPortraits?: PortraitId[]; // autres âges du même visage, acceptés dans sa case
  born?: PartialDate; died?: PartialDate;
  parents?: [PersonId | null, PersonId | null]; unions?: PersonId[];
  bibleNotes?: string; // retiré au build
}
export interface Occupation { id: OccupationId; label: string }
export interface Portrait { id: PortraitId; file: string /* portraits/<id>.svg */; alt: string; caption?: string }
export interface Family { persons: Person[]; occupations: Occupation[]; portraits: Portrait[] }

// tree.json (level-designer)
// Identité déclarée d'une case revendiquée : fausse sur au moins un champ, jamais verrouillée.
export interface SlotClaim { given?: string; family?: string; portrait?: PortraitId; occupation?: OccupationId }
export interface TreeSlot {
  id: SlotId; person: PersonId; generation: number; column: number;
  prefilled?: boolean;      // connue d'emblée et établie (tutoriel), exclue des groupes
  claim?: SlotClaim;        // case revendiquée : pré-remplie, contestable, dans un groupe ;
                            // exclusive de prefilled et de revealedBy
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
  askedWhen?: OutcomeCondition; options: { id: string; label: string; availableWhen?: Condition;
    unavailableReason?: string /* ≤ 140 ; exige availableWhen : option grisée avec sa raison au lieu d'être masquée */ }[] /* ≥ 2 */ }
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
export interface SlotAnswer { given: string[]; family: string[]; portrait: string[] /* canonique puis altPortraits */; occupation: string } // hachages cyrb53(salt|slot|champ|normalize(v))
export interface CompiledDocument extends DocumentFrontmatter { id: DocumentId; body: Block[]; keywords: KeywordId[] }
export interface CompiledCase {
  format: 1; id: CaseId; edition: 'full' | 'demo'; locale: Locale;
  contentHash: string /* 8 hex, empreinte STRUCTURELLE : identique entre langues */; salt: string;
  meta: CaseMeta;
  documents: Record<DocumentId, CompiledDocument>;
  searchIndex: Record<string /* terme normalisé */, KeywordId>;
  keywords: Record<KeywordId, Omit<Keyword, 'terms'>>;
  slots: Record<SlotId, Omit<TreeSlot, 'person' | 'claim'> & {
    prefilledGuess?: SlotGuess; // avec prefilled : posée et verrouillée par newGame
    claimedGuess?: SlotGuess;   // avec claim : posée par newGame, jamais verrouillée ni reposée
    answer: SlotAnswer; parents: SlotId[]; unions: SlotId[] }>;
  groups: ValidationGroup[]; portraits: Record<PortraitId, Portrait & { svg: string }>; occupations: Record<OccupationId, Occupation>;
  places: Record<PlaceId, Place & Omit<CasePlace, 'place'>>;
  progression: Pick<Progression, 'start' | 'unlocks' | 'occupationsUnlock' | 'secrets'>;
  endings: Record<EndingId, { when: OutcomeCondition; priority: number; title: string;
    sections: { label: string | null; title: string | null; when?: OutcomeCondition; body: Block[] }[] }>;
  report: ReportQuestion[];
  hints: Hint[]; achievements: Achievement[];
  // illustrations SVG : écrites à part (generated/assets.<édition>.json), clé = chemin `illustrations/<file>`.
  // Dans le jeu, le plugin Vite `apps/game/vite/lazy-content.ts` découpe sans changer ce format :
  // l'affaire est un chunk chargé à « Nouvelle partie »/« Continuer », chaque illustration et chaque
  // portrait un chunk à la demande (`svg: ''` dans le cas compilé), la carte un chunk du panneau Carte.
  candidates: { given: string[]; family: string[] }; // noms proposables (lus dans les documents), pour la saisie par liste
}
export interface CaseCatalogEntry { id: CaseId; edition: Edition; locale: Locale; contentHash: string;
  meta: CaseMeta; achievements: Achievement[]; endings: Record<EndingId, { title: string }> } // catalogue par langue
```

**Langues** (`packages/contract/src/i18n.ts`, `docs/i18n/PLAN.md`) : une affaire est compilée une
fois par langue `source` ou `ready` et par édition. Le **sel** et `contentHash` sont calculés sur la
**structure** (sources FR hors `locales/` : ids, conditions, arbre), donc identiques d'une langue à
l'autre (D4) ; `answer` ne porte que des noms propres et des ids. `locale` est la seule donnée
propre à la langue (obligatoire dans `CompiledCase`), avec les champs traduisibles. Langues
compilées aujourd'hui : `fr` (source) et `en` (`ready` depuis la vague C1).

Arborescence générée (ignorée par git) :

```
apps/game/src/generated/
  cases.ts                          généré : edition, locales: Locale[], loadCatalog(loc), loadCase(loc, id), assetLoader(loc, caseId, key), loadWorldText(loc)
  catalog.<éd>.<loc>.json           CaseCatalogEntry[] triés (order, id)
  case.<éd>.<loc>.<caseId>.json     CompiledCase (SVG de portraits retirés par le plugin)
  assets.<éd>.json                  illustrations communes (affaire → clé → SVG)
  assets.<éd>.<loc>.json            surcharges de la langue seulement ({} en fr)
  world.json  world.<loc>.json      couches communes ; texte et couche `labels` surchargée par langue
  world.ts                          généré : `world` (monde de la langue source, typé)
apps/site/src/generated/            idem, édition demo
```

Chaque `case…json`, chaque catalogue et chaque surcharge devient **un chunk** ; le catalogue de l'UI
anglaise aussi, chargé seulement en anglais. Il n'y a plus d'autre format : l'ancien
`cases.<éd>.json` (FR, une édition entière) et le module de transition `cases.i18n.ts` ont été
retirés à la vague C1, et `content:build` supprime leurs restes éventuels.

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
    highlights: { doc: DocumentId; path: number[]; start: number; end: number; color: 1 | 2 | 3 | 4 | 5;
      lang?: Locale /* absent = 'fr' */ }[];
    notes: { id: string; target?: Pin; text: string /* ≤ 2000 */; at: number }[];
  };
  report: Record<string /* question */, string /* option */>;
  ending: EndingId | null;
}
export interface SaveSlotSummary { slot: SaveSlotId; caseId?: CaseId | null /* association par id, jamais par titre */;
  caseTitle: string; updatedAt: number; elapsedMs: number; mode: SaveState['mode']; progress: number }
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
  language?: 'system' | Locale; // facultatif : anciens profils valides ; absent = 'system'
}
export interface Profile { schemaVersion: 1; settings: Settings; achievements: Record<AchievementId, number>; completed: Record<CaseId, { bestTimedMs?: number; endings: EndingId[] }>;
  tutorial?: { done: boolean; seen: string[] }; // tutoriel en bulles : optionnel (anciens profils valides), seen ≤ 32 ids kebab-case
  reports?: ReportRef[] } // « Mes signalements », ≤ 20 (§8)
// Crans des « Notes de service » (E04) sans champ de plus : écrits dans `tutorial` au lancement.
// Complètes → done false, seen ∪ {returning} (repart de zéro si done) ; Nouveautés seulement →
// done false, seen ∪ 10 notes de base ; Aucune → done true. `done` devient vrai quand les notes
// requises par l'affaire (base + nouveautés dont la mécanique est dans les données) sont vues.
// Cran par défaut : Nouveautés si done, base toute vue, ou une fin vue (`completed`).
// Ids : base (welcome…help), `returning`, nouveautés génériques `claim`, `hearing`, `decision`
// (déclencheurs : `claimedGuess`, document `hearing: true`, question `choice`).
```

**Langue et partie** : une sauvegarde ne dépend pas de la langue (D4) ; elle se charge sur le compilé
de n'importe quelle langue avec le même résultat de `validate`. Changer de langue en cours de partie
remplace `content` (chargement de `case.<éd>.<loc>.<id>`) **sans toucher à `SaveState`**. Les
surlignages sont des positions dans le texte, donc propres à une langue (D5) : chacun porte `lang`
(absent = `fr`), n'est affiché que dans sa langue et conservé dans les autres, jamais retiré.

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
parseSave(raw, c): { ok: true; state; dropped: string[] } | { ok: false; error; code: ParseSaveErrorCode }
// code : 'tooLarge' | 'invalidJson' | 'notObject' | 'noVersion' | 'newerVersion' | 'migrationFailed' | 'corrupt' | 'otherCase'
// l'UI choisit son message par `code` (jamais par le texte d'`error`) ; facultatif dans le type jusqu'à A2
summarize(s, c): SaveSlotSummary
// sélecteurs
knownKeywords, availablePortraits, availableOccupations, availableNames, visiblePlaces, visibleSlots, progress, endingFor,
reportQuestions /* questions posées + options disponibles + réponse */, endingSections /* sections visibles d'une fin */,
slotStatus(slot, s, c): 'locked' | 'claimed' | 'filled' | 'empty',
claimedFields(slot, s, c): (keyof SlotGuess)[]            // champs encore égaux à la déclaration
```

**Case revendiquée** (détail : `docs/game/AFFAIRE-2.md` §1) : `newGame` pose
`tree[id] = claimedGuess` **sans verrou** ; la case se joue ensuite comme une autre (`setSlot`,
`clearSlot` permis) et entre dans son groupe comme toute case complète. Ses valeurs (nom, visage,
métier) sont disponibles d'emblée et le restent après retrait, comme celles des cases pré-remplies.
Aucun drapeau n'est sauvegardé : `slotStatus` rend `claimed` quand la case, non verrouillée, est
identique champ à champ à `claimedGuess` (`filled` si au moins un champ est rempli, `empty` sinon,
`locked` si établie) ; `claimedFields` liste les champs encore déclarés (guillemets à l'écran).
`parseSave` ne repose jamais une déclaration effacée (contrairement aux cases pré-remplies).
Un visage est juste s'il figure dans `answer.portrait` (canonique puis `altPortraits`).

**Validation par groupes** (détail : `docs/game/GAME_DESIGN.md`) : pour chaque groupe, on compte les
cases non verrouillées dont les quatre champs sont justes ; si ce nombre atteint
`min(threshold, cases restantes du groupe)`, ces cases se verrouillent ; sinon `validationFailed`,
sans détail. Une case n'est vérifiée que si ses quatre champs sont remplis. Le chargement d'une
partie n'évalue **aucun** groupe : l'évaluation ne suit qu'un changement de case (ou « Soumettre la
branche » en mode manuel) ; une évaluation en attente est faite avant la sauvegarde (`pagehide`,
passage en arrière-plan).

**Rapport final et fins à sections** : au dénouement, le jeu pose les questions de `report`
(celles dont `askedWhen` est vraie, options filtrées par `availableWhen` ; une option indisponible
qui porte `unavailableReason` reste dans `reportQuestions` avec cette raison, à montrer grisée) ; chaque réponse est une
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
content/locales.json                           LocalesConfig : { default: 'fr', locales: { fr: source, en: draft|ready } }
content/cases/<caseId>/locales/<loc>/          calques (champs traduisibles seuls, clés = ids FR, objets stricts)
  case.json family.json tree.json progression.json hints.json achievements.json   *Translation (i18n.ts)
  documents/<docId>.md                         frontmatter DocumentFrontmatterTranslation + corps traduit
  endings/<endingId>.md                        frontmatter `title`, mêmes étiquettes de section, même ordre
  illustrations/*.svg                          surcharges facultatives (mots courants dessinés)
content/world/locales/<loc>.json               WorldTranslation (titre de la carte, descriptions des lieux)
art/map/locales/<loc>/labels.svg               surcharge facultative de la couche `labels`
```

Un champ facultatif est exigé dans un calque si et seulement s'il est présent en FR. Tout le reste
(conditions, ids, `reveals`, `place`, `date`, `kind`, `hearing`) est hérité du FR (D2) : la dérive
structurelle est impossible par construction. Noms propres (personnes, lieux) jamais traduits (D3).

Markdown admis : paragraphes, `*em*`, `**strong**`, `~~barré~~`, `> citation`, listes, tableaux pipe, `## titres`,
`![alt](illustrations/x.svg "légende")`, `[[texte|keyword-id]]`, `::hand[…]`, `::stamp[…]`,
`::signature[…]`, `::redacted[6]`, `---`. Tout HTML brut est une erreur.

### 3.7 Règles de `npm run content:check`

1. **Schémas** zod stricts, clés inconnues refusées, id = nom de fichier, kebab-case, unicité.
   **Entre affaires** : ids de succès, ids et fichiers de portraits, `order` uniques sur tout le contenu.
2. **Références** toutes résolues (documents, mots-clés, lieux, portraits dont `altPortraits`, métiers,
   cases, groupes, secrets, fins, assets) ; `claim.portrait` et `claim.occupation` connus,
   `claim.given` / `claim.family` variantes (normalisées) d'au moins une `Person` ; une option du
   rapport avec `unavailableReason` a un `availableWhen`.
3. **Arbre** : personnes uniques par case ; groupes = partition des cases non pré-remplies (cases
   revendiquées comprises, `prefilled` exclues) ; seuil ≥ 3 ; `claim` exclusif de `prefilled` et de
   `revealedBy` ; une déclaration est **fausse sur au moins un champ** (juste sur ses 4 champs, autre
   âge et graphie comprises = erreur) ;
   liens familiaux cohérents (pas de cycle, ≤ 2 parents, parent né avant l'enfant).
4. **Conditions** : `not` interdit hors fins et succès ; pas d'auto-dépendance.
5. **Mots-clés** : termes uniques après normalisation ; au moins un résultat ; chaque mot-clé non
   `hiddenTerm` apparaît dans un texte accessible ; pas de chevauchement de liens.
6. **Solvabilité** (solveur) : tout document non `optional`, toute case, tout secret et toute fin
   atteignables ; pour chaque case hors tutoriel, le nom figure dans **au moins deux** documents
   atteignables avant son verrouillage, portrait et métier débloqués ; une fin au moins est vraie à
   100 %. Une case revendiquée part **vide** (la déclaration ne prouve rien), mais visages et métiers
   déclarés sont disponibles d'emblée, comme dans le moteur ; un visage vaut pour une case s'il est
   l'un de ceux de la personne (`portrait` ou `altPortraits`). Avertissements : visage juste d'une case
   accessible **seulement** par une déclaration ; nom déclaré lu dans aucune pièce de départ.
   Rapport : `npm run content:solve -- --report`.
7. **Markdown** : syntaxe admise seulement, images existantes, `alt` non vide, aucune URL externe.
8. **SVG** : interdits `<script>`, `on*`, `<foreignObject>`, `href` externes, couleurs en dur, `style=` ;
   seules les classes de `ART_CLASSES`, `none`, `currentColor`, `url(#…)` ; ids préfixés par fichier (couche `places` : aussi `place-<placeId>`, lu par le renderer) ;
   viewBox des couches conformes.
9. **Budgets gzip** après svgo : portrait ≤ 25 Ko, illustration ≤ 60 Ko, couche `base` ≤ 60 Ko, couches
   de carte ≤ 300 Ko au total, affaire compilée (texte) ≤ 600 Ko, DOM de la carte ≤ 6 000 nœuds.
10. **Démo** : solvable jusqu'à `demo.end`, aucun texte hors démo dans le bundle démo (canaris).
11. **Fuite** : aucun `bibleNotes` ni réponse en clair dans le compilé (la déclaration `claimedGuess`
    est en clair par nature) ; aucun portrait, autres âges compris, ne nomme sa personne ; autant de
    hachages de visage que de visages de la personne.
12. **Traductions** (pour chaque langue autre que la source : **erreurs** si `ready`, **avertissements**
    si `draft` ; une langue `draft` n'est pas compilée) :
    1. Parité des fichiers et des clés : chaque unité FR traduisible a son équivalent, aucun extra.
    2. Frontmatter traduit strict (`DocumentFrontmatterTranslation`).
    3. Par document : **ensemble des mots-clés liés après autolink identique au FR** ; mêmes assets de
       figure dans le même ordre. Nombre de `::redacted` et de `::stamp` différent : avertissement.
    4. Fins : mêmes étiquettes `[Sx]` dans le même ordre.
    5. Termes uniques après normalisation dans la langue. Tout terme FR égal à une variante
       `given`/`family` d'une `Person` ou au `name` d'un `Place` figure aussi dans les termes de la langue.
    6. **Projection structurelle du compilé de la langue égale à celle du FR**, par édition
       (`candidates` compris).
    7. Règles 1 à 11 rejouées **par langue** : solveur, canaris de la démo, budgets.
    8. Surcharges SVG : même `viewBox` et mêmes ids que la base ; règles 8 et 9.
    9. Avertissement si un paragraphe de plus de 8 mots est identique au FR (oubli de traduction).

    Commandes : `npm run content:i18n -- --case <id> [--only <glob>]` (code 1 en cas d'erreur sur le
    périmètre) et `npm run content:solve -- --locale en`. Budgets ajoutés : catalogue ≤ 20 Ko gz par
    langue ; chunk de l'UI anglaise ≤ 15 Ko gz ; module de démarrage + 4 Ko gz au plus.

`content:build` écrit les affaires triées par `(meta.order ?? ∞, id)` ; tri des listes par
`localeCompare(…, locale)` dans chaque langue.

## 4. Plateforme

```ts
interface SaveStore {
  list(): Promise<SaveSlotSummary[]>; load(slot: SaveSlotId): Promise<unknown | null>;
  save(slot: SaveSlotId, s: SaveState): Promise<void>; remove(slot: SaveSlotId): Promise<void>;
  exportFile(slot: SaveSlotId): Promise<void>; importFile(): Promise<unknown | null>;
  loadProfile(): Promise<unknown | null>; saveProfile(p: Profile): Promise<void>;
}
interface Platform { kind: 'web' | 'desktop' | 'android'; saves: SaveStore;
  setFullscreen?(on: boolean): Promise<void>; onBack(cb: () => boolean): () => void; quit?(): void;
  systemLocales(): readonly string[];               // navigator.languages ; facultatif dans le type jusqu'à A2
  openExternal?(url: string): Promise<boolean> }     // false si refusé ou indisponible
```

- **Langues du système** : `systemLocales()` rend `navigator.languages` (web et WebView Tauri) ;
  sert à résoudre `language: 'system'` (`resolveLanguage`, `packages/contract/src/i18n.ts`).
- **Liens externes** : `openExternal` importe dynamiquement `@tauri-apps/plugin-opener` sous Tauri,
  capability `opener:allow-open-url` limitée à `https://arbre.cardormedia.com/*` et
  `https://cardorinteractive.itch.io/*` ; sur le web, `window.open(url, '_blank', 'noopener')`.

- **Tauri** : `$APPDATA/saves/<slot>.json`, écriture atomique (`.tmp` + renommage) et `.bak` ; capability
  limitée à `$APPDATA/saves/**` ; `plugin-dialog` pour export/import.
- **Secours par affaire** (AFFAIRE-2 §2.3) : les emplacements `slot-1` à `slot-3` restent communs ; le
  secours `auto` existe une fois par affaire. Le jeu étend le contrat (`GameSaveStore`,
  `apps/game/src/platform/common.ts`) : `save('auto', s)` écrit le secours de `s.caseId` ;
  `load`/`remove`/`exportFile('auto', caseId?)` visent celui de `caseId` (sans lui : le plus récent) ;
  `list()` renvoie `GameSlotSummary` (+ `caseId`, null pour un emplacement manuel). Clés : web
  `save:auto:<affaire>` / `summary:auto:<affaire>`, Tauri `auto.<affaire>.json` /
  `auto.<affaire>.summary.json`. L'ancien secours commun (`save:auto`, `auto.json`) est rangé sous sa
  propre affaire au premier accès, sans perte (illisible : laissé tel quel).
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
- CSP Tauri `default-src 'self'`, aucun domaine distant, capabilities minimales (`fs` limité à
  `$APPDATA/saves/**`, `fs:allow-stat` pour vérifier la taille d'un import avant lecture).
- Build web/itch : CSP en `<meta>` (aucun script inline, `<style>` du splash autorisé par empreinte,
  `style-src-attr 'unsafe-inline'` pour les attributs posés par Svelte).
- CSP `connect-src` complétée par `https://arbre-api.cardormedia.com` (service de signalement, §8) :
  `<meta>` du build web, `/jouer/` et site (nginx), `tauri.conf.json`. `Referrer-Policy: no-referrer`
  sur `/suivi/` et `/en/suivi/` (le jeton de suivi est dans le fragment).
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
apps/game/src/i18n/**, apps/game/vite/**                                 frontend-jeu
apps/site/src/params/**, apps/site/src/lib/i18n/**                       frontend-site
apps/report/src/**, apps/report/test/**, apps/report/package.json (+ tsconfig, vite.config)   backend
apps/report/Dockerfile, apps/report/Dockerfile.dockerignore             devops
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
content/**/locales/<loc>/*.json, …/documents/**, …/endings/**, docs/i18n/**   scenariste ou traducteur (relecture level-designer : progression, aides, succès)
content/**/locales/<loc>/illustrations/**, art/map/locales/**     cartographe
content/locales.json                orchestrateur
tests/e2e/**                        qa-reviewer
```

## 7. CI/CD (détail : `docs/DEPLOYMENT.md`)

| Workflow | Déclencheur | Jobs |
|---|---|---|
| `ci.yml` | push / PR | check · build (web, zips itch complet et démo, site) · e2e (chromium + webkit + axe) · docker (site, `/healthz`) · rust-lint |
| `tauri.yml` | tag `v*` + manuel | matrice Linux (AppImage, deb) / Windows (NSIS) / macOS (universel, dmg) + Android (APK/AAB, signés si secrets présents) → release brouillon |
| `itch.yml` (plus tard) | release publiée | `butler push` par canal |

## 8. Service de signalement (`apps/report`)

Signaler un problème depuis le jeu ou le site, puis suivre son ticket sans compte. Contrat :
`packages/contract/src/report.ts` et `report-ref.ts` (partagés par le jeu, le site et le service).
Déploiement : app Coolify séparée **`arbre-api.cardormedia.com`**, Node 22, `node:http` +
`node:sqlite`, **zod seule dépendance d'exécution** (embarquée au build : `vite build --ssr` →
`dist/server.js`, pas de `node_modules` au runtime), volume `/data`, port 8090, `HEALTHCHECK` (D9).

```
POST   /v1/reports           ReportSubmission → 201 ReportReceipt | 400/413/429(Retry-After)/503 {error: ReportErrorCode}
GET    /v1/tickets/current   Authorization: Bearer <token> → 200 TicketView | 404 (inconnu ou expiré)
DELETE /v1/tickets/current   Bearer → 204 : contact effacé, corps du ticket GitHub remplacé, jeton invalidé
GET    /v1/known-issues?locale=fr|en → KnownIssue[] (Cache-Control public, max-age=300)
POST   /v1/github/webhook    X-Hub-Signature-256 (HMAC, timingSafeEqual) → 204
GET    /healthz              {ok, github: 'ok'|'degraded', pending: n, failed: n}
```

`ReportErrorCode` : `invalid` (400), `tooLarge` (413), `rateLimited` (429 + `Retry-After`),
`disabled` (503, `REPORTS_ENABLED=false`), `unavailable` (503). Toute erreur est un JSON
`{ error }`, jamais une trace. Pot de miel `website` non vide ou `elapsedMs < 3000` : réponse
neutre, rien n'est créé.

**Ticket** : numéro propre au service (`AA-0042`, préfixe `TICKET_PREFIX`), sans lien avec le
numéro du ticket GitHub. Jeton de suivi de 128 bits (22 caractères base64url), stocké **haché**
(SHA-256), jamais journalisé. Lien de suivi `followUrl` dans la langue du signalement (`locale`) :
`https://arbre.cardormedia.com/suivi/#<jeton>`, ou `…/en/suivi/#<jeton>` en anglais (fragment : ni
journaux ni Referer) (D10). Le jeu le reconstruit quand même (`followUrlFor`) : « Mes signalements »
ne garde que le jeton (`ReportRef`) et l'ouverture externe est limitée au site public. Le site
affiche et copie `followUrl` tel quel ; « Ouvrir le suivi » y reste un lien relatif (même origine). Le jeu garde `ReportRef` dans `Profile.reports` (≤ 20).

**Correspondance des statuts** :

| Ticket GitHub | Statut affiché |
|---|---|
| Ouvert, sans étiquette de statut | `received` |
| Étiquette `statut:confirmé` | `confirmed` |
| Étiquette `statut:en-cours`, ou ticket assigné | `in-progress` |
| Fermé `completed` avec un jalon `vX.Y.Z` | `fixed` + `fixedIn` = titre du jalon |
| Fermé `not_planned` | `closed` / `not-planned` |
| Étiquette `doublon` | `closed` / `duplicate` |
| Fermé sans jalon | `closed` / `resolved` |

**Réponses publiques** : commentaires dont la première ligne est `/public`, **et seulement si
`author_association` vaut OWNER, MEMBER ou COLLABORATOR** (défense en profondeur : seul un mainteneur
peut publier une réponse). Rendues en texte brut, 2 000 caractères au plus.

**Problèmes connus** : tickets étiquetés `public`. Titre FR = titre du ticket, que l'équipe relit
avant de poser l'étiquette. Titre anglais facultatif = commentaire d'un mainteneur commençant par
`/public-title-en`.

**Corps du ticket** : description dans un bloc de code à clôture plus longue que tout bloc présent
dans le texte (neutralise mentions, images et liens), diagnostics en JSON dans `<details>`. Jamais de
contact, de jeton ni d'IP. Étiquettes `signalement`, `source:jeu|site`, `cat:<catégorie>`, `langue:en`.
Dépôt cible : dépôt **privé** dédié `fs0ciety7000/arbre-aux-absents-signalements` (D12), configuré
par `GITHUB_REPO` ; les tickets ne sont jamais visibles du public.

**Synchronisation** : webhook (`issues`, `issue_comment`, `milestone`) ; rapprochement toutes les
30 min des tickets non fermés depuis plus de 30 jours (requêtes conditionnelles `If-None-Match`, une
réponse 304 ne consomme pas de quota) ; rafraîchissement paresseux à la lecture si la donnée a plus
de 10 min. Si GitHub est en panne, la soumission est **acceptée** quand même (`received`, file
`pending`, réessais avec attente croissante) : le joueur a toujours son numéro. Une erreur GitHub
**4xx permanente** (hors 401/403 : jeton ou quota, et hors 408/429 : passagères) fait **abandonner**
l'opération à la 8ᵉ tentative : la ligne est marquée en échec (`failed_at`, `failed_status`),
n'est plus retentée, apparaît dans `/healthz` (`failed`) et `admin.js pending`/`status` ; le ticket
reste lisible par le joueur (statut `received`) et `admin.js retry AA-0042` le remet dans la file.

**Limitation de débit** : en mémoire seulement. Clé = HMAC de `CF-Connecting-IP` avec un secret
aléatoire tiré en mémoire et renouvelé chaque jour ; jamais écrite ni journalisée. Plafonds :
5 signalements par heure et 20 par jour par clé, 60 par heure au total, 60 lectures de ticket par
minute. Corps limité à 64 Ko. Interrupteur `REPORTS_ENABLED`. Délais d'attente sur chaque appel
GitHub, concurrence bornée de la file `pending`.

**Schéma SQLite**, table `tickets` : `id`, `ticket` UNIQUE, `token_hash` UNIQUE (SHA-256),
`created_at`, `updated_at`, `source`, `category`, `locale`, `issue_number` NULL, `status`,
`fixed_in`, `closed_reason`, `closed_at`, `replies_json`, `contact` NULL, `pending_payload` NULL
(effacé dès la création du ticket GitHub), `etag`, `synced_at`, plus la file de reprise
(`pending_op` `create` ou `redact`, `attempts`, `next_attempt_at` ; délai doublé de 30 s à 6 h ;
`failed_at`, `failed_status` pour l'abandon, ajoutées au démarrage sur une base v1) et
les problèmes connus (`public`, `title`). `replies_json` garde des marqueurs
`{id, kind: reply | title-en, at, text}` pour appliquer les modifications de commentaires reçues par
webhook sans appel à l'API. Numéros AUTOINCREMENT, jamais réutilisés.

**Comportements** : `POST` répond 201 sans attendre GitHub (création en tâche de fond) ; le titre
du ticket GitHub ne contient aucun texte du joueur (`AA-0042 · bug (jeu)`, réécrit par l'équipe
avant l'étiquette `public`) ; erreurs hors contrat renvoyées en `{ error: 'invalid' }` avec le
statut HTTP adapté (400, 403, 404, 405, 401 pour une signature de webhook) ; pot de miel
(`website` rempli ou `elapsedMs < 3000`) → 201 avec un faux reçu plausible (numéro tiré parmi les
20 derniers attribués, rien de créé ni de réservé, jeton qui ne mène à rien). `/healthz` dit
`degraded` sans jeton ou après un échec GitHub.

**Conservation** (D13, tâche quotidienne) : contact effacé 30 jours après la clôture ; ticket
(empreinte du jeton, statut, réponses publiques) supprimé 12 mois après la clôture ; suppression
immédiate à la demande (`DELETE`). Aucune IP stockée ni journalisée.

**Accès de l'équipe au contact** : `node dist/admin.js contact AA-0042` depuis le terminal Coolify
(aussi `status`, `pending`, `retry`, `retention`).
Aucune route HTTP d'administration.

**CORS** : `ALLOWED_ORIGINS` = `https://arbre.cardormedia.com`, `tauri://localhost`,
`http://tauri.localhost`, `https://html-classic.itch.zone`.

**Configuration** (variables d'environnement Coolify, jamais dans le repo ; `.env.example`) :
`GITHUB_TOKEN` (fine-grained, un seul dépôt, Issues RW + Metadata R, expiration à surveiller :
`/healthz` passe en `degraded` sur 401), `GITHUB_REPO` (`fs0ciety7000/arbre-aux-absents-signalements`), `GITHUB_WEBHOOK_SECRET`, `ALLOWED_ORIGINS`,
`PUBLIC_SITE_URL`, `DATA_DIR=/data`, `REPORTS_ENABLED`, `TICKET_PREFIX=AA`. Côté builds du jeu et du
site : `VITE_REPORT_API=https://arbre-api.cardormedia.com` (public). Dev : `npm run dev:report`.
