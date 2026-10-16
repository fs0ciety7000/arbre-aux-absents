# 05 — Secrets, rapport final et fins (affaire 3)

> L'arbre complet est **nécessaire** pour conclure ; quand il l'est, le joueur **sait** que Blaise
> Garnaud est né Goémard (sa case et sa branche sont posées) et que Noël n'est pas du sang de Siméon
> (sa marque est barrée). Les **secrets** ne sont pas des cases : ils changent le rapport, la
> **décision** et les paragraphes de la fin. Ils sont indépendants et rattachés à des pièces lisibles
> (conditions monotones). Mécanique de décision : celle de l'affaire 2, reprise par le `game-designer`
> (`docs/game/AFFAIRE-3.md` §6) ; conditions arrêtées par le `level-designer`
> (`docs/level/longuegreve.md` §8). Preuves détaillées : `07-coherence.md` §5. v0.2 du 16 oct. 2026.

## 1. Les quatre secrets

### S1 — La fièvre de papier
**Vérité.** Il n'y a pas eu de fièvre à Longuegrève. Le certificat sanitaire est daté du vendredi
13 mars 1908 et affirme une visite « ce jour » ; la vedette du Comptoir est restée à quai ce jour-là ;
le médecin n'a traversé que le samedi 14, n'a vu que deux enfants convalescents de rougeole, et l'a
écrit lui-même : « Pas de fièvre. » Le certificat avait été tapé au Comptoir et signé la veille, à la
demande de Blaise Garnaud, qui voulait la grève. Les deux « décès » sont une fillette morte du croup et
un vieil homme mort de la poitrine.
**Pièces clés.** RP-01 (certificat du 13), RP-03 (livre de bord), RP-04 (journal du feu), RP-05
(registre du médecin), LT-03 (« je le signerai ce soir »). **Appui.** RP-02, RP-07, LT-02, LT-09, EX-02,
RG-04, BD-02, OF-04.
**Condition** : RP-01 lu **et** deux de RP-03, RP-04, RP-05, LT-03 (niveau A : RP-05 est derrière la
porte A).
**Effet.** Ouvre le tampon « Reconnaître la spoliation ».

### S2 — Les quatre coffrets
**Vérité.** De 1908 à sa mort, Blaise a mis de côté, après chaque coup d'ouest, la plus belle pièce
de la part de grève de chaque maison, dans quatre coffrets marqués de leurs têtes, au coffre n° 108 de
la Caisse d'épargne de Port-Sénane, loué pour cent ans « pour les quatre marques ». Il a tenu le compte
dans un livre de grève. Son fils n'a jamais ouvert le coffre ; sa petite-fille non plus. Ce que l'ambre
garde, il le garde entier : la valeur a traversé trois monnaies.
**Pièces clés.** LT-05 (testament), RG-20 (registre des coffres), PV-06 (ouverture), OB-02, DV-01.
**Appui.** LT-08, BD-07 (la devise), PR-04.
**Condition** : PV-06 lu **et** un de DV-01, OB-02. PV-06 exige RG-20 lu (lui-même après LT-05) **et**
les quatre représentants vivants établis, C28 Félix, C29 Rose, C30 Marin, C31 Aline (ou ≥ 28 cases) : la
Caisse n'ouvre qu'en présence d'un porteur de chaque marque (niveau C).
**Effet.** Paragraphe propre dans toutes les fins ; ouvre la fin F3.

### S3 — Le testament de grève
**Vérité.** Siméon Cormaud, qui n'avait plus de fils de son sang depuis 1869, a déclaré en 1890, devant
le desservant et quatre marques, que Noël, l'enfant de l'*Aurore*, était « son fils devant Dieu et
l'héritier de sa lanière ». L'acte, déposé chez Me Lhermet, n'a jamais été enregistré : Noël ne savait
pas qu'il fallait s'y présenter. Au cadastre, la lanière Cormaud est toujours au nom de Siméon.
**Sans S3**, la maison Cormaud n'a pas d'ayant droit : sa part tombe en **déshérence** (à l'État).
**Avec S3**, elle passe à Noël et à ses descendants (Marin).
**Pièces clés.** RG-19 (minute), RG-03 (mention au registre), BD-03 (Victoire). **Appui.** RG-02, RG-05,
RG-10, PR-01, OF-05 (la barre).
**Condition** : **RG-19 lu et un de RG-03, BD-03.** Le titre (la minute) est exigé : une copie et un
témoignage ne suffisent plus (sinon « Rendre l'île » tombait au niveau A). L'étude Lhermet ne communique
RG-19 qu'au vu de la filiation du légataire : C19 Noël établie, ou porte C (niveau B).
**Effet.** Ouvre le tampon « Rendre l'île ».

### S4 — Le fils banni
**Vérité.** En 1870, ce n'est pas Blaise qui a pris l'ambre de la lanière Lestaud, c'est son frère aîné
Josse. Blaise, seize ans, a dit que c'était lui, pour que la maison garde son héritier. Banni, il a pris
pour nom le métier de son île ; il est devenu riche, il a vidé l'île, et il a payé en secret. En 1908, il
a écrit à Josse « je n'ai jamais rien dit pour 1870 » et il est allé le chercher lui-même. Josse a avoué
la veille de sa mort.
**Pièces clés.** BD-04 (l'aveu de Josse), LT-01 (la lettre fermée), DV-01 (« J'ai pris pour J. »).
**Appui.** RG-02 (version officielle : « pour un ambre pris »), RP-06, TG-01, BD-02, LT-07.
**Condition** : BD-04 lu **et** un de LT-01, DV-01 (niveau B).
**Effet.** Change le jugement sur Blaise dans toutes les fins (paragraphe S4) ; Q2 du rapport.

## 2. Le rapport final

Quand les 32 cases sont établies, le joueur rédige son **rapport à la Commission mixte**. Quatre
questions, puis la **décision**. Chaque réponse n'est proposable que si les pièces correspondantes ont
été lues ; une option indisponible est **masquée** ; « Non établi » est toujours proposé. Pas de
pénalité, pas de verdict à l'écran : une réponse fausse est une fin possible
(`docs/game/AFFAIRE-3.md` §6.2).

| Question | Options (✔ = vérité) | Disponible si |
|---|---|---|
| Q1. Pourquoi l'île a-t-elle été évacuée en 1908 ? | Une épidémie de fièvre typhoïde (certificat) · ✔ Pour la concession d'ambre : le certificat a été signé avant la visite · Non établi | fièvre : RP-01 ou PR-03 lu · concession : S1 |
| Q2. Pourquoi Blaise Goémard a-t-il quitté l'île en 1870 ? | Banni pour un vol d'ambre (registre de la chapelle) · ✔ Banni à la place de son frère Josse · Non établi | vol : RG-02 lu · à la place : S4 |
| Q3. Qui hérite de la maison Cormaud ? | Personne : la maison est éteinte (déshérence) · ✔ Les descendants de Noël Cormaud, légataire de Siméon · Non établi | déshérence : RG-05 lu · Noël : S3 |
| Q4. Qu'a laissé Blaise Garnaud aux quatre maisons ? | Rien : le Comptoir à son fils (testament) · ✔ Seize ans de part de grève, dans le coffre n° 108 · Non établi | rien : LT-05 ou PR-04 lu · coffre : S2 |

**Décision** (`choice`, dernière étape ; libellés administratifs) :

| Tampon | Effet administratif | Disponible |
|---|---|---|
| **Indemniser** | « Arrêter la liste des ayants droit des quatre chefs de la matrice de 1868 ; l'île passe à l'État contre indemnité. » | toujours |
| **Reconnaître la spoliation** | « Constater que l'évacuation de 1908 n'avait pas de fondement sanitaire ; demander l'annulation de la concession et la réparation due aux quatre maisons. » | si **S1** |
| **Rendre l'île** | « Refuser l'expropriation : l'île reste indivise aux quatre maisons ; la réserve se fera par convention avec elles. » | si **S3** |

Indisponibles, les tampons sont **grisés** avec leur raison (`unavailableReason`, comme l'affaire 2) :
- « Reconnaître la spoliation » : « Le certificat de 1908 n'est contredit par aucune pièce. »
- « Rendre l'île » : « La maison Cormaud n'a pas d'ayant droit établi. »

**Q3 et « Rendre l'île » sont indépendants** (décidé : le contrat ne lie pas un tampon à une réponse).
Un joueur qui a découvert S3 peut répondre « déshérence » à Q3 et rendre quand même l'île : la fin le
respecte, par la ligne `s3-non` (« La part Cormaud est dévolue à l'État, qui entre dans l'indivision. »).
Ni blocage ni message d'incohérence.

**La branche Garnaud est toujours dans la liste des ayants droit** (l'arbre l'établit) : c'est le prix
de la vérité, pas une option. Le rapport le dit dans toutes les fins : Edmée Garnaud est l'arrière-
petite-fille de Gervais Goémard, et elle hérite, comme Félix.

## 3. Les fins

Une seule fin est jouée (la plus prioritaire dont la condition est vraie) ; ses paragraphes sont
modulaires (tronc commun + un paragraphe par **réponse juste** au rapport + conclusion par décision).
Les conditions portent sur les **réponses** du rapport (`answered`), pas sur les secrets seuls : c'est le
rapport que lit la Commission ; un secret découvert mais non porté au rapport n'a pas d'effet
(`docs/game/AFFAIRE-3.md` §6.4, décidé). Titres provisoires. Fichiers : `endings/f1-…f4-….md`, format
des affaires 1 et 2.

| Prio | Fin | Condition | Résumé |
|---|---|---|---|
| 1 | **F1 — Les quatre lanières** | décision « Rendre l'île » | La Commission suit le rapport : pas d'expropriation. Les Domaines signent avec les quatre maisons une convention de réserve ; le cimetière sera entretenu, on pourra y être enterré. Marin reçoit la lanière Cormaud au nom de Noël. Edmée signe pour la Fourche, à côté de Félix, d'une main qui tremble ; Félix lui tend le couteau. |
| 2 | **F2 — La fièvre de papier** | décision « Reconnaître la spoliation » | Le certificat de 1908 est déclaré sans valeur ; la Commission demande l'annulation de la concession (qui court jusqu'en 1983) et une réparation. L'île est expropriée pour la réserve, l'indemnité versée aux quatre maisons, la réparation à la charge du Comptoir : Edmée paie, et reçoit sa part comme Goémard. Elle dit à l'audience : « Je paie deux fois. C'est juste. » |
| 3 | **F3 — L'ambre gardé** | « Indemniser » **et** Q4 = « le coffre n° 108 » (réponse juste, qui exige S2) | Les ayants droit sont arrêtés, l'île passe à l'État. Le coffre n° 108 est partagé : chaque maison reçoit son coffret. Edmée porte elle-même le coffret de la Fourche aux Cabanes et le pose devant Félix. |
| 4 | **F4 — L'indemnité** | « Indemniser » (toute autre réponse à Q4) | Les ayants droit sont arrêtés, l'île passe à l'État, l'indemnité est versée. Le coffre n° 108 reste fermé : son loyer est payé jusqu'en 2008. Le rapporteur range dans le dossier une fiche : « Coffre 108 — à revoir. » |

Paragraphes modulaires (sections ajoutées dans toutes les fins selon la **réponse** au rapport) :
- **S1** (Q1 = « pour la concession ») : le rapport cite le registre de tournées du Dr Pélissart ; la phrase « Pas de fièvre. Rien à
  signaler » est lue à l'audience. Le nom de Sidonie Lestaud née Brémoy est porté au rapport, avec sa
  postface (« Aucun de ces morts n'est mort de la fièvre »). Dans **F3 et F4**, la concession court
  jusqu'en 1983 et ne sera pas renouvelée.
- **S2** (Q4 = « le coffre ») : le livre de grève de Blaise est versé au dossier ; ses dernières lignes
  (« Le reste à l'ambre ») sont citées. Absent de **F4** par construction.
- **S3** (Q3 = « les descendants de Noël ») : la lanière Cormaud est inscrite au nom des descendants de Noël ; le notaire Lhermet (le
  petit-fils) enregistre enfin la minute de 1890 ; Marin pose l'aviron de Noël contre la croix de
  Siméon. Sinon (`s3-non`), une ligne sèche, la même dans F1 à F4 : « La part Cormaud est dévolue à
  l'État, qui entre dans l'indivision. » (Dans F2 à F4, l'État est indivisaire avant l'expropriation.)
- **S4** (Q2 = « à la place de son frère ») : le rapport dit en une phrase pourquoi Blaise est parti. Félix lit la lettre de 1908 à voix
  haute, au cimetière de l'île, devant Edmée. On taille pour Blaise, sur une croix neuve à
  Longuegrève, sa marque, la Fourche à entaille droite — « il l'avait gardée ». (Aucun code écrit
  dans les textes de fin.)

**Mentions marginales** (arbre après le dénouement, ≤ 40 caractères ; sur les quatre chefs et sur
Blaise) :

| Décision | C01, C03, C07 | C05 Siméon | C13 Blaise |
|---|---|---|---|
| Rendre l'île | « Lanière rendue, 1977 » | « Lanière rendue à Noël, 1977 » (si Q3 = Noël ; sinon « Part de l'État, 1977 ») | « Rendu à la maison Goémard, 1977 » |
| Reconnaître la spoliation | « Spolié en 1908, reconnu en 1977 » | idem, + « Déshérence » si Q3 ≠ Noël | « Rendu à la maison Goémard, 1977 » |
| Indemniser | « Indemnisé, 1977 » | « Indemnisé, 1977 » ou, si Q3 ≠ Noël, « Déshérence, 1977 » | « Rendu à la maison Goémard, 1977 » |

## 4. Épilogue (100 %)

Arbre complet + quatre secrets ; **indépendant de la décision**, avec une ligne qui la rappelle.
**EP-01** — « Note de clôture, dossier 77-0874 » (Rosine Ferrandot, 18 novembre 1977) : le rapporteur
classe le dossier ; au Lecteur, la marque du cadet de Gervais rend désormais une pièce datée de 1977
(le code n'est pas écrit). **EP-02** —
photographie, samedi 3 juin 1978, au cimetière de Longuegrève : Félix, Rose, Marin, Aline, Edmée,
Ginette Sollier et Solange Marest autour d'une croix neuve où sont taillées les quatre têtes, et dessous,
plus petite, la Fourche à entaille droite (dessinée, `::mark`). Au dos, chacun a signé de son nom, puis, à côté, a tracé la tête de sa maison ; Edmée
s'est appliquée. En haut, de la main de Marin : « Nous avons fait nos marques. »

## 5. Rejouabilité

- Quatre fins, quatre paragraphes modulaires, trois tampons dont deux conditionnels.
- **Ordre libre** : trois entrées au départ (la matrice et les marques ; l'opposition du Comptoir ; la
  mémoire de l'île) et une quatrième en attente (les cahiers de Sidonie).
- **Second passage** : BD-02 (« comme à un chien, ou comme à un frère »), BD-07 (« le trident ») et LT-07
  se relisent autrement quand on sait.
- Succès : `docs/game/AFFAIRE-3.md` §7 et `docs/level/longuegreve.md` §8 (« Lire la grève » sur un code
  **jamais écrit** : `O-g-tY`, `Y-g`, `O-g` ; « L'enfant de mer », « Le coffre 108 », « Pas de fièvre »).
  **Décidé (v1.0)** : « Lire la grève » = chercher le code caché de Blaise (`searched` sur le mot-clé `y-d`).
  `O-g-g` n'est plus écrit dans CN-02 (relevé sans cote) et devient lui aussi un code caché.

## 6. Notes de service (décidé : `docs/game/AFFAIRE-3.md` §5)

Les bulles `lg-` de la v0.1 deviennent des **notes génériques**, déclenchées sur les données :
- `mark` (premier affichage d'une case à marque) : « Cette personne ne signait pas. Sa case attend sa
  marque, pas son portrait. »
- `mark-read` (première ouverture du sélecteur d'un champ Marque ; remplace `lg-mark-rule`, écartée parce
  qu'elle aurait dit qu'une marque est fausse) : « Lisez une marque dans l'ordre : la tête, la barre, les
  entailles, les grains, le talon. »
- `recording` (première bande ouverte) : « Une bande d'enquête orale, transcrite. Ce qui y est dit se
  recoupe comme un écrit ; une marque dite n'est pas une marque montrée. »
- `lg-code` est **abandonnée** : c'est OF-06 qui enseigne la cote LX dans la fiction.

## 7. Décisions (16 oct. 2026) et points ouverts

Décidé : conditions S1–S4 (§1, level-designer) ; F3 et sections conditionnées par les réponses ;
« Rendre l'île » permis avec Q3 = déshérence (`s3-non`) ; tampons grisés avec raison ; options de
question masquées. Restent ouverts (à l'humain) :

1. La branche Garnaud **toujours** ayant droit (pas de tampon pour l'exclure) : proposé ; un quatrième
   tampon « Exclure les Garnaud » a été écarté (le droit velmarchois ne connaît pas l'indignité pour une
   faute de 1908 ; et ce serait punir Edmée pour Blaise).
2. F2 « Reconnaître la spoliation » sans réponse juste à Q3 : la part Cormaud tombe quand même en
   déshérence (ligne sèche) ; confirmé par le `game-designer`, à valider par l'humain.
3. Estimation des coffrets (180 000 Fn) : proposée pour que S2 compte autant que l'indemnité
   (295 000 Fn).
