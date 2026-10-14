# 05 — Secrets, rapport final et fins (affaire 2)

> L'arbre complet est **nécessaire** pour conclure ; quand il l'est, le joueur **sait** que le
> requérant est Andrin (son visage est dans la case « ? »). Les **secrets** ne sont pas des cases :
> ils changent le rapport, la **décision** et les paragraphes de la fin. Ils sont indépendants et
> tous rattachés à des pièces lisibles (conditions monotones). Règles de jeu : `docs/game/AFFAIRE-2.md`
> §3 (trois tampons, quatre fins). Preuves détaillées : `07-coherence.md` §5.

## 1. Les cinq secrets

### S1 — Le feu de 1937
**Vérité.** Aimé Brossal a mis le feu au magasin des emballages de la halle de Vernezac, dans la nuit du
27 au 28 novembre 1937, pour toucher l'assurance qu'il avait presque triplée sept semaines plus tôt. Il
a arraché la page de la main courante du gardien de nuit et laissé accuser Bastien, le meneur de la
grève. Colombe le soupçonne depuis 1952 (lettre de Mallet) et le sait depuis 1958 (pli cacheté).
**Pièces clés.** RG-18 (foulage : « 23 h 10 — M. B. au magasin »), RP-02 (départ du feu loin des fours,
pétrole, avenant), LT-10 (Mallet). **Appui.** LT-04 (Bastien), LT-09 (pli de Colombe), PV-03, RP-01.
**Effet.** Le nom de Bastien est lavé de l'incendie. Dans la fin « Le revenant », il décide si le
requérant porte ou non une condamnation qui n'est pas la sienne.

### S2 — Le Pas de l'Ourse
**Vérité.** De septembre 1938 à avril 1952, Lucie Neviot et son père Jules (tué le 12 février 1944) ont
fait passer en Thalberie, par le Pas de l'Ourse, cent quarante-deux radiés. Après la mort de Jules,
le douanier Victorin Sarrade, qui avait reconnu Lucie dès le 21 mai 1938, a « regardé ailleurs ». Le
requérant connaît le sentier parce que Bastien le lui a décrit au bagne, pierre par pierre.
**Pièces clés.** DV-02 (carnet des « moutons »), PR-06 (hommage des familles, 1953), PV-06 (Victorin).
**Appui.** CP-02, RG-16 (« chute »), PB-01, PV-01 (description du Pas par le requérant).

### S3 — Le fils de la Thalbère
**Vérité.** Andrin est le fils d'Honoré, pas de Léonce. Léonce a accepté d'être parrain et de porter
la rumeur ; Honoré a payé une pension par l'atelier de gravure de 1912 à 1938, a appris de la bouche
d'Andrin (télégramme de 1952) la mort de Bastien, et a écrit en 1973 « à mes enfants vivants » en
pensant à lui, avec un pli scellé « à celui de mes enfants qui n'a pas porté mon nom ». Andrin ne l'a
jamais su : il croit être le fils de Léonce. **Il n'avait pas besoin de mentir** : il est héritier
sous son propre nom.
**Pièces clés.** CP-01 (Léonce à Tennok de novembre 1911 à février 1912), LT-01 (« Léonce sera
parrain, il veut bien porter cela pour moi »), DV-01 (journal de sœur Agathe). **Appui.** LT-02,
LT-03, LT-08, RG-17 (« supplément sur ordre de M. Honoré »), RG-05, TG-01, PH-13, la fossette.

### S4 — La Coupe du Régent
**Vérité.** En septembre 1941, Andrin a gravé dans la couronne de laurier de la Coupe offerte au Régent
trois signes minuscules, **B · T · 38**, pour son frère radié. Aimé Brossal les a repérés et l'a
dénoncé. Andrin a été radié pour avoir écrit le nom de Bastien : c'est ainsi qu'ils se sont retrouvés
dans la même cellule.
**Pièces clés.** OB-01 (la Coupe et ses signes), RP-05 (R, dénonciation signée « A. Brossal »),
EX-04 (même main que le verre de 1959). **Appui.** PR-05, RG-12 (« intelligence avec un radié »), PH-10.

### S5 — La fille du souffleur (filiation d'Agnès)
**Vérité.** Agnès est la fille de Bastien, conçue au refuge en mai 1938, quelques jours avant
l'arrestation, et non celle « du Thalbère » (rumeur de 1938). C'est le secret qui ouvre le tampon
« Rétablir chacun » (`docs/game/AFFAIRE-2.md` §3.2) : établie par deux pièces, la filiation fait
d'Agnès l'héritière de la part de son père (loi de 1973, art. 12). C'était tout ce qu'Andrin voulait.
**Pièces clés.** LT-05 (lettre de Lucie à Bastien, févr. 1939, retournée « destinataire absent » :
« Elle est née le 14… elle a ton épi »), LT-06 (billet de Bastien, 1944 : « Dis à la petite… »),
LT-11 (Lucie à Agnès, 1969). **Appui.** DV-02, PH-08 (« Pour B. »), PH-12 (l'épi), PV-06, RP-04 (« une
femme a pris la fuite »), OB-02.
**Condition proposée** : `secret` S5 découvert = lu **au moins deux** de LT-05, LT-06, LT-11 (preuve
par deux pièces, comme la loi). À arbitrer par le `level-designer`.

## 2. Le rapport final

Quand les 28 cases sont établies, le joueur rédige son **rapport à la Commission**. Quatre questions,
puis la **décision**. Chaque réponse n'est **proposable** que si les pièces correspondantes ont été
lues (sinon « Non établi »). Pas de pénalité : une réponse fausse est une fin possible.

| Question | Options (✔ = vérité) | Disponible si |
|---|---|---|
| Q1. Qui a mis le feu à la halle des fours en 1937 ? | Bastien Tessonnal (liste de 1938) · ✔ Aimé Brossal · Non établi | Bastien : RG-11 ou RP-01 lu · Aimé : S1 |
| Q2. Qui faisait passer les radiés par le Pas de l'Ourse ? | Andrin Dalvarin (soupçon de la Garde, 1938) · ✔ Lucie Neviot et son père Jules · Non établi | Andrin : RP-03 lu · Lucie et Jules : S2 |
| Q3. De qui Andrin Dalvarin est-il le fils ? | Léonce Tessonnal (son parrain) · ✔ Honoré Tessonnal · Non établi | Léonce : RG-05 ou PV-01 lu · Honoré : S3 |
| Q4. Pourquoi Andrin Dalvarin a-t-il été radié ? | Outrage au Régent · ✔ Il avait gravé le nom de son frère ; Aimé Brossal l'a dénoncé · Non établi | outrage : RG-12 lu · gravé : S4 |

**Décision** (`choice`, dernière étape ; libellés administratifs, `docs/game/AFFAIRE-2.md` §3.2) :

| Tampon | Effet administratif | Disponible |
|---|---|---|
| **Dénoncer** | « Rejeter la requête et signaler l'usurpation d'identité. » | toujours |
| **Rétablir chacun** | « Réinscrire Bastien Tessonnal à titre posthume ; reconnaître Agnès Neviot, sa fille ; inscrire Andrin Dalvarin sous son nom » + « fils d'Honoré Tessonnal » si S3. | si **S5** |
| **Laisser vivre le mensonge** | « Recevoir la requête : inscrire le requérant sous le nom de Bastien Tessonnal. » | toujours |

Raison grisée de « Rétablir chacun » sans S5 : « La filiation d'Agnès Neviot n'est pas établie par
deux pièces. »

**Coût écrit de « Laisser vivre le mensonge »** (à ne pas adoucir) : Andrin renonce à son propre nom et
à celui de sa mère ; sa réinscription de 1953 est annulée ; si S1 n'est pas établi, le nom qu'il prend
reste celui d'un incendiaire (prescrit, jamais lavé) ; s'il est le fils d'Honoré (S3), il hérite
quand même, mais comme Bastien, d'un père qu'il croit être son oncle.

## 3. Les fins

Une seule fin est jouée (la plus prioritaire dont la condition est vraie) ; ses paragraphes sont
modulaires (tronc commun + un paragraphe par secret juste + conclusion par décision). Titres
provisoires. Fichiers proposés : `endings/f1-…f4-….md`, format de l'affaire 1 (`## [commun]`,
`## [s1]`…).

| Prio | Fin | Condition | Résumé |
|---|---|---|---|
| 1 | **F1 — Chacun son nom** | décision « Rétablir chacun » | La Commission réinscrit Bastien Tessonnal à titre posthume (« mort à Kessaar le 9 mars 1944, innocent » si S1), reconnaît Agnès comme sa fille et héritière de sa part, et rend à Andrin son nom. Me Escande ouvre le pli scellé ; s'il est adressé à un enfant **établi** (S3), il est remis à Andrin : la lettre commence par « Andrin, ». Andrin et Agnès montent ensemble au refuge. |
| 2 | **F2 — Le revenant** | décision « Laisser vivre » | « Bastien Tessonnal, vivant » est réinscrit et reconnaît Agnès. Paragraphe variable **S1** : prouvé, le rapport lave le nom qu'il porte ; non prouvé, il porte l'incendie. Paragraphe **S3** : le pli scellé, « à celui de mes enfants qui n'a pas porté mon nom », est remis au requérant au titre de Bastien ; il l'ouvre ; la lettre commence par « Andrin, ». Il apprend, trop tard, qu'il était un fils. Le rapporteur garde dans un tiroir le rapport qu'il n'a pas remis. |
| 3 | **F3 — L'imposteur, la fille reconnue** | « Dénoncer » + S5 | Le requérant est convaincu d'usurpation (peine avec sursis, au regard des « circonstances »). Bastien est réinscrit à titre posthume ; Agnès est établie sa fille et hérite de sa part. Elle va attendre Andrin à la sortie du tribunal d'Aubrelieu. |
| 4 | **F4 — L'imposteur** | « Dénoncer » sans S5 | Requête rejetée ; Bastien réinscrit à titre posthume ; la requête 74-0962 reste « non établie ». Colombe est seule héritière. Andrin repart par le col. Une semaine plus tard, Agnès reçoit un verre gravé : le Pas de l'Ourse, sans date. |

Paragraphes modulaires (ajoutés si le secret est juste, dans toutes les fins) :
- **S1** : le rapport nomme Aimé Brossal ; Colombe se lève à l'audience, remet elle-même le pli de 1958
  et dit : « Mon frère n'a pas mis le feu. Je le sais depuis dix-huit ans. » Le nom de Toussaint Mallet
  est cité au rapport.
- **S2** : une plaque de verre gravé est posée au refuge de l'Ourse : « Par ce pas, de 1938 à 1952,
  Lucie et Jules Neviot ont fait passer cent quarante-deux absents. » Victorin la fixe lui-même.
- **S3** : le pli d'Honoré est lu (texte de la lettre, une page : il n'a jamais su dire « mon fils »
  autrement qu'en verre ; « Léonce a porté ce que je n'ai pas porté »).
- **S4** : la Coupe du Régent sort du fonds des pièces à conviction et entre au Musée des Arts du feu
  avec un nouveau cartel : « Andrin Dalvarin, 1941. Dans le laurier : B · T · 38. »

**Mentions marginales** (arbre après le dénouement, ≤ 40 caractères, sur le trio) :

| Décision | C15 Bastien | C17 Andrin | C25 Agnès |
|---|---|---|---|
| Rétablir chacun | « Réinscrit à titre posthume, 1976 » | « Rétabli sous son nom, 1976 » | « Filiation établie, 1976 » |
| Laisser vivre | « Inscrit vivant, 1976 » | « Absent par choix, 1976 » | « Reconnue par le requérant, 1976 » |
| Dénoncer + S5 | « Réinscrit à titre posthume, 1976 » | « Requête rejetée, 1976 » | « Filiation établie, 1976 » |
| Dénoncer | « Réinscrit à titre posthume, 1976 » | « Requête rejetée, 1976 » | « Filiation non établie » |

## 4. Épilogue (100 %)

Arbre complet + cinq secrets ; **indépendant de la décision** (game design §3.4), avec une ligne qui
la rappelle. **EP-01** — « Note de clôture, dossier 76-0012 » (Rosine Ferrandot, mars 1976) : le
rapporteur classe le dossier ; au Lecteur, une recherche « Bastien Tessonnal » rend désormais deux
lignes, et l'une est datée de 1976. **EP-02** — photographie, 10 juillet 1976, devant le refuge de
l'Ourse : Agnès, Andrin, Victorin, Pierre, Gilles, Brigitte, Hugues ; Colombe, venue en voiture
jusqu'au col, est un peu à l'écart, le seul manteau noir dans la neige d'été. Au dos, de la main
d'Agnès : « Tous les vivants. »

## 5. Rejouabilité

- Quatre fins, paragraphes modulaires, mentions marginales : beaucoup de rapports différents.
- **Ordre libre** : quatre entrées dès le départ (la requête et sa première audition, l'opposition, le
  testament et son pli, la requête d'Agnès) et un billet anonyme.
- **Second passage** : les procès-verbaux (PV-01, PV-02) sont écrits pour être relus ; on y voit Andrin
  parler de lui-même à la troisième personne, et de sa mère.
- Succès narratifs : voir `docs/game/AFFAIRE-2.md` §4 (aucun à ajouter ; le n° 21 « Matricule » porte
  sur la recherche « 1171 »).

## 6. Bulles `hc-` (textes proposés)

- `hc-claim` : repris tel quel de `docs/game/AFFAIRE-2.md` §2.4.
- `hc-hearing` : idem.
- `hc-decision` : idem.

## 7. À trancher par l'humain

1. La fin **F2** révèle à Andrin qu'il était un fils, mais seulement s'il a pris le nom de son frère :
   c'est la plus cruelle. Garder ce paragraphe tel quel ?
2. Le nombre de radiés passés par le Pas (**142**) : à garder modeste ou à grandir ?
3. Peine du requérant dans F3–F4 : sursis (proposé) ou relaxe ?
