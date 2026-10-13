---
name: ship
description: Clôture d'une session ou d'un lot : vérifications finales, mise à jour de docs/ROADMAP.md, commits conventionnels, push sur la branche de travail, résumé. À utiliser à la fin de chaque tâche livrée.
---
# Ship — clôturer

1. `check` + `build` (+ `docker build` si infra touchée). Rouge → corriger, ne pas commit.
2. `git diff` relu : pas de secret, pas de fichier hors sujet, pas de `console.log` oublié,
   `.env.example` à jour.
3. Docs : ARCHITECTURE (si contrat), DESIGN (si tokens/primitives), DEPLOYMENT (si infra),
   **ROADMAP toujours** (fait / reste / décisions, date du jour).
4. Commits conventionnels petits et ciblés (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`,
   `test:`). Aucun nom de modèle d'IA dans les messages.
5. `git push -u origin <branche de travail>` (jamais `main` sans demande explicite ;
   pas de PR sans demande explicite).
6. Résumé utilisateur : livré, vérifié (avec preuves), actions manuelles restantes.
