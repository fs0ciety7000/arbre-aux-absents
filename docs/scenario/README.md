# Bible du scénario — *L'Arbre aux absents*

> Affaire n° 1 : **« Succession Varenque »** (`content/cases/succession-varenque/`).
> Tenue par `scenariste` (CM Creative Lab). État : **v0.2, passe de cohérence faite sur le corpus
> rédigé** (116 documents + 2 pièces d'épilogue, 118 fichiers). Les pièces de
> `content/cases/succession-varenque/documents/` font foi ; les exemples ci-dessous datent de la v0.1
> et peuvent en différer. Écarts intégrés : `07-coherence.md` §7.

## Pitch

Velmarche, octobre 1974. Une institutrice de 94 ans meurt en léguant tout « à tous les descendants
vivants de mon père et de mon oncle » et en demandant à l'État de réinscrire « ceux que nous avons
rendus absents » — les effacés des registres de la Régence. Rapporteur à l'Office de Réinscription
civile, le joueur reconstitue, pièce par pièce, l'arbre de trente personnes sur quatre générations :
papetiers, gardiennes de phare, une soprano, un aviateur, une graveuse de faux papiers déclarée morte
au bagne, et une enfant volée qui travaille aujourd'hui… aux Archives. Une famille qui a fabriqué
le papier qui effaçait les gens, et celui qui les sauvait.

Ton : mélancolique, chaleureux, ironique dans les marges ; la violence passe par les papiers.

## Index

| Fichier | Contenu |
|---|---|
| [01-synopsis.md](01-synopsis.md) | Mission du joueur, justification diégétique du moteur de recherche (Lecteur LX-2), vérité cachée, ton, scène d'ouverture. |
| [02-arbre.md](02-arbre.md) | Les 30 cases : schéma, noms canoniques et variantes, dates, métiers (liste fermée + leurres), état de départ, cases cachées, pièges. |
| [03-chronologie.md](03-chronologie.md) | **Source de vérité** : chronologie réelle 1846–1975, version officielle vs vérité, documents produits à chaque date. |
| [04-personnages.md](04-personnages.md) | Une fiche par personnage (caractère, background, secrets) et **brief de portrait** (âge, traits, coiffure, vêtements, signe distinctif) ; personnages hors arbre. |
| [05-secrets-et-fins.md](05-secrets-et-fins.md) | Six secrets annexes, rapport final (six questions + un choix), cinq fins, épilogue, rejouabilité. |
| [06-corpus.md](06-corpus.md) | Les **116 documents** prévus : type, date, lieu, résumé, mots-clés indexés, ce qu'ils prouvent. |
| [07-coherence.md](07-coherence.md) | Tableau de preuves par case (≥ 2 pièces par champ, ≥ 2 chemins), fausses pistes, âges sur les photos, preuves des secrets, points faibles. |
| [illustrations.md](illustrations.md) | Fiches de brief des illustrations des documents OF, PH et EP (composition, personnes, âges, traits, objets), pour le `cartographe`. |
| [exemples/](exemples/) | Cinq documents rédigés intégralement pour fixer le ton (voir ci-dessous). |

Le monde (pays, carte, langues, institutions) est dans [`docs/monde/`](../monde/README.md).

## Documents d'exemple

| Fichier | Pièce | Ce qu'il fixe |
|---|---|---|
| [of-02-testament.md](exemples/of-02-testament.md) | OF-02, testament d'Adélaïde (1974) | La voix de Tante Adé, l'amorce de tout le jeu, l'indice « commencez par la cuisine ». |
| [pr-05-tempete-de-tennok.md](exemples/pr-05-tempete-de-tennok.md) | PR-05, *Courrier d'Aubrelieu* (1924) | Le registre presse, une pièce qui prouve trois cases et cache un secret (S4). |
| [lt-10-billet-de-kessaar.md](exemples/lt-10-billet-de-kessaar.md) | LT-10, billet clandestin (1942) | L'intime, l'ellipse, les initiales à décoder, le trait héréditaire comme preuve. |
| [rg-15-registre-des-pupilles.md](exemples/rg-15-registre-des-pupilles.md) | RG-15, registre brûlé (1942) | Le registre administratif, les lacunes (`redacted`), le distracteur (P-4472). |
| [ph-05-mariage-1922.md](exemples/ph-05-mariage-1922.md) | PH-05, photo de groupe (1922) | Le format d'une photo : brief illustrateur, légende déchirée, déduction par élimination. |

Notation provisoire dans les exemples (en attendant le parseur, contrat §3.2) : `[stamp: …]`,
`[signature: …]`, `[hand: …]` (écriture manuscrite), `[figure: …]`, `[redacted: n]` (n caractères
perdus), `[brûlé]` dans les tableaux. Les commentaires `<!-- … -->` sont des notes de production
retirées au build. Le mot barré du testament (`~~…~~`) demande un inline « rature » qui n'existe pas
encore dans le contrat : à arbitrer (ou rendu par `redacted`).

## Règles d'écriture pour la suite

- La chronologie (03) fait foi ; toute pièce nouvelle s'y inscrit, puis dans 06 et 07.
- Chaque pièce a **une voix** datée (vocabulaire, typographie, institution) et **au moins un mot-clé**
  qui mène ailleurs.
- Jamais de nom complet d'un personnage caché sans au moins une pièce de pont (prénom, initiale,
  date, trait).
- Les photos sont décrites pour l'illustrateur avec l'âge exact de chaque personne (07 §4).
- Aucune référence au monde réel ni aux autres projets de la maison ; aucun train.

## Points à valider par l'humain

1. **Époque et cadre** : une petite nation imaginaire, de 1846 à 1974, avec une dictature (la Régence,
   1937–1952) qui « efface » les gens des registres. Le sujet est grave mais traité par les papiers.
2. **Le joueur** est un rapporteur anonyme de l'Office ; pas de lien de sang avec la famille (une
   variante « le joueur est l'enfant caché » a été écartée : trop attendue, et elle prive Lise de son rôle).
3. **Lise placée sous Odile et Orrin** (arbre de sang), adoption en pointillé.
4. Noms d'épouse acceptés comme variantes ; noms de scène et d'emprunt refusés.
5. Métier de Pauline : `blanchisseuse` (avec `modele` en leurre) ou les deux acceptés.
6. Le **choix final** (inscrire ou taire Nora Ilvess) et la fin **F2 « Le faux coupable »**.
7. Épilogue à 100 % exigeant toutes les pièces lues.
8. 116 documents : dans la fourchette haute ; quatre pièces restreintes (accès par « Prénom Nom »).
