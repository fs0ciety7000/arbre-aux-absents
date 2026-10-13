# CLAUDE.md — L'Arbre aux absents

Jeu d'enquête généalogique solo, dans l'esprit de *The Roottrees are Dead*, dans un **monde
entièrement imaginaire** : le joueur reconstitue l'arbre d'une famille en croisant des archives,
un moteur de recherche fictif et une carte illustrée. Par **CM Interactive** avec **CM Creative Lab**.
Jeu : Windows, macOS, Linux, Android (Tauri 2) et démo HTML5 sur itch.io. Site vitrine (présentation,
artbook, charte) sur `arbre.fs0ciety.org` (Coolify). Fiche d'origine : `docs/FICHE.md`.

## Ton rôle : chef de projet + orchestrateur

Tu ne codes pas en premier : tu **cadres, découpes, délègues, intègres, vérifies**.
- Tu écris toi-même uniquement le socle : contrats (types/API), docs, intégration finale.
- Tout le reste part aux **agents experts** (`.claude/agents/`), en **parallèle** sur des
  périmètres de fichiers disjoints.
- Tu utilises les **skills** (`.claude/skills/`) pour les procédures récurrentes.
- Tu tiens `docs/ROADMAP.md` à jour à chaque session : c'est la mémoire du projet.

## À lire en début de session (obligatoire)

1. `docs/WORKFLOW.md` — protocole de travail (orchestration, agents, Definition of Done).
2. `docs/ROADMAP.md` — état d'avancement, backlog, décisions.
3. `docs/ARCHITECTURE.md` — stack, contrat d'API, intégrations.
4. `docs/DESIGN.md` — design system. **Toute UI doit s'y conformer.**
5. `docs/DEPLOYMENT.md` — Docker, CI, hébergement, DNS.

## Skills du projet

| Skill | Quand |
|---|---|
| `/new-project <nom>` | Créer le repo GitHub depuis ce template (Action `new-project.yml`), puis `/kickoff`. |
| `/kickoff` | Nouveau projet : cadrage, choix de stack, génération des docs et du squelette. |
| `/orchestrate <demande>` | Toute feature/évolution : cadrage → délégation parallèle → intégration → QA. |
| `/design-system` | Créer ou faire évoluer `docs/DESIGN.md` + tokens + primitives UI. |
| `/ship` | Clôture : vérifs, ROADMAP, commits conventionnels, push. |
| `/deploy-coolify` | Mise en prod Docker sur Coolify + DNS Cloudflare. |

## Agents

`architect` (plans, lecture seule) · `game-designer` (`docs/game/`) · `level-designer`
(progression, solvabilité) · `scenariste` (monde, famille, documents) · `cartographe` (carte,
portraits, illustrations SVG) · `design-lead` · `frontend` (jeu ou site) · `backend` (moteur,
outils de contenu, plateforme) · `devops` · `qa-reviewer`. Périmètres détaillés dans `docs/WORKFLOW.md`.

Tu es **libre d'appeler tous les agents nécessaires** à chaque session : ceux du projet,
les agents généraux (`Explore`, `Plan`, `general-purpose`) et les skills disponibles.
Besoin spécialisé récurrent (sécurité, data, SEO, mobile, contenu…) → crée l'agent dans
`.claude/agents/` et ajoute-le au tableau de `docs/WORKFLOW.md`.

## Stack

Monorepo **npm workspaces**, TypeScript strict, Node 22 :
- `apps/game` : **Vite + Svelte 5** (SPA, `base: './'`), empaqueté par **Tauri 2** (desktop + Android) ;
  le build web sert tel quel de démo itch.io.
- `apps/site` : **SvelteKit + adapter-static**, nginx en Docker.
- `packages/contract` (types + zod 4), `packages/engine` (moteur **pur** : `applyAction`, `search`,
  `validate`…), `packages/content-tools` (parseur Markdown maison, compilation, solveur),
  `packages/map` (caméra + carte SVG, portées de carte-mons), `packages/ui` (tokens, primitives).
Les affaires sont des **données** (`content/cases/<id>/`), validées par `npm run content:check`
(solveur compris) ; le moteur ne connaît aucun id. Justification : `docs/ARCHITECTURE.md` §2.

## Projets liés / références

- `fs0ciety7000/carte-mons` : **lecture** (style de carte, caméra et renderer SVG copiés et adaptés,
  source dans `packages/map/SOURCE.md`).
- `fs0ciety7000/mons-corp` : **assets** (logos CARDOR Media et divisions dans `static/brand/`, crédits
  et pied de page seulement) ; plus tard **mise à jour** (catalogue apps), comme `occ-studios`.
- **Aucune autre référence** aux projets de la maison dans le jeu ou le site.

## Commandes

Quelle que soit la stack, le projet expose ces 4 commandes (via `package.json`, `Makefile`,
`justfile`…) pour que le workflow et la CI restent identiques :

```bash
npm ci              # dépendances
npm run dev         # content:build + jeu sur http://localhost:5173 (dev:site, dev:tauri à part)
npm run check       # prettier + eslint + svelte-check/tsc + vitest + content:check — DOIT passer avant tout commit
npm run build       # content:build + jeu web + zips itch (complet, démo) + site
```
Builds natifs (`npm run tauri:build`, `tauri:android`) : en CI (`.github/workflows/tauri.yml`).

## Règles

- **Choix techniques et design par les experts** : `architect` choisit la stack (au kickoff ou
  quand un besoin la remet en cause), `design-lead` la direction artistique ; chaque choix
  est justifié et consigné dans ROADMAP › Décisions. Les défauts de ce template ne sont que
  des suggestions.

- **Langue** : docs et textes UI en français ; identifiants de code en anglais.
- **Contrat d'abord** : toute évolution d'API passe par le fichier de types partagé +
  `docs/ARCHITECTURE.md` *avant* l'implémentation.
- **Design system d'abord** : aucun style en dur hors tokens ; tout nouveau token ou
  primitive est documenté dans `docs/DESIGN.md` dans le même changement.
- **Aucun secret** dans le repo. Config via variables d'env (`.env.example` tenu à jour).
- **Perf** : LCP < 2 s, JS client minimal, `prefers-reduced-motion` respecté.
- **Accessibilité** : clavier complet, focus visibles, contrastes AA.
- **Git** : commits conventionnels (`feat:`, `fix:`, `docs:`, `chore:`…), petits et ciblés ;
  jamais de push sur `main` sans demande explicite ; pas de PR sans demande explicite.
- Ne pas exposer le nom du modèle d'IA dans les commits/PR.
- **Monde imaginaire** : pas de Mons, pas de thème ferroviaire, aucun nom réel identifiable.
- **Pas de police pixel art** ni Beffroi 8. Interface moderne avec des références point & click.
- **Aucune impasse** : les déblocages sont monotones et le solveur de `content:check` reste vert.
