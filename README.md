# Claude-start

Template de démarrage pour mes projets avec **Claude Code** : Claude agit en
**chef de projet / orchestrateur**, délègue à des **agents experts** et suit des **skills**
(procédures) standardisés. Chaque projet hérite du même workflow, du même cadre de
design system et des mêmes permissions.

## Contenu

```
CLAUDE.md                     Instructions projet (gabarit à remplir via /kickoff)
PROJECT_INSTRUCTIONS.md       Texte à coller dans claude.ai › Projets › Instructions
docs/
  WORKFLOW.md                 Protocole : cadrage → délégation parallèle → intégration → QA → ship
  ROADMAP.md                  Mémoire du projet entre sessions
  ARCHITECTURE.md             Stack + contrat d'API (modifié AVANT l'implémentation)
  DESIGN.md                   Design system (tokens OKLCH, typo, motion, primitives, checklist)
  DEPLOYMENT.md               Docker, CI, Coolify, Cloudflare
.claude/
  settings.json               Permissions (allow/ask/deny) + hook SessionStart
  hooks/session-start.sh      Installe les deps + rappelle le protocole
  agents/                     architect · design-lead · frontend · backend · devops · qa-reviewer
  skills/                     new-project · kickoff · orchestrate · design-system · ship · deploy-coolify
.github/pull_request_template.md
.github/workflows/new-project.yml   Action de création de repo (template uniquement)
.env.example · .gitignore
```

## Utilisation

### Réglage unique (2 min)
1. Créer un token **fine-grained** (github.com/settings/personal-access-tokens/new) :
   propriétaire `fs0ciety7000`, *Repository access* = **All repositories**, permissions
   **Administration : Read and write** et **Contents : Read-only**.
2. L'enregistrer ici : Settings › Secrets and variables › Actions › **New repository
   secret** → nom `REPO_CREATOR_TOKEN`.
3. App Claude sur **All repositories** (github.com/apps/claude › Configure), pour que
   Claude accède aux repos qu'il crée.

### Nouveau projet
Dans une session du Projet claude.ai : « **nouveau projet : mon-app** ». Claude déclenche
l'Action **Nouveau projet** (`.github/workflows/new-project.yml`), qui crée
`fs0ciety7000/mon-app` depuis ce template ; il l'ajoute à la session puis lance `/kickoff`
(questions de cadrage, docs, squelette, design system, infra).
Sans Claude : onglet Actions › Nouveau projet › Run workflow, ou bouton **Use this template**.

### Projet existant
Copier `CLAUDE.md`, `docs/WORKFLOW.md`, `.claude/` dans le repo, puis `/kickoff`
(il adapte le gabarit à l'existant au lieu de créer un squelette).

### Avec les Projets claude.ai
1. Créer un Projet, y coller `PROJECT_INSTRUCTIONS.md` dans **Instructions**.
2. Ajouter ce repo (et/ou le repo du projet) comme source.
3. Chaque session du Projet démarre alors avec le même rôle d'orchestrateur.

## Skills

| Skill | Rôle |
|---|---|
| `/new-project <nom>` | Crée le repo depuis le template via l'Action, puis `/kickoff` |
| `/kickoff` | Cadrage, stack, docs, squelette, design system, infra |
| `/orchestrate <demande>` | Livraison d'une feature via les agents en parallèle |
| `/design-system` | DESIGN.md + tokens + primitives + page `/design` |
| `/ship` | Vérifs, ROADMAP, commits conventionnels, push |
| `/deploy-coolify` | Prod Docker sur Coolify + DNS Cloudflare |

## Permissions

`.claude/settings.json` autorise sans demande l'édition, la recherche, les gestionnaires de
paquets, Docker local, git (hors force-push) et la lecture GitHub ; **demande** avant
`rm -rf`, `git reset --hard`, push sur `main`, création/merge de PR ; **interdit** le
force-push et la lecture des fichiers `.env`. Ajustements perso : `.claude/settings.local.json`
(ignoré par git).
