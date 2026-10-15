# WORKFLOW — Méthode de travail (toutes les sessions)

La session principale agit en **chef de projet / orchestrateur** : elle cadre, découpe,
délègue aux agents experts, intègre et vérifie. Elle n'écrit elle-même que le socle
(contrats, docs, intégration).

## 1. Démarrage de session

1. Lire `CLAUDE.md`, puis `docs/ROADMAP.md` (état + backlog).
2. Si `CLAUDE.md` contient des `{{…}}` → lancer `/kickoff` et s'arrêter là.
3. Installer et lancer `check` : l'état de départ doit être vert, sinon c'est la 1re tâche.
4. Reformuler la demande, la découper en lots **indépendants** (fichiers disjoints).

## 2. Cadrage (orchestrateur)

- **Projets liés** (§0 d'ARCHITECTURE, ou cités par l'utilisateur) : les ajouter à la
  session (`add_repo` ; accès `push` si mode « mise à jour »), lire **leur** CLAUDE.md, et
  les donner en contexte aux agents concernés. Une session précédente peut aussi servir de
  référence (`list_sessions` / `list_events`).
- **Changements inter-repos** (mode « mise à jour ») : un lot dédié par repo externe, confié
  à l'agent compétent avec les règles de ce repo ; branche dédiée + PR (jamais de push sur
  sa branche déployée), lien croisé entre les PR. Livrer d'abord le nouveau projet, puis
  les mises à jour qui pointent vers lui (pas de lien vers un site pas encore en ligne).

- Mettre à jour le **contrat** (types partagés + section API de `docs/ARCHITECTURE.md`)
  avant toute délégation : c'est l'interface entre agents.
- Si l'UI change : s'assurer que `docs/DESIGN.md` couvre le besoin (sinon `design-lead` d'abord).
- Ajouter les tâches dans `docs/ROADMAP.md` avec leur agent propriétaire.
- Demande ambiguë ou structurante → plan par `architect`, validé avant d'exécuter.

## 3. Délégation aux agents experts

Chemins indicatifs (exemple Next.js) : les vrais dossiers de chaque agent sont ceux de
`docs/ARCHITECTURE.md` §6, selon la stack choisie.

| Agent | Périmètre (fichiers possédés) — détail : `docs/ARCHITECTURE.md` §6 |
|---|---|
| `architect` | Plans, contrats, revues d'architecture. **Lecture seule.** |
| `game-designer` | `docs/game/**` |
| `level-designer` | `docs/level/**`, `content/cases/<id>/{tree,progression,hints,achievements}.json` |
| `scenariste` | `docs/scenario/**`, `docs/monde/**`, `content/cases/<id>/{case,family}.json`, `documents/**`, `endings/**` ; traductions : `docs/i18n/**`, `content/**/locales/<loc>/*.json`, `…/documents/**`, `…/endings/**` (relecture `level-designer` pour progression, aides, succès) |
| `traducteur` | Traduction FR → EN (anglais britannique) d'un lot : `content/cases/<id>/locales/en/<chemins du lot>` ; glossaire `docs/i18n/en/GLOSSAIRE.md` en lecture (tenu par `scenariste`). Vérifie avec `npm run content:i18n`. |
| `cartographe` | `content/world/**`, `art/**`, `content/cases/<id>/{portraits,illustrations}/**`, surcharges `content/**/locales/<loc>/illustrations/**`, `art/map/locales/**` |
| `design-lead` | `docs/DESIGN.md`, `packages/ui/**`, `apps/site/src/routes/design/**` |
| `frontend` (jeu) | `apps/game/src/**` (hors `platform/`, dont `i18n/**`), `apps/game/vite/**`, `packages/map/src/svelte/**` |
| `frontend` (site) | `apps/site/src/**` (hors `routes/design/`, dont `params/**`, `lib/i18n/**`) |
| `backend` | `packages/engine/**`, `packages/content-tools/**`, `packages/map/src/camera/**`, `apps/game/src/platform/**`, `scripts/*.ts`, service de signalement `apps/report/{src,test}/**`, `apps/report/package.json` (+ `tsconfig.json`, `vite.config.ts`) |
| `devops` | `apps/game/src-tauri/**`, `Dockerfile`, `nginx.conf`, `.dockerignore`, `apps/report/Dockerfile`, `apps/report/Dockerfile.dockerignore`, `.github/**`, `docs/DEPLOYMENT.md`, `scripts/*.sh` |
| `qa-reviewer` | Revue de diff, `tests/e2e/**`, a11y, perf, sécu. Ne modifie que les tests. |

Agents généraux toujours disponibles : `Explore` (recherche large dans le code), `Plan`
(plan d'implémentation), `general-purpose` (recherche/tâches multi-étapes). L'orchestrateur
appelle **tous les agents nécessaires** sans demander. Si un besoin spécialisé revient
(ex. `security`, `data`, `seo`, `mobile`, `content`), il crée l'agent dans `.claude/agents/`
(frontmatter `name`, `description`, `tools` si restreint) et l'ajoute à ce tableau.

Règles :
- Lancer en **parallèle** (un seul message, plusieurs appels Agent) les lots indépendants.
- Un agent = un périmètre de fichiers. Hors périmètre → il **signale**, ne modifie pas.
- Chaque brief contient : **objectif, fichiers possédés, contrat, critères d'acceptation,
  commande de vérification**. Gabarit :

```
Objectif : …
Fichiers possédés : …
Contrat à respecter : <chemin types> / docs/ARCHITECTURE.md §…
Design : docs/DESIGN.md §… (tokens/primitives à utiliser)
Critères d'acceptation : 1) … 2) …
Vérification : <commande check> (+ build / test manuel)
Rends : résumé des changements, fichiers touchés, points hors périmètre signalés.
```

## 4. Intégration (orchestrateur)

1. Relire chaque livrable (diff), résoudre les conflits de contrat.
2. `check` + `build` (+ `docker build` si infra touchée).
3. Lancer l'app et vérifier le parcours réel (skill `run` / Playwright si dispo).
4. `qa-reviewer` sur le diff final ; corriger tout point **bloquant**.

## 5. Clôture → skill `/ship`

- `docs/ROADMAP.md` : fait / reste à faire / décisions.
- Commits conventionnels, push sur la branche de travail.
- Résumé à l'utilisateur : livré, vérifié, actions manuelles restantes.

## Definition of Done

- `check` et `build` verts ; image Docker qui build et démarre (healthcheck 200) si applicable.
- UI conforme à `docs/DESIGN.md`, `prefers-reduced-motion` respecté, navigable au clavier.
- Docs à jour (ARCHITECTURE si contrat modifié, DEPLOYMENT si infra modifiée, ROADMAP toujours).
- Aucun secret commité ; `.env.example` à jour.
