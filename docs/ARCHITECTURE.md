# ARCHITECTURE

> Rempli par `/kickoff`, maintenu par l'orchestrateur et `architect`.
> **Aucune stack n'est imposée** : `architect` la choisit selon le besoin et la justifie ici.
> Les exemples entre `{{…}}` ne sont que des pistes.
> **Le contrat (§3) est modifié AVANT toute implémentation.**

## 0. Projets liés / références

| Repo / session | Mode | Ce qu'on en reprend / ce qu'on y modifie |
|---|---|---|
| {{fs0ciety7000/<repo>}} | {{lecture / assets / mise à jour}} | {{ex. logos copiés dans static/brand ; ajout du projet au catalogue apps}} |

Modes :
- **lecture** : inspiration ou conventions (design, API, infra), rien n'est copié.
- **assets** : on **copie** des fichiers (logos, polices, images) dans ce repo, avec leur
  source notée ici ; jamais de lien direct vers un fichier d'un autre repo.
- **mise à jour** : ce projet impose des changements dans l'autre repo (ex. le référencer
  sur un site existant). Ces changements suivent les règles **de l'autre repo** (son
  CLAUDE.md, ses branches, ses revues), sur une branche dédiée + PR, jamais de push direct
  sur sa branche déployée.

## 1. Vue d'ensemble

{{Schéma texte : client → app → services externes. Ce qui est rendu côté serveur / client.}}

## 2. Stack

| Couche | Choix | Pourquoi (et alternatives écartées) |
|---|---|---|
| Langage / runtime | {{TypeScript·Node / Go / Python / Rust…}} | |
| Framework | {{Next.js / Astro / Go net/http·chi / FastAPI / aucun…}} | |
| UI / styles | {{Tailwind + tokens / CSS natif / aucun (API, CLI)}} | |
| Motion | {{GSAP / Motion / CSS / aucun}} | |
| Données | {{aucune / fichiers / SQLite / Postgres / Supabase…}} | |
| Validation | {{zod / pydantic / validator…}} | |
| Tests | {{Vitest / go test / pytest… + Playwright si UI}} | |
| Lint / format | {{Biome / golangci-lint·gofmt / ruff…}} | |

Critères de choix : adéquation au besoin, perf, simplicité de déploiement (une image
Docker), maturité, cohérence avec les projets liés (§0), maîtrise des agents.

Pistes par type de projet (indicatives) :
- Site / app web riche → Next.js ou Astro (+ Tailwind, GSAP/Motion).
- API / service / worker performant → Go (ou Rust si contrainte forte).
- Data / IA / scripts → Python (FastAPI, uv).
- CLI → Go ou TypeScript selon l'écosystème.

## 3. Contrat d'API (source de vérité : `{{src/lib/types.ts}}`)

| Méthode | Route | Entrée | Sortie | Erreurs |
|---|---|---|---|---|
| GET | `/api/health` | — | `{ ok: true }` | — |

Conventions : erreurs JSON `{ error: { code, message } }`, codes HTTP sémantiques,
validation zod de toute entrée externe.

## 4. Intégrations externes

{{Service, auth, limites, cache, gestion d'erreur.}}

## 5. Sécurité

- Aucune URL arbitraire proxifiée ; entrées validées ; en-têtes de sécurité (CSP…).
- Secrets uniquement en variables d'env.

## 6. Arborescence

{{Selon la stack. Indiquer pour chaque agent ses dossiers (le tableau de périmètres de
docs/WORKFLOW.md s'y réfère). Exemple Next.js : src/app, src/components/ui, src/lib.
Exemple Go : cmd/, internal/, web/.}}

```
docs/               documentation
.claude/            agents, skills, hooks, permissions
```
