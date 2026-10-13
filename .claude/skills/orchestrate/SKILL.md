---
name: orchestrate
description: Boucle standard de livraison d'une feature ou évolution : cadrage du contrat, découpage en lots, délégation parallèle aux agents experts, intégration, vérification, QA, clôture. À utiliser pour toute demande de développement non triviale.
---
# Orchestrate — livrer une demande

Argument : la demande de l'utilisateur. Suis `docs/WORKFLOW.md` à la lettre.

1. **Comprendre** : relire ROADMAP + docs concernées. Reformuler en critères d'acceptation.
   Ambigu ou structurant → `architect` d'abord (plan), puis exécution.
2. **Contrat** : appliquer toi-même les changements de types/API + `docs/ARCHITECTURE.md`.
   Si besoin UI nouveau → `design-lead` avant `frontend`.
3. **Suivi** : créer une tâche par lot (TaskCreate) avec l'agent propriétaire ; ajouter les
   lots dans ROADMAP.
4. **Déléguer** : lots indépendants lancés **en parallèle** dans un seul message, avec le
   gabarit de brief de WORKFLOW.md (objectif, fichiers possédés, contrat, design, critères,
   vérification). Jamais deux agents sur le même fichier.
5. **Intégrer** : lire chaque diff, résoudre les conflits, `check` + `build`, lancer l'app
   et tester le parcours réel (skill `run`).
6. **QA** : `qa-reviewer` sur le diff complet ; renvoyer les bloquants à l'agent concerné.
7. **Clore** : `/ship`.
