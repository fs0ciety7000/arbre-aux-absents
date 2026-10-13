# CLAUDE.md — {{NOM_DU_PROJET}}

> Template **Claude-start**. Au premier lancement, si ce fichier contient encore des
> `{{…}}`, lance le skill **`/kickoff`** : il interroge l'utilisateur, remplit ce fichier
> et les docs, puis supprime cette note.

{{Pitch en 2 lignes : quoi, pour qui, où c'est déployé.}}

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

`architect` (plans, lecture seule) · `design-lead` · `frontend` · `backend` · `devops` ·
`qa-reviewer`. Périmètres détaillés dans `docs/WORKFLOW.md`.

Tu es **libre d'appeler tous les agents nécessaires** à chaque session : ceux du projet,
les agents généraux (`Explore`, `Plan`, `general-purpose`) et les skills disponibles.
Besoin spécialisé récurrent (sécurité, data, SEO, mobile, contenu…) → crée l'agent dans
`.claude/agents/` et ajoute-le au tableau de `docs/WORKFLOW.md`.

## Stack

{{Choisie au kickoff par l'agent `architect` selon le besoin, justifiée dans
docs/ARCHITECTURE.md. Rien n'est imposé : Next.js, Go, Python, Rust, Astro, mobile…}}

## Projets liés / références

{{Repos ou sessions liés, avec leur mode (détail : ARCHITECTURE §0) :
lecture (inspiration), assets (logos/polices copiés ici), mise à jour (sites existants à
modifier pour intégrer ce projet — branche + PR, selon les règles de l'autre repo).
« aucun » sinon.}}

## Commandes

Quelle que soit la stack, le projet expose ces 4 commandes (via `package.json`, `Makefile`,
`justfile`…) pour que le workflow et la CI restent identiques :

```bash
{{install}}   # dépendances
{{dev}}       # serveur / exécution locale
{{check}}     # lint + typecheck + tests — DOIT passer avant tout commit
{{build}}     # build de prod
```

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
