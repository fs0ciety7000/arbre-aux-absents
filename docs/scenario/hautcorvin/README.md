# Bible de l'affaire n° 2 — *Le Revenant de Hautcorvin*

> Identifiant proposé : `revenant-de-hautcorvin` (`content/cases/revenant-de-hautcorvin/`).
> Tenue par `scenariste` (CM Creative Lab). État : **v0.1, bible complète avant graphe de
> progression** ; corpus listé (95 pièces + 2 d'épilogue), trois pièces rédigées en exemple.
> Règles de jeu propres à l'affaire : `docs/game/AFFAIRE-2.md`. Monde : `docs/monde/`. Bible de
> l'affaire 1 : `docs/scenario/` (ne pas la modifier depuis ce dossier).

## Pitch

Velmarche, février 1976. Un vieil homme se présente à l'Office de Réinscription civile : « Je suis
Bastien Tessonnal. » Le fils du maître verrier de Hautcorvin, accusé de l'incendie de 1937, radié,
mort au bagne de Kessaar en 1944. Il sait tout ; sa sœur dit qu'il n'a pas les yeux de leur mère. Le
rapporteur, titularisé depuis l'affaire de Moulinvert, reconstitue 28 cases sur quatre générations
— verriers, carriers, guides, une graveuse thalbère, une gardienne de refuge, un douanier — dans un
arbre où une case a été **remplie par le requérant** et une autre ne porte qu'un « ? ». L'homme ment
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
| [02-arbre.md](02-arbre.md) | Les 28 cases : schéma, règle des noms, `person` et `occupation`, liste fermée des métiers (24 + 3 leurres), état de départ (1 établie, 1 revendiquée, 1 « ? », 5 cachées), 8 groupes, pièges. |
| [03-chronologie.md](03-chronologie.md) | **Source de vérité** 1790–1976 : officiel vs vrai, pièce produite à chaque date, âges au 2 février 1976, héritiers. |
| [04-personnages.md](04-personnages.md) | Traits héréditaires (fossette, yeux, épi, sourcils, lobe), 28 fiches avec âge du portrait de case et constantes, personnages hors arbre, leurres. |
| [05-secrets-et-fins.md](05-secrets-et-fins.md) | Cinq secrets (S1–S5), rapport (4 questions + décision), quatre fins, paragraphes modulaires, mentions marginales, épilogue. |
| [06-corpus.md](06-corpus.md) | Les **95 pièces** (+ EP-01, EP-02) : type, date, lieu, cote, résumé, mots-clés, ce qu'elles prouvent ; pièces restreintes. |
| [07-coherence.md](07-coherence.md) | Invariants, preuves par case et par champ (N/V/M, ≥ 2 pièces, ≥ 2 chemins), fausses pistes, âges par photo, preuves des secrets, cohérence avec l'affaire 1 et le monde, points faibles. |
| [08-lieux.md](08-lieux.md) | Quatre lieux nouveaux (Vernezac, la Combe-aux-Sables, le Pas de l'Ourse, Dalvezac) avec positions, demandes au `cartographe`, toponymes secondaires, règle de nommage thalbère, institutions et presse nouvelles. |
| [09-illustrations.md](09-illustrations.md) | Règles de dessin, 28 portraits de case, les **trois âges du requérant** et les demi-frères, 6 leurres, 52 illustrations de pièces, ordre de production. |
| [exemples/](exemples/) | Trois pièces rédigées intégralement (ci-dessous). |

## Pièces d'exemple

| Fichier | Pièce | Ce qu'elle fixe |
|---|---|---|
| [of-02-requete.md](exemples/of-02-requete.md) | OF-02, formulaire R-4 du requérant (12 janv. 1976) | Le registre administratif de 1976, la case revendiquée à sa source (nom, métier, photo), le signalement qui contredit déjà 1938 (yeux bruns, main gauche), le T à boucle. |
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

## Points à valider par l'humain

1. **Une seule case revendiquée, un seul champ faux** (le visage) : suffisant, ou faut-il aussi un faux
   métier (« chef de nuit », leurre existant) pour que le joueur ait deux choses à défaire ?
2. **Fin F2 « Le revenant »** : Andrin apprend par le pli qu'il était un fils, seulement s'il a pris le
   nom de son frère. La plus cruelle des fins : la garder telle quelle ?
3. **142 radiés** passés par le Pas (1938–1952) : chiffre modeste et vérifiable (carnet DV-02) ; à garder ?
4. **Peine du requérant** dans F3–F4 : sursis (proposé) ou relaxe ?
5. **Ajouts au monde** à reporter dans `docs/monde/` par qui de droit : loi de 1973 **art. 12**
   (représentation des absents morts en détention), arrêtés d'expulsion de **1916** et **1938**, règle
   thalbère **-ica → -zac**, presse et entreprises nouvelles (*La Sentinelle des Corvins*,
   L'Égide, Studio Orlhac, Compagnie des guides, Musée des Arts du feu, Verrerie de Brénica) et leurs prix.
6. **Carte** : déplacer la source de la Vèze (0,900 · 0,786) pour qu'elle descende du Pas ; ajouter la
   route de Vernezac et les deux sentiers (`08-lieux.md` §1). La Combe-aux-Sables est un lieu « léger »
   (peu de pièces) : la garder sur la carte ou la réduire à un toponyme ?
7. **Teodor Haask** : l'affaire 2 le fait naître en 1912 ; vérifier dans les pièces de l'affaire 1 que
   rien ne le date autrement (fenêtre compatible : 19 févr.–mai 1912, `07-coherence.md`).
8. **PH-07** (photo du personnel, 1937) porte beaucoup de la déduction (Bastien et Andrin côte à côte) :
   accepter cette dépendance ou dédoubler par une seconde photo ?
9. **Brissac / Brossal** : deux noms proches (l'instituteur de l'affaire 1, le fondé de pouvoir). Voulu
   comme bruit de recherche, mais à confirmer.
10. **Tampon « Rétablir chacun »** sans S5 : grisé avec sa raison (proposé) ou masqué ?
11. **Condition de S5** : deux de LT-05, LT-06, LT-11 (proposé) — à arbitrer par `level-designer`.
