---
name: kickoff
description: Démarre un nouveau projet à partir du template Claude-start. À utiliser quand CLAUDE.md contient encore des {{…}}, ou quand l'utilisateur dit « nouveau projet », « on démarre », « kickoff ». Cadre le besoin, fait choisir la stack par architect, remplit CLAUDE.md et docs/*, puis orchestre le squelette, le design system et l'infra.
---
# Kickoff — nouveau projet

Tu es chef de projet. Objectif : passer d'une idée à un squelette vert, documenté, déployable.

## 0. Nettoyage du template
Si présents, supprimer `.github/workflows/new-project.yml` et `.claude/skills/new-project/`
(ils ne servent que dans `claude-start`).

## 1. Cadrage (une seule salve de questions, via AskUserQuestion)
Demande uniquement ce que tu ne peux pas déduire :
- Pitch (quoi, pour qui), nom du projet.
- **Domaine de déploiement** (toujours demander) : défaut proposé `<nom>.fs0ciety.org`,
  mais l'utilisateur peut choisir un autre domaine (zone Cloudflare existante ou non).
- Type : site vitrine / app web / API / CLI / autre.
- Données : aucune, fichiers, Supabase/Postgres, API externe.
- Direction artistique souhaitée (3 mots, références) — sinon le design-lead propose.
- **Projets liés** : un repo existant sert-il de référence (ex. même marque, même API) ?
  Pour chacun : mode **lecture** (inspiration), **assets** (logos/polices à copier) ou
  **mise à jour** (sites existants à modifier pour intégrer ce projet) ?
- Contraintes techniques éventuelles (langage imposé, perf, hébergement).
Ne choisis pas la stack toi-même : c'est `architect` qui la recommande (étape 3).

## 2. Choix de stack (agent `architect`, en premier)
Brief : besoin cadré + contraintes + projets liés. Il compare 2-3 stacks, en recommande une
(justifiée), propose l'arborescence (périmètre de chaque agent) et le plan v1 en lots.
Si le choix est structurant ou surprenant, le valider avec l'utilisateur en une question.

## 3. Socle (toi)
0. Projets liés : `add_repo` (accès `push` si mode « mise à jour »), lire leur CLAUDE.md,
   les noter dans CLAUDE.md et ARCHITECTURE §0 avec leur mode. Assets : les copier
   (source notée). Mises à jour : les ajouter au backlog v1 comme lots dédiés.
1. Remplir `CLAUDE.md` (pitch, stack retenue, projets liés, commandes install/dev/check/build)
   et supprimer la note template.
2. `docs/ARCHITECTURE.md` : vue d'ensemble, stack justifiée, arborescence, contrat initial.
3. `docs/ROADMAP.md` : Session 0 + backlog v1 + décisions (stack, design, domaine).
4. Adapter `.claude/settings.json` (permissions des commandes de la stack) et
   `.claude/hooks/session-start.sh` si besoin.

## 4. Délégation parallèle (un seul message, plusieurs Agent)
- `design-lead` → `/design-system` (si UI) : direction propre au projet, DESIGN.md, tokens,
  primitives, `/design`.
- `backend` → squelette dans la stack retenue (types partagés, healthcheck, check/build).
- `devops` → Dockerfile adapté à la stack, CI, DEPLOYMENT.md, `.env.example`.
Puis `frontend` une fois tokens + contrat posés.

## 5. Intégration et clôture
`check` + `build` + `docker build` verts → `qa-reviewer` → `/ship`.
Rends à l'utilisateur : ce qui existe, comment lancer, prochaines étapes, actions manuelles
(DNS, Coolify, création du repo si nécessaire).
