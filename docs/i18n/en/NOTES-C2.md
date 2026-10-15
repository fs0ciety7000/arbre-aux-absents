# Notes pour la relecture C2 (remontées des lots de traduction)

## V6 (aides/succès Varenque)
- Citations des aides niveau 3 à recouper mot pour mot avec les pièces traduites : c02-3 "Mrs Varenque, a distinguished botanist"; c03-3 "second master mariner"; c08-3 "father not named"; c10-3 "coxswain A. Varenque"/"lifeboat coxswain"; c12-3,c26-3 "Director of the Paper Mills"; c16-3 "at the Moulinvert Paper Mills"; c19-3 "head costume maker"; c22-3 "editor of the banned sheet Vel Taalik"; c23-3 "aged 20, student"; c27-3 "journalist on the Courier"; c29-3 "his daughter Claude, a woman engineer", "Miss C. Sauge, woman engineer at the CVC".
- Titres de pièces cités : "The paper trades", "The wedding of the year", "the women who welcome", "the new grey booklet", "The keeper's family", "The Tennok lifeboat and its crew".
- Genre : c29-1, c04-3, succès la-nouvelle-fougere (photographer of Vellaak neutre), celui-que-la-mer-voulait-garder.
- Titres de succès à aligner sur les fins : le-faux-coupable, les-deux-visages, la-mere-et-la-fille, l-arbre-entier.
- Backlog : ligne « dressée et gravée par… » du cartouche mord sur le filet hachuré (labels.py), FR et EN.
## H2
- ex-02 barre du T : lt-04 doit ouvrir deux phrases par « Tell… » (relayé à H3) ; rg-15 « The whole of the foregoing is true » ; tg-02 « the Ts ».
- ex-02 : L. Daubry « a woman who mends paper » (incise ajoutée) à valider.
- ex-01 : « quarante-neuf ans » (1976-49 = 1927, pas 1937) : vérifier dans la bible si voulu.
- rg-15 : « the son of the woman engraver ».
## H3/H4
- of-08 (FR) : alt dit coupe de travers, corps dit « bien droit » : contradiction dans la source, à trancher par scenariste.
- pr-09 lien explicite [[dove|colombe]] ; lt-09 « stamped with a dove for Colombe ».
- of-06 « my cousin … she took it down » ; of-07 « C. Sauge (Miss), engineer ».
- ct-01/ct-02 modèles en français (« Laurier »), ex-04 aligné.
## V2
- c29-3 cite « his daughter Claude, a woman engineer » mais pr-15 dit « his daughter, Miss Claude Sauge, a woman engineer at the Velmarche Calculating Company » (le FR non plus n'a pas la citation exacte) : aligner l'aide.
- c19-3 « head costume maker » vient d'une autre pièce (1948) ; pr-14 l'emploie aussi.
- pr-06 « née Varenque » pour éviter le lien a-varenque.
- la Citadelle → the Citadel (à harmoniser).
## V4
- of-02 FR : « qu'il lise le dossier » autolie le mot-clé `lise` (faux positif dans la source, en jeu FR aussi) → EN a [[reads|lise]] pour la parité. Corriger la source (reformuler ou exclusion) puis retirer le lien EN.
- of-02 : [[absent|absents]] explicite ; « file: » détecté comme URL externe (faux positif du validateur, contourné par un tiret).
- lt-02 lettre ostrienne gardée telle quelle (avertissement voulu), « Phares et Balises » → « Lights and Beacons ».
- of-06 « L. Daubry (Miss), conservator » ; lt-15 « Whoever had them burned … he » ; lt-08 « the only woman engraver ».
## V3
- Table succession-varenque.md §3 fausse sur « filigrané » (lie filigrane) : corriger la doc.
- rp-06 L. Daubry : « I am the adopted daughter of Mrs Blanche Daubry, née Varenque ».
- Prison de Kessaar : gardien → keeper (pour le lien).
- Toussaint → All Saints' Day (rg-18), à valider.
## H1
- Broche à la colombe : [[dove|colombe]] explicite (ph-06, ph-07, ph-14, ph-15, pr-09, lt-09) ; jeu de mots perdu, l'indice ne passe que par le lien. À juger.
- ph-09 « tourbillon » → whorl (≠ cowlick, comme la source).
- pv-01 pli scellé → a sealed letter.
## V5
- dv-01 FR « il faut que cela se lise à travers le papier » lie `lise` (même faux positif que of-02) → EN [[read|lise]].
- an-03 « Lighthouse Studio » (traduit pour garder le lien phare) ; cp-03 « Dear Madam » ; osmunda.
- gardien hors phare → keeper (ct-02, f3, f5), contredit la table.
- dv-01/dv-03 « Operator: L. D. » perd le genre.
- Titres des fins : File in Order, The False Culprit, The Two Faces, Mother and Daughter, Mother and Daughter (Absent), The Whole Tree.

## Relecture C2 (level-designer) — décisions

Tous les points ci-dessus sont traités ; détail dans `GLOSSAIRE.md` §4.3 et §9.5 et dans les deux
tables d'affaire (Varenque §3 et §4, Hautcorvin §4 et §6).

- **Citations des aides de niveau 3** : contrôle par script (sous-chaîne exacte de la pièce, à la
  casse et à l'emphase près). Hautcorvin : 25/25 conformes. Varenque : 13 aides réécrites (c02, c04,
  c07, c08, c11, c13, c14, c18, c21, c22, c26, c29, c30) pour citer le texte exact au lieu d'une
  paraphrase ou de cellules de tableau recousues (ex. c22 *“woman editor of the banned sheet Vel
  Taalik”*, c29 *“his daughter, Miss Claude Sauge, a woman engineer”*). Les six titres de pièces
  cités correspondent. Seule citation hors pièce : *“Artist’s model”* (c08), libellé de métier.
- **Genre** : *The Photographer of Vellaak*, *The Informer*, *Glass gilder* gardés (le genre est dit
  dans les pièces, OF-07 *Sh  is not…*, *Mrs Tessonnal herself*) ; DV-03 → *Operator: Miss L. D.* ;
  c29-1, c04-3, succès `la-nouvelle-fougere` et `celui-que-la-mer-voulait-garder` (Firmin, masculin
  voulu) conformes. EX-02 *a woman who mends paper* validé.
- **`lise` verbe** : source française corrigée (OF-02 *qu'il aille au bout du dossier* ; DV-01 *que
  cela se voie à travers le papier*), liens explicites anglais retirés. Autres liens fortuits
  repérés et **gardés** (parité tenue, effet jugé inoffensif) : *goéland* minuscule → `le-goeland`
  (CP-02, CT-02, DV-05, PR-07) ; *tilleuls* (arbres) → `tilleuls` (PH-05, PH-22) ; *gardien* de prison
  → `gardien` (RG-14) ; *le thalbère* (langue) → `thalbere` (RP-03, affaire 2) ; *colombe* →
  `colombe` (affaire 2, voulu : la broche).
- **EX-01 « quarante-neuf ans »** : voulu (brûlure de 1927). **OF-08** : `alt` corrigé (FR et EN)
  d'après le texte, *coupée aux ciseaux*.
- **Harmonisation** : *the Citadel* (RG-15, RG-18, RP-04) ; *Registers Bureau* (PR-08, PR-16, PB-04,
  RG-13, RG-15, RG-19, RP-05 de l'affaire 2). Table Varenque §3 *filigrané* corrigée.
- **Solveur** : `content:solve -- --locale en` identique au français (118 et 98 pièces, 30 et 28
  cases, 6 et 4 fins atteignables, 0 erreur). Parité des liens vérifiée aussi **en nombre** par pièce
  et par mot-clé : 12 écarts de compte seulement, tous dans une pièce qui lie déjà le mot-clé.

### Reste à l'arbitrage humain

- Les citations **françaises** des aides de niveau 3 de la Varenque sont souvent des paraphrases ou
  des cellules recousues (ex. c02-3 « fils de Anselme Varenque, papetier… », c04-3, c08-3, c13-3,
  c14-3, c18-3, c21-3, c22-3, c26-3, c29-3 « sa fille Claude, ingénieure », c30-3) : hors périmètre
  de ce lot (`hints.json` source), à aligner de la même façon par le level-designer en FR.
- Les liens fortuits gardés ci-dessus (surtout PR-07 *un goéland* → le Goéland) : à confirmer par le
  scénariste.
