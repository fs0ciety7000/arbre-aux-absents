# Bible de l'affaire n° 2 — *Le Revenant de Hautcorvin*

> Identifiant proposé : `revenant-de-hautcorvin` (`content/cases/revenant-de-hautcorvin/`).
> Tenue par `scenariste` (CM Creative Lab). État : **v0.2, décisions de la v0.1 reportées**
> (avant graphe de progression) ; corpus listé (96 pièces + 2 d'épilogue), trois pièces rédigées en exemple.
> Règles de jeu propres à l'affaire : `docs/game/AFFAIRE-2.md`. Monde : `docs/monde/`. Bible de
> l'affaire 1 : `docs/scenario/` (ne pas la modifier depuis ce dossier).

## Pitch

Velmarche, février 1976. Un vieil homme se présente à l'Office de Réinscription civile : « Je suis
Bastien Tessonnal. » Le fils du maître verrier de Hautcorvin, accusé de l'incendie de 1937, radié,
mort au bagne de Kessaar en 1944. Il sait tout ; sa sœur dit qu'il n'a pas les yeux de leur mère. Le
rapporteur, titularisé depuis l'affaire de Moulinvert, reconstitue 28 cases sur quatre générations
— verriers, carriers, guides, une graveuse thalbère, une gardienne de refuge, un douanier — dans un
arbre où une case a été **remplie par le requérant** (nom juste, visage et métier faux) et une autre ne porte qu'un « ? ». L'homme ment
sur son nom et dit vrai sur tout le reste ; il n'a menti que pour reconnaître la fille d'un mort, et
il ignore qu'il était lui-même un fils de la maison. À la fin, un tampon : dénoncer, rétablir chacun,
ou laisser vivre le mensonge.

Ton : hivernal, procédural, pitoyable sans indulgence ; le verre comme le papier de l'affaire 1.
Jouable seule ; caméos discrets de l'affaire 1 sans révélation (Kessaar, T. Haask, la lentille de
Tennok, L. Daubry experte en écritures, C. Sauge au Lecteur, le rapporteur titularisé).

## Index

| Fichier | Contenu |
|---|---|
| [01-synopsis.md](01-synopsis.md) | Pitch, mission (dossiers 76-0012 et 74-0962), case revendiquée, le Lecteur en 1976, vérité cachée, ton, scène d'ouverture. |
| [02-arbre.md](02-arbre.md) | Les 28 cases : schéma, règle des noms, `person` et `occupation`, liste fermée des métiers (24 + 3 leurres), état de départ (1 établie, 1 revendiquée à deux champs faux, 1 « ? », 5 cachées), 8 groupes, pièges. |
| [03-chronologie.md](03-chronologie.md) | **Source de vérité** 1790–1976 : officiel vs vrai, pièce produite à chaque date, âges au 2 février 1976, héritiers. |
| [04-personnages.md](04-personnages.md) | Traits héréditaires (fossette, yeux, épi, sourcils, lobe), 28 fiches avec âge du portrait de case et constantes, personnages hors arbre, leurres. |
| [05-secrets-et-fins.md](05-secrets-et-fins.md) | Cinq secrets (S1–S5), rapport (4 questions + décision), quatre fins, paragraphes modulaires, mentions marginales, épilogue. |
| [06-corpus.md](06-corpus.md) | Les **96 pièces** (+ EP-01, EP-02) : type, date, lieu, cote, résumé, mots-clés, ce qu'elles prouvent ; pièces restreintes. |
| [07-coherence.md](07-coherence.md) | Invariants, preuves par case et par champ (N/V/M, ≥ 2 pièces, ≥ 2 chemins), fausses pistes, âges par photo, preuves des secrets, cohérence avec l'affaire 1 et le monde (dont la **règle du caméo Haask**), points faibles. |
| [08-lieux.md](08-lieux.md) | Trois lieux nouveaux (Vernezac, le Pas de l'Ourse, Dalvezac) avec positions, la Combe-aux-Sables en simple toponyme, demandes au `cartographe` (source de la Vèze, route, deux sentiers), règle de nommage thalbère, institutions et presse nouvelles (reportées dans `docs/monde/00-monde.md`). |
| [09-illustrations.md](09-illustrations.md) | Règles de dessin, 28 portraits de case, les **trois âges du requérant** et les demi-frères, 6 leurres, 53 illustrations de pièces, ordre de production. |
| [exemples/](exemples/) | Trois pièces rédigées intégralement (ci-dessous). |

## Pièces d'exemple

| Fichier | Pièce | Ce qu'elle fixe |
|---|---|---|
| [of-02-requete.md](exemples/of-02-requete.md) | OF-02, formulaire R-4 du requérant (12 janv. 1976) | Le registre administratif de 1976, la case revendiquée à sa source (nom juste ; métier « chef de nuit » et photo faux), le signalement qui contredit déjà 1938 (yeux bruns, main gauche), le T à boucle. |
| [pv-02-deuxieme-audition.md](exemples/pv-02-deuxieme-audition.md) | PV-02, deuxième audition (5 févr. 1976) | La voix du requérant ; un procès-verbal **écrit pour être relu** : il répond juste à tout, sauf la marraine (RG-04 / RG-05) et la gravure de la Coupe ; il parle d'Andrin comme d'un autre et de « sa mère » comme d'une graveuse. |
| [lt-06-dernier-billet.md](exemples/lt-06-dernier-billet.md) | LT-06, billet de Bastien sur bon de cantine (mars 1944) | L'intime, la clé de S5 (« Dis à la petite… »), l'avertissement « il a les yeux de sa mère », un appui S1 sans preuve seule (`redacted`). |

**Notation** : celle du contrat de contenu (`packages/contract`, parseur de `content-tools`), comme
les pièces de l'affaire 1 : frontmatter (`kind`, `title`, `date`, `author`, `place`, `archive`,
`reveals`, `illustration`), `::stamp[…]`, `::hand[…]` (en bloc ou en ligne), `::signature[…]`,
`::redacted[n]`, `~~rature~~`, tableaux Markdown ; commentaires `<!-- … -->` = notes de production.
Les identifiants de portrait sont des **noms de travail** (`hc-andrin-63`) à remplacer au build ;
les métiers reprennent les `occupation` de `02-arbre.md`. À vérifier par `backend` : `::redacted` et
`~~…~~` imbriqués dans un `::hand[…]` en ligne (LT-06).

## Règles d'écriture pour la suite

- La chronologie (03) fait foi ; toute pièce nouvelle s'y inscrit, puis dans 06 et 07.
- **Le requérant n'invente rien de ce qu'il a vécu, seulement ce qu'il n'a pas vécu** : ses erreurs sont
  toujours des souvenirs d'Andrin (marraine, gravure, mère graveuse), jamais des fautes au hasard.
- Les traits héréditaires sont toujours du même côté (fossette joue gauche, profil **droit** des fiches)
  et décrits avec les mêmes mots d'une pièce à l'autre.
- Aucune pièce ne dit seule « le requérant est Andrin » : la preuve est toujours un **croisement**
  (photo + signalement, matricule + registre, écriture + écriture).
- Pièces thalbères : graphie velmarchoise de l'état civil pour les personnes, double nom pour les lieux.
- Rien de l'affaire 1 n'y est expliqué ni dévoilé ; les caméos restent des noms et des fonctions.
- Pas de violence montrée : listes, fiches, tampons, « destinataire absent ».

## Décisions validées (v0.2)

1. **Case revendiquée** : deux champs faux, le visage (Andrin à 63 ans) et le métier (leurre
   `chef-de-nuit`) ; le nom reste juste (`02-arbre.md` §4).
2. **Fin F2** gardée telle quelle. 3. **142** radiés. 4. **Sursis** pour le requérant (F3, F4).
5. **Ajouts au monde** reportés dans `docs/monde/00-monde.md` (§2–§8, récapitulatif §11).
6. **Combe-aux-Sables** : simple toponyme, sans `PlaceId` ; route, deux sentiers et source de la Vèze
   documentés pour le `cartographe` (`08-lieux.md` §1).
7. **Teodor Haask** : né le 3 avril 1912 (seule fenêtre compatible avec l'affaire 1) ; caméo neutre,
   règle écrite (`07-coherence.md` §6).
8. **PH-18** (lauréats de la Saint-Éloi, 1935) ajoutée : même déduction que PH-07 par un autre fonds.
9. **Brissac / Brossal** gardés. 10. **« Rétablir chacun »** grisé avec sa raison.

## Questions ouvertes

1. **Condition de S5** : deux de LT-05, LT-06, LT-11 (proposé) — au `level-designer`.
2. **`docs/game/AFFAIRE-2.md`** (hors de ce dossier) décrit peut-être la case revendiquée avec un seul
   champ faux : à aligner par le `game-designer` sur la décision 1.
3. **PH-18** : son déblocage (« Saint-Éloi » via RG-17 ou RG-04, après C22) est une proposition ; le
   `level-designer` peut le retarder pour que le doute dure.
