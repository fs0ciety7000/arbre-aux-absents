# Plan : traduction anglaise (jeu + site) et signalement de problèmes avec suivi

Plan en lecture seule : je n'ai modifié aucun fichier. J'ai lu `CLAUDE.md`, `docs/WORKFLOW.md`, `docs/ARCHITECTURE.md` et `docs/ROADMAP.md`, puis le code concerné (content-tools, moteur, plugin `lazy-content`, catalogues de messages, site, nginx, Tauri). De `docs/DESIGN.md` (2 406 lignes), je n'ai lu que les passages utiles.

## 0. Constats qui orientent le plan

1. **Les réponses ne dépendent déjà pas de la langue.** `hashAnswer(salt, slot, champ, v)` porte sur les prénoms et les noms (des noms propres, qu'on ne traduit pas), sur l'**id** du portrait et sur l'**id** du métier, jamais sur son libellé (`compile.ts` l. 278-283). La validation recalcule les empreintes à partir de `SaveState.tree`. Une sauvegarde reste donc valide d'une langue à l'autre si **les ids et la structure sont identiques**. Le plan garantit cette identité par une règle de contrôle (§2, règle 12.6).
2. **Le sel change à chaque modification des sources.** `deriveSalt` utilise `sourceDigest`, qui couvre tous les fichiers de l'affaire. Il faut le calculer sur les sources **FR seules** (en excluant `locales/`), sinon les empreintes divergent entre langues. `contentHash` n'est comparé nulle part ; seul `Desk.svelte` l. 198 s'en sert pour afficher une cote. On le redéfinit comme une empreinte **structurelle**, identique entre langues.
3. **Trois comportements dépendent du texte français et casseraient en anglais :**
   - `case-folders.ts` (l. 14 et 42) associe les sauvegardes à une affaire par `caseTitle`. Il faut ajouter `caseId` à `SaveSlotSummary`.
   - `app.svelte.ts` l. 371 cherche `/plus récente/` dans le message d'erreur de `parseSave`. Il faut un code d'erreur.
   - `tutorial/steps.ts` `isHearing` cherche « audition » dans le titre. Il faut un drapeau structurel `hearing`.
4. **Les surlignages sont des positions de caractères** dans le texte (`path, start, end`). Ils dépendent donc de la langue : il faut étiqueter chacun avec sa langue.
5. **Chargement du contenu.** Aujourd'hui, un seul chunk contient toutes les affaires (`cases.<éd>.json`). Avec l'anglais, sa taille doublerait. Le plan découpe le contenu **par langue et par affaire**, plus un petit catalogue. Cela règle au passage l'item backlog « Perf L9 » (E04 ≈ 2,9 s).
6. **Texte dessiné dans les SVG.** 32 illustrations, 3 portraits et 2 couches de carte contiennent des `<text>`. Il s'agit surtout de noms propres et de dates. Une quinzaine porte des mots courants : lt-05 « Destinataire absent », ob-02, pb-01, ph-08, ph-16 « École de ski / POSTES », rg-11, rg-18, ex-02, ex-03 « négatif », cp-01, cp-02. Sur la carte, `labels.svg` contient le cartouche, l'échelle, « estuaire », « marais de… », « route de… ». Ces fichiers recevront des surcharges anglaises facultatives.
7. **Volume à traduire** : environ 84 900 mots de documents et 7 500 mots de fins, plus environ 175 Ko de JSON (267 mots-clés, 59 métiers, 66 portraits, aides, succès, rapport). Côté UI : `messages.fr.ts` (556 lignes), `panels/messages.ts` (367 lignes), les textes par défaut de `packages/ui`, et 7 pages du site (environ 3 400 lignes).
8. **Divers.**
   - Le domaine de production réel est `arbre.cardormedia.com` (`apps/site/src/lib/site.ts`, `docs/DEPLOYMENT.md`), pas `arbre.fs0ciety.org` comme l'indique CLAUDE.md.
   - Le dépôt est **public** : un ticket GitHub est visible de tous.
   - Le DEVLOG anglais garde le titre « L'Arbre aux absents » et l'orthographe britannique (« colour », « organised »).

## 1. Décisions proposées (à consigner dans ROADMAP › Décisions)

| # | Décision | Raison |
|---|---|---|
| D1 | Le FR reste la **source de vérité**, aux chemins actuels. Les traductions vont dans des **dossiers de langue** `content/cases/<id>/locales/en/…`, pas dans des fichiers voisins `<doc>.en.md`. | Aucun fichier FR déplacé. Les périmètres des agents restent disjoints (un dossier par lot). La règle « id = nom de fichier kebab » est conservée. Ajouter une langue revient à ajouter un dossier. |
| D2 | Les traductions JSON sont des **calques** qui ne contiennent que les champs traduisibles, indexés par id FR. Tout le reste (conditions, ids, `reveals`, `place`, `date`, `kind`) est **hérité** du FR. | La dérive structurelle est impossible par construction. |
| D3 | Noms propres (personnes, lieux, lieux de la carte) jamais traduits. Institutions et événements nommés (« Grande Exposition », « Office de Réinscription civile », « réseau Fougère ») tranchés **dans le glossaire**. **Anglais britannique.** Le titre du jeu reste « L'Arbre aux absents ». Les titres d'affaires sont traduits (« The Revenant of Hautcorvin », déjà employé dans le DEVLOG). | Cohérence avec le DEVLOG ; marque conservée. |
| D4 | Sel et `contentHash` calculés sur la **structure** (sources FR hors `locales/`). Ils sont identiques d'une langue à l'autre. | Sauvegardes et changement de langue en cours de partie sans migration. |
| D5 | `Highlight.lang` : un surlignage n'est affiché que dans sa langue et conservé dans l'autre. | Les positions dépendent du texte. |
| D6 | Langue `system` : `fr-*` donne le français, toute autre langue donne l'**anglais**. Le paramètre `?lang=en` sur `/jouer/` sert d'indice. **À valider par le propriétaire** (alternative : tout ce qui n'est pas `en-*` en français). | Un joueur germanophone lit plus probablement l'anglais. |
| D7 | Écran d'attente HTML **neutre** (logo, « CM Interactive », titre). Le message d'erreur sans JS est bilingue. Aucun script en ligne. | La CSP interdit les scripts en ligne ; le titre est identique dans les deux langues. |
| D8 | Site : préfixe `/en/` avec les **mêmes slugs** (`/en/le-monde/`), `hreflang` (fr, en, x-default vers fr), aucune redirection automatique. | Site statique, nginx sans logique, référencement propre. Slugs traduits possibles plus tard. |
| D9 | Service de signalement : app Coolify séparée **`arbre-api.cardormedia.com`**, Node 22, `node:http` + `node:sqlite`, **zod comme seule dépendance d'exécution** (embarquée au build), volume `/data`. | CORS nécessaire de toute façon (origines Tauri, iframe itch). Un sous-domaine à un seul niveau est couvert par le certificat Cloudflare. Un proxy nginx vers un conteneur Coolify au nom instable serait fragile. `node:sqlite` est déjà utilisé par arcade-cardor. |
| D10 | Numéro de ticket propre au service (`AA-0042`), sans lien avec le numéro du ticket GitHub. Lien de suivi `…/suivi/#<jeton>` (fragment). Jeton de 128 bits stocké **haché**. | Ni GitHub ni l'URL du ticket exposés ; le jeton n'apparaît ni dans les journaux ni dans le Referer. |
| D11 | `@tauri-apps/plugin-opener` ajouté, limité à `https://arbre.cardormedia.com/*` et `https://cardorinteractive.itch.io/*`. | Plugin officiel et léger, seule manière propre d'ouvrir un lien externe sous Tauri (suivi, forum itch). Alternative : afficher l'URL à copier (moins bonne expérience). |
| D12 | **Décidé par le propriétaire (15/10)** : les signalements vont dans un dépôt **privé** dédié `fs0ciety7000/arbre-aux-absents-signalements`, configuré par `GITHUB_REPO`. Le contact n'est jamais envoyé à GitHub. | La description libre peut contenir des données personnelles ; le dépôt du jeu est public. |
| D13 | Conservation : contact effacé 30 jours après la clôture ; ticket (empreinte du jeton, statut, réponses publiques) supprimé 12 mois après la clôture ; suppression immédiate à la demande (`DELETE`). Aucune IP stockée ni journalisée. | Minimisation. |

## 2. Contrat à écrire d'abord (orchestrateur, vague 0)

### 2.1 Nouveau `packages/contract/src/i18n.ts`

```ts
export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';
export type LanguageSetting = 'system' | Locale;          // LocaleSchema, LanguageSettingSchema (zod)

/** content/locales.json */
export interface LocalesConfig {
  default: 'fr';
  locales: Record<Locale, { label: string; status: 'source' | 'draft' | 'ready' }>;
} // draft : parité en avertissements, langue NON compilée ; ready : parité en erreurs, langue compilée

/** Calques content/cases/<id>/locales/<loc>/*.json : champs traduisibles seuls, clés = ids FR, strictObject.
 *  Un champ facultatif est exigé dans le calque ssi il est présent en FR. */
export interface CaseMetaTranslation { title: string; subtitle?: string; credits?: string[] }          // case.json
export interface FamilyTranslation {                                                                  // family.json
  occupations: Record<OccupationId, string>;
  portraits: Record<PortraitId, { alt: string; caption?: string }>;
}
export interface TreeTranslation { groups: Record<GroupId, string> }                                  // tree.json
export interface ProgressionTranslation {                                                             // progression.json
  keywords: Record<KeywordId, { label: string; terms: string[] }>;
  secrets: Record<SecretId, string>;
  report?: Record<string, { prompt: string; options: Record<string, { label: string; unavailableReason?: string }> }>;
}
export type HintsTranslation = Record<HintId, string>;                                                // hints.json
export type AchievementsTranslation = Record<AchievementId, { title: string; description: string }>; // achievements.json
/** locales/<loc>/documents/<id>.md : frontmatter réduit (strict), le reste hérité du FR. */
export interface DocumentFrontmatterTranslation { title: string; author?: string; archive?: string; illustration?: { alt: string } }
/** locales/<loc>/endings/<id>.md : `title` ; mêmes étiquettes de section, même ordre. */
/** content/world/locales/<loc>.json */
export interface WorldTranslation { map: { title: string; attribution?: string }; places: Record<PlaceId, { description?: string }> }

/** Catalogue d'affaires par langue (E04, Succès, Bonus, Emplacements), généré, chargé avant toute affaire. */
export interface CaseCatalogEntry {
  id: CaseId; edition: Edition; locale: Locale; contentHash: string;
  meta: CaseMeta; achievements: Achievement[]; endings: Record<EndingId, { title: string }>;
}
```

### 2.2 Modifications des types existants

```ts
// document.ts
DocumentFrontmatter { …; hearing?: boolean }   // pièce d'audition (déclencheur tutoriel), structurel, FR seulement
// compiled.ts
CompiledCase { …; locale: Locale }             // contentHash = empreinte STRUCTURELLE (identique entre langues)
// save.ts
Highlight { …; lang?: Locale }                 // absent = 'fr' ; affiché seulement dans sa langue, jamais retiré
SaveSlotSummary { …; caseId?: CaseId }         // facultatif pour les résumés déjà écrits ; l'UI associe par id
// engine-api.ts
type ParseSaveErrorCode = 'tooLarge' | 'invalidJson' | 'notObject' | 'noVersion' | 'newerVersion'
  | 'migrationFailed' | 'corrupt' | 'otherCase';
ParseSaveResult = … | { ok: false; error: string; code: ParseSaveErrorCode }
// settings.ts
Settings { …; language?: LanguageSetting }     // facultatif : anciens profils valides ; absent = 'system'
Profile { …; reports?: ReportRef[] }           // ≤ 20, « Mes signalements »
// platform.ts
Platform { …; systemLocales(): readonly string[]; openExternal?(url: string): Promise<boolean> }
```

### 2.3 Nouveau `packages/contract/src/report.ts`

Partagé par le jeu, le site et le service.

```ts
export const REPORT_CATEGORIES = ['bug', 'blocked', 'text', 'display', 'audio', 'controls', 'performance', 'other'] as const;
export type TicketStatus = 'received' | 'confirmed' | 'in-progress' | 'fixed' | 'closed';
export interface ReportDiagnostics {
  appVersion: string; edition: 'full' | 'demo'; platform: 'web' | 'desktop' | 'android' | 'site';
  os?: string /* famille grossière */; locale: Locale; caseId?: CaseId; contentHash?: string;
  viewport: { w: number; h: number; dpr: number }; settings?: Partial<Settings>;
  save?: unknown /* anonymisée : sans notes.text ni searchLog.query ; JSON ≤ 48 Ko */;
}
export interface ReportSubmission {
  source: 'game' | 'site'; category: (typeof REPORT_CATEGORIES)[number];
  description: string /* 20..4000 */; contact?: string /* ≤ 200, jamais publié */;
  locale: Locale; diagnostics: ReportDiagnostics;
  website: string /* pot de miel : doit être vide */; elapsedMs: number /* ≥ 3000 */;
}
export interface ReportReceipt { ticket: string /* AA-0042 */; token: string /* 22 car. base64url */; followUrl: string }
export interface TicketView {
  ticket: string; status: TicketStatus; fixedIn?: string;
  closedReason?: 'resolved' | 'duplicate' | 'not-planned';
  category: ReportReceipt['ticket'] extends string ? (typeof REPORT_CATEGORIES)[number] : never;
  createdAt: number; updatedAt: number; replies: { at: number; text: string }[];
}
export interface KnownIssue { ticket: string; title: string; status: TicketStatus; fixedIn?: string; updatedAt: number }
export interface ReportRef { ticket: string; token: string; createdAt: number; summary: string /* ≤ 80 */ }
export type ReportErrorCode = 'invalid' | 'tooLarge' | 'rateLimited' | 'disabled' | 'unavailable';
```

(Simplifier `category` en `(typeof REPORT_CATEGORIES)[number]` à l'écriture.)

### 2.4 Sections de `docs/ARCHITECTURE.md` (texte à écrire)

- **§2 Stack**, nouvelles lignes :
  - i18n : catalogues TypeScript typés, aucune bibliothèque (FormatJS et paraglide écartés).
  - Service de signalement : Node 22 + `node:sqlite`, zod embarqué.
  - `plugin-opener`.
  - Remplacer la phrase « prépare les traductions » par la description de `apps/game/src/i18n/`.
- **§3.3 Contenu compilé.** Ajouter `locale` et la définition structurelle de `contentHash`, puis la nouvelle arborescence générée :

  ```
  apps/game/src/generated/
    cases.ts                          généré : edition, locales: Locale[], loadCatalog(loc), loadCase(loc, id), assetLoader(loc, caseId, key)
    catalog.<éd>.<loc>.json           CaseCatalogEntry[] triés (order, id)
    case.<éd>.<loc>.<caseId>.json     CompiledCase (SVG de portraits retirés par le plugin)
    assets.<éd>.json                  illustrations communes (affaire → clé → SVG)
    assets.<éd>.<loc>.json            surcharges de la langue seulement ({} en fr)
    world.json  world.<loc>.json      couches communes ; texte et couche `labels` surchargée par langue
  apps/site/src/generated/            idem, édition demo
  ```

  Chaque `case…json`, chaque catalogue et chaque surcharge devient **un chunk**. Le catalogue anglais de l'UI est un chunk chargé seulement en anglais.
- **§3.6 Fichiers.** Ajouter `content/locales.json`, `content/cases/<id>/locales/<loc>/{case,family,tree,progression,hints,achievements}.json`, `…/documents/*.md`, `…/endings/*.md`, `…/illustrations/*.svg` (facultatif), `content/world/locales/<loc>.json` et `art/map/locales/<loc>/labels.svg` (facultatif).
- **§3.7, nouvelle règle 12 « Traductions »** (erreurs si `ready`, avertissements si `draft`) :
  1. Parité des fichiers et des clés (chaque unité FR traduisible a son équivalent, aucun extra).
  2. Frontmatter traduit strict (`DocumentFrontmatterTranslation`).
  3. Par document : **ensemble des mots-clés liés après autolink identique au FR** ; mêmes assets de figure dans le même ordre. Nombre de `::redacted` et de `::stamp` : avertissement.
  4. Fins : mêmes étiquettes `[Sx]` dans le même ordre.
  5. Termes uniques après normalisation dans la langue. Tout terme FR égal à une variante `given`/`family` d'une `Person` ou au `name` d'un `Place` figure aussi dans les termes anglais.
  6. **Projection structurelle du compilé EN égale à celle du FR**, par édition. `candidates` est inclus.
  7. Règles 1 à 11 rejouées **par langue** : solveur, canaris de la démo, budgets.
  8. Surcharges SVG : même `viewBox` et mêmes ids que la base ; règles 8 et 9.
  9. Avertissement si un paragraphe de plus de 8 mots est identique au FR (oubli de traduction).

  Nouvelles commandes : `npm run content:i18n -- --case <id> [--only <glob>]`, qui sort en code 1 en cas d'erreur sur le périmètre, et `content:solve -- --locale en`. Budgets ajoutés : catalogue ≤ 20 Ko gz par langue ; chunk de l'UI anglaise ≤ 15 Ko gz ; module de démarrage + 4 Ko gz au plus.
- **§3.4.** Préciser D4 et D5, et que le changement de langue en cours de partie remplace `content` sans toucher à `SaveState`.
- **§4.** `systemLocales`, `openExternal`, capability `opener:allow-open-url` limitée.
- **§5 Sécurité.** CSP `connect-src` complétée par `https://arbre-api.cardormedia.com` (meta web, `/jouer/` nginx, site, `tauri.conf.json`).
- **Nouveau §8 « Service de signalement »** :

  ```
  POST   /v1/reports           ReportSubmission → 201 ReportReceipt | 400/413/429(Retry-After)/503 {error: ReportErrorCode}
  GET    /v1/tickets/current   Authorization: Bearer <token> → 200 TicketView | 404 (inconnu ou expiré)
  DELETE /v1/tickets/current   Bearer → 204 : contact effacé, corps du ticket GitHub remplacé, jeton invalidé
  GET    /v1/known-issues?locale=fr|en → KnownIssue[] (Cache-Control public, max-age=300)
  POST   /v1/github/webhook    X-Hub-Signature-256 (HMAC, timingSafeEqual) → 204
  GET    /healthz              {ok, github: 'ok'|'degraded', pending: n}
  ```

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

  **Réponses publiques** : commentaires dont la première ligne est `/public`, **et seulement si `author_association` vaut OWNER, MEMBER ou COLLABORATOR** (sur un dépôt public, n'importe qui pourrait écrire le marqueur). Rendues en texte brut, 2 000 caractères au plus.

  **Problèmes connus** : tickets étiquetés `public`. Titre FR = titre du ticket, que l'équipe relit avant de poser l'étiquette. Titre anglais facultatif = commentaire d'un mainteneur commençant par `/public-title-en`.

  **Corps du ticket** : description dans un bloc de code à clôture plus longue que tout bloc présent dans le texte (neutralise mentions, images et liens), diagnostics en JSON dans `<details>`. Jamais de contact, de jeton ni d'IP. Étiquettes `signalement`, `source:jeu|site`, `cat:<catégorie>`, `langue:en`.

  **Synchronisation** : webhook (`issues`, `issue_comment`, `milestone`), rapprochement toutes les 30 min des tickets non fermés depuis plus de 30 jours (requêtes conditionnelles `If-None-Match`, une réponse 304 ne consomme pas de quota), rafraîchissement paresseux à la lecture si la donnée a plus de 10 min. Si GitHub est en panne, la soumission est **acceptée** quand même (`received`, file `pending`, réessais avec attente croissante) ; le joueur a toujours son numéro.

  **Limitation de débit** : en mémoire seulement. La clé est un HMAC de `CF-Connecting-IP` avec un secret aléatoire tiré en mémoire et renouvelé chaque jour ; elle n'est jamais écrite ni journalisée. Plafonds : 5 signalements par heure et 20 par jour par clé, 60 par heure au total, 60 lectures de ticket par minute. Corps limité à 64 Ko. Interrupteur `REPORTS_ENABLED`.

  **Schéma SQLite**, table `tickets` : `id`, `ticket` UNIQUE, `token_hash` UNIQUE (SHA-256), `created_at`, `updated_at`, `source`, `category`, `locale`, `issue_number` NULL, `status`, `fixed_in`, `closed_reason`, `closed_at`, `replies_json`, `contact` NULL, `pending_payload` NULL (effacé dès la création du ticket GitHub), `etag`, `synced_at`. Une tâche quotidienne applique la conservation D13.

  **Accès de l'équipe au contact** : `node dist/admin.js contact AA-0042` depuis le terminal Coolify. Aucune route HTTP d'administration.

  **CORS** : `ALLOWED_ORIGINS` = `https://arbre.cardormedia.com`, `tauri://localhost`, `http://tauri.localhost`, `https://html-classic.itch.zone`.
- **§6 Arborescence** (et tableau de `WORKFLOW.md`) :
  - `apps/report/src/**`, `test/**`, `package.json` : backend.
  - `apps/report/Dockerfile`, `Dockerfile.dockerignore` : devops.
  - `apps/game/src/i18n/**` et `apps/game/vite/**` : frontend-jeu.
  - `apps/site/src/params/**` et `src/lib/i18n/**` : frontend-site.
  - `content/**/locales/<loc>/*.json|documents|endings` et `docs/i18n/**` : scenariste (traduction ; relecture level-designer pour progression, aides et succès).
  - `content/**/locales/<loc>/illustrations/**` et `art/map/locales/**` : cartographe.

### 2.5 Autres changements de la vague 0 (orchestrateur)

- `content/locales.json` avec `{fr: source, en: draft}`.
- Racine `package.json` : scripts `content:i18n` et `dev:report`, workspace `apps/*` (déjà présent).
- `vitest.config.ts` : inclure `apps/report/test/**/*.test.ts` dans le projet `node`.
- `.env.example` : bloc « Service de signalement (Coolify, jamais dans le repo) » avec `GITHUB_TOKEN` (fine-grained, un seul dépôt, Issues RW + Metadata R), `GITHUB_REPO`, `GITHUB_WEBHOOK_SECRET`, `ALLOWED_ORIGINS`, `PUBLIC_SITE_URL`, `DATA_DIR=/data`, `REPORTS_ENABLED`, `TICKET_PREFIX=AA`. Côté build : `VITE_REPORT_API=https://arbre-api.cardormedia.com` (public, pas un secret).
- ROADMAP : ajouter D1 à D13 et les lots ci-dessous.
- Facultatif mais utile : créer l'agent `.claude/agents/traducteur.md` (besoin récurrent, chaque nouvelle affaire). Sinon, des instances `scenariste` avec le brief de traduction.

## 3. Lots et ordre

**Point d'attention.** `CompiledCase.locale` est obligatoire : `npm run check` n'est vert qu'une fois A1 **et** A2 intégrés (porte G1). Avant cela, chaque lot se vérifie sur son propre périmètre.

### Vague A (parallèle, après la vague 0)

**A1 · backend · i18n du contenu**
- Fichiers : `packages/content-tools/**` (dont `fixtures/**` avec une mini-traduction anglaise), `scripts/content-build.ts`, `scripts/content-check.ts`, `scripts/content-solve.ts`, `scripts/content-i18n.ts` (nouveau).
- Contrat : §2.1, §2.2, règle 12, arborescence générée.
- Travail :
  - Chargement des calques et de `locales.json` (le loader ne doit plus avertir pour `locales/`).
  - Fusion FR + calque, compilation par langue et par édition.
  - Sel et `contentHash` structurels, passage de `hearing`, tri `localeCompare(…, locale)`.
  - Projection structurelle et règle 12, solveur par langue.
  - Nouvel écrivain du dossier généré (catalogues, chunks par affaire, surcharges d'assets, monde par langue). Il émet **aussi** l'ancien `cases.ts` / `cases.<éd>.json` (FR) jusqu'à C1, pour que jeu et site continuent de compiler (retiré à C1).
- Critères :
  1. Avec `en: draft` et aucun fichier anglais, `content:check` est vert et liste les manques en avertissement.
  2. La fixture anglaise passe la parité ; une rupture volontaire (mot-clé manquant, figure déplacée, terme de nom absent, case différente) produit une erreur testée.
  3. Sel et `answer` identiques FR/EN.
  4. Canaris de la démo par langue.
- Vérification : `npx vitest run packages/content-tools`, `npm run typecheck -w @arbre/content-tools`, `npm run content:check`, `npm run content:i18n -- --case succession-varenque`.

**A2 · backend · moteur et plateforme**
- Fichiers : `packages/engine/**` (fixtures comprises), `apps/game/src/platform/**`.
- Travail : `code` de `parseSave` ; `lang` du surlignage accepté et conservé ; `summarize` renseigne `caseId` ; `locale` dans la fixture ; `systemLocales()` (`navigator.languages`) ; `openExternal` (import dynamique de `plugin-opener` sous Tauri, `window.open(…, 'noopener')` sur le web).
- Critères : tests sur les codes d'erreur, l'aller-retour d'une sauvegarde avec `lang`, et une sauvegarde chargée sur le compilé de l'autre langue (même résultat de `validate`).
- Vérification : `npx vitest run packages/engine apps/game/src/platform`.

**A3 · design-lead**
- Fichiers : `docs/DESIGN.md`, `packages/ui/**`, `apps/site/src/routes/design/**`.
- Travail :
  - `packages/ui/src/i18n.ts` : `UiStrings`, `uiFr`, `uiEn`, contexte `setUiStrings` / `getUiStrings`. Les valeurs par défaut des primitives (Dialog, Panel, Toast, Combobox, ClaimTag, DecisionCard, CaseFolder, Loader, SkipLink, Card « Épinglé »…) viennent du contexte.
  - Primitives `LanguageSwitch` (écran titre, en-tête du site) et `TicketStatus` (frise de tampons Reçu → Confirmé → En cours → Corrigé vX → Classé).
  - Sections DESIGN : écran « Signaler un problème », « Mes signalements », aperçu des diagnostics, typographie anglaise (étiquettes Dymo, capitales, longueurs).
- Vérification : `npm run check -w @arbre/ui` (contraste compris), `npm run typecheck`.

**A4 · backend · service de signalement**
- Fichiers : `apps/report/package.json`, `apps/report/tsconfig.json`, `apps/report/vite.config.ts`, `apps/report/src/{server,config,db,github,status,render,ratelimit,cors,webhook,retention,admin}.ts`, `apps/report/test/**`.
- Travail : build `vite build --ssr` vers un seul fichier `dist/server.js`, zod embarqué, pas de `node_modules` au runtime. `fetch` injectable pour un faux GitHub.
- Critères (tests) : validation et limites (400, 413) ; pot de miel ; limitation de débit sans IP en mémoire claire ; CORS autorisé, refusé et requête préalable ; échappement Markdown (mentions, images, clôtures) ; table des statuts ; HMAC valide et invalide ; filtre `author_association` ; file `pending` puis réessai ; jeton jamais stocké en clair ; `DELETE` ; conservation (horloge simulée) ; cache des problèmes connus. Le serveur tourne en test sur un port éphémère avec SQLite `:memory:`.
- Vérification : `npx vitest run apps/report`, `npm run build -w @arbre/report`, `node --disable-warning=ExperimentalWarning apps/report/dist/server.js` puis `curl /healthz`.

**A5 · devops**
- Fichiers : `apps/report/Dockerfile`, `apps/report/Dockerfile.dockerignore`, `nginx.conf`, `apps/game/src-tauri/**`, `apps/game/package.json` (dépendance `@tauri-apps/plugin-opener`), `.github/workflows/ci.yml`, `docs/DEPLOYMENT.md`, `scripts/report-labels.sh` (nouveau, crée les étiquettes avec `gh`), `scripts/docker-smoke.sh`.
- Travail :
  - Image `node:22` épinglée, utilisateur non root, `VOLUME /data`, port 8090, `HEALTHCHECK`. Le `.dockerignore` racine (liste blanche) exclut `apps/report` : d'où `Dockerfile.dockerignore`.
  - CSP `connect-src` dans nginx (site et `/jouer/`) et dans Tauri.
  - nginx : `error_page 404 /en/404.html` sous `/en/` ; `Referrer-Policy: no-referrer` sur `/suivi/` et `/en/suivi/`.
  - Tauri : opener (`Cargo.toml`, `lib.rs`, capability limitée).
  - CI : job docker du service.
- Vérification : `docker build -f apps/report/Dockerfile .`, smoke `/healthz`, `nginx -t`, `cargo clippy` en CI.

**T0 · scenariste · glossaire**
- Fichiers : `docs/i18n/en/GLOSSAIRE.md`, `content/world/locales/en.json`.
- Contenu du glossaire :
  - Ton et registre, anglais britannique.
  - Typographie : guillemets “…”, dates « 17 April 1923 », M./Mme (trancher), écriture inclusive vers un neutre.
  - Institutions, événements nommés, types de pièces, tampons récurrents.
  - Vocabulaire de l'UI : Catalogue, Archives, Établi, Déclaré, Visé, Secours…
  - Règle des noms propres.
- Vérification : `npm run content:i18n -- --only world`.

### Vague A' (après T0, en parallèle)

**T0-V et T0-H · scenariste · terminologie par affaire**
- Fichiers : `content/cases/<id>/locales/en/{progression,family,tree}.json` et `docs/i18n/en/<id>.md` (table id → libellé et termes, notes sur `hiddenTerm`).
- Ce que ces lots fixent : les **termes de recherche**, les métiers, les groupes, les secrets, le rapport et les textes alternatifs des portraits. Les lots de documents s'y conforment ensuite.
- Vérification : `npm run content:i18n -- --case <id> --only '{progression,family,tree}.json'`.

### Vague B

Ces lots dépendent du code de la vague A ; B1 et B3 tournent en parallèle, comme les lots T1 et T2.

**B1 · frontend-jeu · i18n de l'UI**
- Fichiers :
  - `apps/game/src/i18n/{fr.ts,en.ts,index.svelte.ts}`.
  - `messages.fr.ts` et `panels/messages.ts` réduits à des réexportations : aucune modification des 42 imports.
  - `lib/game/{cases,app.svelte,case-folders,format}.ts`, `boot.ts`, `main.ts`, `index.html`, `vite/{lazy-content,splash}.ts`.
  - `screens/**`, `panels/**`, `shell/**`, `tutorial/**`.
- Contrat des catalogues :
  - `fr.ts` exporte `fr` sans `as const` ; `type Messages = typeof fr`.
  - `en.ts` est `export const en = {…} satisfies Messages` : clés manquantes ou en trop et signatures de fonctions sont vérifiées par le typage. Un test vérifie aussi la parité des clés à l'exécution.
  - `messages` est un Proxy qui lit une langue `$state.raw`, donc réactif sans réécrire les composants. Règle testée : aucune capture de `messages.*` au niveau du module (les constantes `KIND_LABELS`… deviennent des accesseurs).
  - `en.ts` n'est chargé que si la langue est l'anglais.
- Critères :
  1. Langue résolue avant l'écran titre (profil, puis `?lang`, puis `systemLocales`) ; `<html lang>` à jour.
  2. Sélecteur dans Options et sur l'écran titre.
  3. **Changement de langue en partie** : chargement de `case.<éd>.en.<id>`, remplacement de `content`, état intact, Lecteur rerendu.
  4. Surlignages filtrés par `lang`.
  5. `Intl` et `localeCompare` sur la langue courante.
  6. `isHearing` lit `doc.hearing`.
  7. Sauvegardes associées par `caseId`.
  8. Message selon `code` de `parseSave`.
  9. Écran d'attente neutre.
  10. Budgets du §2.4 et premier affichage inchangé.
- Vérification : `npm run check`, `npm run build`, e2e existants.

**B3 · frontend-site · i18n du site**
- Fichiers :
  - `apps/site/src/**` hors `routes/design`.
  - Routes déplacées sous `routes/[[lang=lang]]/…` ; `params/lang.ts`.
  - `lib/i18n/{fr,en,index}.ts`, même typage `satisfies`.
  - `app.html` (`lang="%lang%"`), `hooks.server.ts` (remplacement de `%lang%`, ids de routes de `HYDRATED`).
  - `Seo.svelte` : `hreflang`, `og:locale` et `og:locale:alternate`, JSON-LD `inLanguage`.
  - `sitemap.xml` avec `xhtml:link`, sélecteur de langue dans l'en-tête, liens `/jouer/?lang=en`.
  - Contenu généré de démo et monde par langue.
- Vérification : `npm run build -w @arbre/site`, test qui vérifie que chaque page FR a sa page `/en/` et que tous les `hreflang` répondent en 200.

**T1 · scenariste · traduction des documents**

Onze lots, chacun limité à `content/cases/<id>/locales/en/<chemins du lot>` :

| Lot | Contenu | Volume |
|---|---|---|
| V1 | `documents/ph-*` | 10,0 k mots |
| V2 | `documents/pr-*` | 10,1 k |
| V3 | `documents/rg-*`, `rp-*` | 9,3 k |
| V4 | `documents/lt-*`, `of-*`, `pb-*` | 9,2 k |
| V5 | `documents/{an,cp,ct,dv,ep}-*` + `endings/*` | 9,8 k |
| V6 | `hints.json`, `achievements.json`, `case.json` | |
| H1 | `documents/pv-*`, `ph-*` | 11,9 k |
| H2 | `documents/rg-*`, `tg-*`, `pb-*`, `ex-*` | 9,5 k |
| H3 | `documents/lt-*`, `of-*`, `ob-*` | 8,9 k |
| H4 | `documents/pr-*`, `rp-*`, `{an,cp,ct,dv,ep}-*` | 10,1 k |
| H5 | `endings/*`, `hints.json`, `achievements.json`, `case.json` | |

- Brief commun : glossaire et table de l'affaire ; liens `[[…|id]]` conservés ; même ordre des figures ; `::hand` gardé (Caveat couvre l'anglais) ; aucun HTML.
- Vérification : `npm run content:i18n -- --case <id> --only '<glob du lot>'` à 0 erreur.

**T2 · cartographe · surcharges SVG**
- Fichiers : `content/cases/*/locales/en/illustrations/*.svg` (seulement ceux qui portent des mots courants, liste du §0.6) et `art/map/locales/en/labels.svg` (cartouche, échelle, noms communs selon le glossaire).
- Vérification : `npm run content:i18n -- --only 'illustrations/**'`, règles 8 et 9.

### Vague B' (après B1 et B3)

**B2 · frontend-jeu · signalement**
- Fichiers : `screens/{Report,MyReports,TicketView}.svelte`, `lib/report/{client,diagnostics,anonymise}.ts`, sections `report` de `i18n/{fr,en}.ts`, entrées dans Title, Pause, HelpPanel et ErrorScreen.
- Critères :
  - Aperçu exact de ce qui est envoyé ; sauvegarde jointe seulement sur case cochée et anonymisée.
  - Reçu affiché avec numéro et lien ; référence ajoutée à `Profile.reports`.
  - Statut consultable dans le jeu ; « Ouvrir sur le site » et « Supprimer mon signalement ».
  - Hors ligne ou en échec (503, 429) : « Copier le rapport » et « Forum itch.io ».
  - Délai d'attente 10 s.

**B4 · frontend-site · pages de signalement**
- Fichiers : `routes/[[lang=lang]]/{signaler,suivi,problemes-connus,confidentialite}/**`, `lib/report/**`.
- Travail : pages hydratées avec repli `<noscript>` ; `suivi` lit le fragment, appelle l'API avec un en-tête `Bearer` et efface le fragment de l'historique ; réponses rendues en texte seulement.

### Vague C (intégration)

- **C1 · orchestrateur + backend** : passer `en` à `ready` ; retirer l'ancien format généré (backend) ; `npm run check` et `npm run build` ; zips itch (complet et démo, avec l'anglais) ; vérifier les budgets.
  - **Fait.** `en: ready` ; ancien format retiré (`legacy`, `--no-legacy`, `cases.<éd>.json`, `cases.i18n.ts`) : le module généré est `cases.ts`, `content:build` supprime les restes ; `CompiledCase.locale` obligatoire. `npm run check` vert (règle 12 en erreurs ; avertissements restants : paragraphes ostriens voulus de lt-02 et rg-02, pas de démo pour Hautcorvin). Solveur anglais : 118 et 98 documents, 30 et 28 cases, toutes les fins (6 et 4). `npm run build` et `npm run package:itch` (web 4 461 Ko, démo 2 209 Ko, l'anglais compris, aucun texte hors démo dans la démo). e2e jeu et site : 104 réussis, 4 ignorés (mesures de perf, `E2E_PERF=1`).
  - Budgets mesurés (gzip -9) : catalogue 4,8 Ko (en) et 4,7 Ko (fr) en édition complète, 1,0 Ko en démo (≤ 20 Ko) ; UI anglaise `en-*.js` 11,2 Ko (≤ 15 Ko). **Premier affichage hors budget** : JS préchargé 166,0 Ko contre 157,8 Ko avant la traduction (`fa165db`), soit + 8,2 Ko pour + 4 Ko permis (+ 5,5 Ko avant B2, + 2,7 Ko avec le signalement en jeu) ; C1 n'y change rien (166,0 Ko avant et après). À traiter (backlog perf).
- **C2 · level-designer** : relecture de la cohérence de la déduction en anglais (`hiddenTerm` « fougère sans date », aides de niveau 3, cases à risque C17, C19, C21, C25) ; `npm run content:solve -- --locale en --report`.
- **C3 · qa-reviewer** (`tests/e2e/**`) : projet Playwright `en-GB` :
  - détection de la langue, bascule sur l'écran titre ;
  - bascule en partie qui conserve l'arbre, et surlignages propres à chaque langue ;
  - canaris de la démo anglaise ;
  - axe AA et 390 px sur `/en/*`, `hreflang` ;
  - signalement avec API simulée (`page.route`) : succès, 429, hors ligne, suivi, suppression ;
  - aucune violation CSP, LCP du site et du jeu.
- **C4 · devops, déploiement** :
  - DNS `arbre-api` (proxied) ; app Coolify, volume `/data`, variables d'environnement.
  - Jeton fine-grained : **rappel d'expiration** à noter.
  - Webhook GitHub (secret), `scripts/report-labels.sh`, jalons `vX.Y.Z`.
  - Déployer le service **avant** les builds de jeu qui pointent vers lui ; le repli hors ligne couvre l'intervalle.

## 4. Portes de vérification

| Porte | Moment | Condition |
|---|---|---|
| G0 | Après la vague 0 | `npm run typecheck -w @arbre/contract`, schémas JSON régénérés (`npm run schemas:json`). |
| G1 | Après A1 et A2 | `npm run check` vert (en `draft`), `npm run build`. Une partie FR chargée sur le compilé de la fixture anglaise donne le même `validate`. |
| G2 | Après A' | Terminologie complète : `content:i18n --only '{progression,family,tree}.json'` sans erreur pour les deux affaires. |
| G3 | Fin de chaque lot T1 et T2 | 0 erreur sur son glob. |
| G4 | Fin de B1 et B3 | `npm run check` et `npm run build` ; budgets ; e2e FR inchangés et verts. |
| G5 | Après C1 | `en: ready`, `npm run check` vert avec la règle 12 en erreurs, solveur anglais vert (118 et 98 documents, 30 et 28 cases, toutes les fins), canaris de la démo anglaise. |
| G6 | Après C3 | e2e complets, revue `qa-reviewer` sans point bloquant, `docker build` du site et du service avec `/healthz` à 200. |

## 5. Risques

- **Sécurité**
  - Dépôt du jeu public : signalements dans un dépôt privé dédié (D12).
  - Marqueur de réponse publique détournable : filtré par `author_association`.
  - Injection Markdown dans les tickets : bloc de code.
  - Fuite du jeton : fragment, `no-referrer`, stockage haché.
  - Jeton GitHub : un seul dépôt, expiration à surveiller ; `/healthz` passe en `degraded` sur une erreur 401.
  - Spam qui inonde les notifications GitHub : plafond global et `REPORTS_ENABLED`.
- **RGPD** : Cloudflare voit les IP, à mentionner sur `/confidentialite/`. Le contact est stocké seulement dans SQLite. Suppression à la demande.
- **Jouabilité en anglais** : les termes cachés et les aides de niveau 3 sont de la déduction, que le solveur ne vérifie pas. D'où la relecture C2.
- **Performance**
  - Le découpage par affaire **améliore** E04.
  - L'UI anglaise est chargée à la demande.
  - Zip de la démo : environ + 0,25 Mo.
  - Site : pages doublées (image Docker d'environ + 2 Mo).
- **Coût** : un conteneur d'environ 40 Mo de RAM, aucune autre infrastructure.
- **Hors périmètre** (au backlog) : kit presse anglais (`scripts/presskit`, fiche presse), page itch anglaise (`docs/ITCH.md`), cartons de la bande-annonce.

## Fichiers à consulter

- `/home/user/arbre-i18n/packages/content-tools/src/compile.ts`
- `/home/user/arbre-i18n/packages/content-tools/src/build.ts`
- `/home/user/arbre-i18n/packages/content-tools/src/load.ts`
- `/home/user/arbre-i18n/apps/game/vite/lazy-content.ts`
- `/home/user/arbre-i18n/apps/game/src/lib/game/cases.ts`
- `/home/user/arbre-i18n/apps/game/src/lib/game/case-folders.ts`
- `/home/user/arbre-i18n/apps/game/src/lib/game/app.svelte.ts` (l. 371)
- `/home/user/arbre-i18n/apps/game/src/tutorial/steps.ts` (l. 126)
- `/home/user/arbre-i18n/apps/game/src/messages.fr.ts`
- `/home/user/arbre-i18n/apps/game/src/panels/messages.ts`
- `/home/user/arbre-i18n/packages/engine/src/save.ts`
- `/home/user/arbre-i18n/packages/contract/src/{save,settings,compiled,document,platform,engine-api}.ts`
- `/home/user/arbre-i18n/apps/site/src/{hooks.server.ts,app.html,lib/site.ts,routes/sitemap.xml/+server.ts}`
- `/home/user/arbre-i18n/nginx.conf`
- `/home/user/arbre-i18n/.dockerignore`
- `/home/user/arbre-i18n/apps/game/src-tauri/tauri.conf.json`
- `/home/user/arbre-i18n/apps/game/src-tauri/capabilities/default.json`
- `/home/user/arbre-i18n/vitest.config.ts`
- `/home/user/arbre-i18n/.env.example`
