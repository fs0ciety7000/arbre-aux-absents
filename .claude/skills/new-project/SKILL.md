---
name: new-project
description: Crée un nouveau repo GitHub à partir du template fs0ciety7000/claude-start puis enchaîne sur /kickoff. À utiliser quand l'utilisateur dit « nouveau projet : <nom> », « crée-moi un repo », « on lance une nouvelle app ».
---
# Nouveau projet (création du repo)

L'app GitHub de Claude ne peut pas créer de repo : on passe par l'Action
`new-project.yml` du template, qui utilise le secret `REPO_CREATOR_TOKEN`.

1. Choisir un nom kebab-case (le proposer si l'utilisateur n'en donne pas), une
   description d'une ligne, visibilité `private` par défaut.
2. Déclencher l'Action : `mcp__github__actions_run_trigger` avec
   `method: run_workflow`, `owner: fs0ciety7000`, `repo: claude-start`,
   `workflow_id: new-project.yml`, `ref: main`,
   `inputs: { name, description, visibility }`.
   (Si `claude-start` n'est pas dans la session : `add_repo` fs0ciety7000/claude-start d'abord.)
3. Suivre le run (`mcp__github__actions_list` › `list_workflow_runs` sur `new-project.yml`,
   puis `actions_get`) jusqu'à `completed`. En cas d'échec, lire les logs
   (`get_job_logs`) et donner la cause exacte (secret absent, nom pris, token expiré…).
4. `add_repo` fs0ciety7000/<nom> (accès `push`), cloner, `register_repo_root`.
5. Supprimer `.github/workflows/new-project.yml` et `.claude/skills/new-project/` du
   nouveau repo (ils ne servent que dans le template), puis lancer `/kickoff`.

Si `add_repo` est refusé : l'app Claude n'a pas accès au nouveau repo → demander à
l'utilisateur de l'ajouter (github.com/apps/claude › Configure) ou de passer l'app en
« All repositories ».
