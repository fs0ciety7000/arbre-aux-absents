# ROADMAP — L'Arbre aux absents

> Mémoire du projet entre sessions. Mise à jour à **chaque** clôture (`/ship`).

## Session 0 — 13 oct. 2026 (kickoff)

Fait :
- [x] Fiche projet, nom, repo créé par `new-project.yml`, branche de travail
- [x] Agents spécialisés : game-designer, level-designer, scenariste, cartographe
- [x] Stack et contrat (architect) : `docs/ARCHITECTURE.md`
- [x] Game design : `docs/game/`
- [ ] Bible du monde et de l'affaire : `docs/monde/`, `docs/scenario/`
- [ ] Lot 0 : monorepo, contrat zod, `check` vert
- [ ] Vague A : moteur, outils de contenu, caméra, design system, infra
- [ ] Vague B : interface du jeu, plateforme, site vitrine
- [ ] Vague C : carte du monde, textes, progression, portraits
- [ ] Vague D : intégration, e2e, QA

## Backlog

- Tests sur appareils réels (Windows, macOS, Linux/Steam Deck, Android téléphone et tablette).
- Signature macOS (Developer ID) et Windows avant la vente ; keystore Android hors repo.
- Page itch.io et `itch.yml` (butler).
- Mise en ligne du site (feu vert de l'utilisateur), puis ajout aux catalogues mons-corp et occ-studios.
- Affaires supplémentaires (contenu seul).

## Décisions

| Date | Décision | Raison |
|---|---|---|
| 13/10 | Nom : **L'Arbre aux absents**, repo `arbre-aux-absents` | Dit le genre (arbre généalogique) et le mystère (les absents). |
| 13/10 | **Monde entièrement imaginaire**, sans Mons (choix de l'utilisateur), avec carte illustrée façon carte.fs0ciety.org | Demande de l'utilisateur : « créer un monde ». |
| 13/10 | « Sans rail » lu comme « sans thème ferroviaire » ; le jeu est non linéaire par conception | Les deux lectures sont couvertes. |
| 13/10 | Tauri 2 + Svelte 5/Vite (jeu), SvelteKit static (site), npm workspaces, zod 4 | Jeu de lecture : texte, a11y et SVG natifs au web ; un shell pour 4 OS ; démo HTML5 identique. Godot et Electron/Capacitor écartés (ARCHITECTURE §2). |
| 13/10 | Markdown restreint + parseur maison, aucun `{@html}` | Confort d'écriture sans XSS. |
| 13/10 | Contenu compilé, réponses hachées, démo physiquement réduite | Pas de spoiler dans le bundle, pas de contenu payant dans la démo. |
| 13/10 | Validation **automatique** par défaut (manuelle en option), groupes définis dans `tree.json` (souvent une branche) | Fluidité ; liberté au level design. |
| 13/10 | Quatre champs par case (prénom, nom, portrait, métier), saisie par listes de candidats lus, texte libre en option | Jouable au doigt et à la manette, pas de clavier virtuel. |
| 13/10 | Garde-fou contre le balayage des listes conservé | Protège la déduction. |
| 13/10 | Manette : navigation par focus par défaut | Plus fiable qu'un curseur virtuel sur une interface de panneaux. |
| 13/10 | Démo itch.io : prologue + première branche | Montre la boucle complète sans divulguer l'intrigue. |
| 13/10 | Domaine par défaut du site : `arbre.fs0ciety.org`, rien en ligne sans feu vert | Instruction du projet. |
