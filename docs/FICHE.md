# L'Arbre aux absents

> Fiche projet · ajoutée le 13 oct. 2026 · statut : **lancé** (repo `fs0ciety7000/arbre-aux-absents`)
> Studio : **CM Interactive**, avec **CM Creative Lab** (écriture, illustration) · crédits : CARDOR Media et ses divisions

## Pitch

Un jeu d'enquête généalogique en solo, dans l'esprit de *The Roottrees are Dead*. Le joueur reçoit un arbre généalogique vide et une pile d'archives : lettres, coupures de presse, photos, registres, cartes postales, annuaires, un vieux moteur de recherche d'époque. Il doit nommer chaque membre d'une famille, retrouver son visage et son métier, en croisant les documents. Rien n'est imposé dans l'ordre : on tire le fil qu'on veut, et le jeu ne valide les réponses que par groupes, pour empêcher de deviner au hasard.

Le décor est entièrement libre (choix du scénariste) et **sans lien avec Mons** ni avec les autres projets de la gamme.

## Monde et carte

Le jeu se déroule dans un **monde entièrement imaginaire**, créé pour lui : pays, villes, langue des toponymes, presse, entreprises, histoire. Une **carte illustrée** de ce monde, dans le style de la carte de Mons (gravure ancienne rehaussée d'aquarelle, cartouche, rose des vents, échelle fantaisie, SVG interactif), sert à la fois d'écran de jeu (les lieux ouvrent des archives) et de pièce maîtresse du site vitrine.

## Pourquoi ce projet

- Premier jeu **premium** de CM Interactive, vendable sur itch.io (desktop et Android).
- Il montre le savoir-faire de Creative Lab : un scénario dense, des personnages illustrés, des dizaines de documents d'archives.
- Le moteur est réutilisable : une nouvelle affaire, c'est uniquement du contenu.

## Public

Amateurs de jeux de déduction (*Return of the Obra Dinn*, *The Case of the Golden Idol*, *Her Story*, *The Roottrees are Dead*), joueurs PC et mobile, prêts à payer 10 à 15 € pour 6 à 10 heures de jeu.

## Boucle de jeu

1. **Lire** : les archives (documents, photos, pages web d'époque) se débloquent au fil des découvertes.
2. **Chercher** : un moteur de recherche fictif répond aux mots-clés (noms, lieux, entreprises) et ouvre de nouveaux documents.
3. **Noter** : un carnet relie automatiquement les termes déjà lus ; le joueur épingle, surligne et annote.
4. **Remplir l'arbre** : pour chaque case, un prénom et un nom, un portrait, un métier ou un rôle.
5. **Valider par groupes** : dès que trois cases d'une même branche sont justes, elles se verrouillent. Pas de pénalité, pas d'indice gratuit : la déduction reste au joueur.
6. **Dénouement** : l'arbre complet révèle le secret de la famille ; des fins varient selon les secrets annexes découverts.

## Durée de vie et rejouabilité

- Affaire principale de 6 à 10 heures, plus un épilogue débloqué à 100 %.
- **Secrets annexes** hors de l'arbre (liaisons, enfants cachés, fausses identités) qui changent le texte final.
- **Mode chronométré** et succès pour le re-jeu, **aides réglables** (surbrillance, indices progressifs) pour l'accessibilité.
- Les affaires sont des données : d'autres affaires (DLC gratuits ou payants) s'ajoutent sans toucher au moteur.

## Périmètre du MVP

- Une affaire complète (environ 25 à 35 membres sur 4 générations, 80 à 120 documents).
- Archives, moteur de recherche fictif, carnet, arbre, validation par groupes, sauvegarde locale, options d'accessibilité.
- Builds Windows, macOS, Linux et Android, plus une version navigateur pour la démo itch.io.
- **Site vitrine** : présentation, artbook, charte graphique, crédits CARDOR Media.

**Hors MVP** : éditeur d'affaires, traductions, Steam, iOS, doublage.

## Direction artistique (piste, à trancher par `design-lead`)

Interface moderne et nette, avec des références point & click : curseur et inventaire d'archives, bureau d'enquêteur, objets manipulables. **Pas de police pixel art ni Beffroi 8.** Portraits illustrés, papier, tampons, photos d'époque, mais une couche UI contemporaine (cartes, panneaux, typographie soignée).

## Pistes techniques (à valider par `architect`)

- Une seule base web (Svelte 5, TypeScript, Vite) empaquetée avec **Tauri 2** pour Windows, macOS, Linux et Android, et publiée telle quelle en HTML5 pour itch.io.
- Pourquoi : un jeu de lecture et d'interface profite du rendu texte, de l'accessibilité et de la mise en page du web, et Tauri produit des binaires légers sur les quatre plateformes avec le même code.
- Affaires en données validées (schéma), moteur pur et testé, sauvegarde locale.
- Site vitrine statique dans le même repo, en Docker sur Coolify.

## Agents

PM et orchestration (session principale), `architect`, `game-designer`, `level-designer`, `scenariste` (et worldbuilding), `cartographe`, `design-lead`, `frontend`, `backend`, `devops`, `qa-reviewer`.

## Jalons proposés

1. **Cadrage** : stack, game design, bible du scénario (à relire avant d'écrire tous les documents).
2. **Moteur** : archives, recherche, carnet, arbre, validation, sauvegarde.
3. **Contenu** : l'affaire complète, les portraits et documents.
4. **Builds** desktop, Android et HTML5, tests sur appareils réels.
5. **Site vitrine** puis mise en ligne (domaine par défaut `arbre.fs0ciety.org`) et page itch.io.

## Questions ouvertes

- Prix et modèle (prix fixe, démo gratuite, affaires supplémentaires).
- Illustrations : vectorielles faites en interne, ou commande à un illustrateur pour la version commerciale.
- Domaine (par défaut `arbre.fs0ciety.org`).
