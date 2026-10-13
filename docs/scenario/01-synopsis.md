# 01 — Synopsis

## 1. Pitch

**Velmarche, octobre 1974.** Une vieille institutrice vient de mourir à 94 ans dans sa maison des
Tilleuls, à Moulinvert, au bord des papeteries qui ont fait la fortune de sa famille. Son testament
lègue tout « à tous les descendants vivants de mon père Anselme et de mon oncle Firmin », et demande à
l'État de réinscrire « ceux que nous avons rendus absents ». Pendant quinze ans, la Régence a effacé
des registres des milliers de personnes ; la loi de 1973 permet enfin de les y remettre — à condition
de le **prouver**.

Le joueur est rapporteur à l'Office de Réinscription civile. Il a un arbre de trente cases, cinq
semaines, une montagne de papiers et un terminal flambant neuf qui interroge les archives nationales.
Il découvrira qu'une famille de papetiers a fabriqué à la fois le papier qui effaçait les gens et
celui qui les sauvait.

## 2. La mission du joueur

- **Qui.** Le « rapporteur » (sans nom, sans genre imposé), stagiaire de l'**Office de Réinscription
  civile (ORC)**, Aubrelieu. Dossier **n° 74-0318 — Succession Adélaïde Varenque, requête testamentaire**.
- **Quoi.** Établir le « tableau de filiation » de la descendance d'Anselme et de Firmin Varenque :
  pour chaque personne, **l'identité** (prénom et nom), **la reconnaissance de portrait** et **la
  qualité** (métier). Ces trois champs sont ceux du formulaire de l'Office (le formulaire de 1973 exige
  la reconnaissance de portrait parce que la Régence a falsifié trop d'actes : un visage ment moins
  qu'un registre).
- **Règle des deux pièces.** La loi n'admet une identité que si **deux pièces concordantes** l'établissent.
  C'est la justification diégétique de la **validation par groupes** : la Commission n'examine pas
  une fiche isolée, elle tamponne un ensemble cohérent.
- **Enjeu.** Le legs (les Tilleuls et 18 % des Papeteries) se partage entre les héritiers établis ;
  des absents sont réinscrits ; une filiation volée est rétablie. Armand Varenque, avocat et petit-neveu,
  fait opposition.
- **Échéance.** Audience de la Commission le 15 novembre 1974 (purement diégétique ; le mode
  chronométré est une option du jeu, pas une contrainte du récit).

## 3. Le moteur de recherche dans le monde : le Lecteur LX-2

Depuis novembre 1973, la salle de lecture des **Archives nationales** (palais des Chartes, Aubrelieu)
dispose d'un **Lecteur LX-2** de la Compagnie Velmarchoise de Calcul : écran vert, clavier, imprimante.
Il interroge le **Fonds Central Indexé**, un index sur bande magnétique où des indexeurs ont noté, pour
chaque pièce, ses **vedettes** : noms de personnes, de lieux, d'organisations, et quelques mots-sujets.

Ce que cela justifie, pour `game-designer` :
- **Recherche par terme exact** : le Lecteur ne connaît que ce que les indexeurs ont noté ; une faute,
  un synonyme, une périphrase ne rendent rien (« correspondance exacte du terme normalisé », contrat §3.5).
- **Les pièces arrivent par cotes** : le Lecteur imprime une cote, l'archiviste apporte la pièce (ou
  sa reproduction sur microfiche) au bureau du rapporteur : c'est l'animation de « déblocage ».
- **Fonds restreints** (loi du 14 mai 1973, art. 9) : les archives du Bureau des Radiations, du bagne
  de Kessaar et de l'Œuvre des Pupilles ne sont communicables **que sur demande nominative exacte**
  (« Prénom Nom »). Une recherche « Kessaar » rend la presse, pas les registres d'écrou ; « Odile
  Varenque » rend sa fiche. Gating diégétique et propre.
- **Langues** : les termes ostriens sont indexés tels quels (*Maask*, *Ilvess*) ; il faut les avoir
  lus ou déduits (lexique DV-05).
- **La carte** : la grande carte murale de la Velmarche, dans le bureau de l'Office, porte des
  punaises ; chaque lieu ouvre les pièces classées « par lieu » dans les archives départementales.

L'ingénieure qui a conçu le Lecteur, Claude Sauge, est une des cases de l'arbre.

## 4. La vérité cachée (résumé)

1. **Lucien**, l'artiste, a eu un fils d'une blanchisseuse, **Victor Sauge**, futur aviateur ; il l'a
   reconnu devant notaire en 1917 ; son frère Augustin, député, a fait enterrer l'acte.
2. Au cap de Tennok, la branche ostrienne : **Maaren**, gardienne du phare ; son fils **Aldrik** mort
   en 1924 en sauvant des « inconnus » qui étaient son propre fils **Firmin**, contrebandier.
3. Sous la **Régence** (1937–1952), **Gaspard** dirige les Papeteries qui fournissent le papier des
   « carnets gris » ; sa sœur **Odile**, graveuse de filigranes, fabrique avec son compagnon ostrien
   **Orrin** des faux papiers sur le même papier : le **réseau Fougère**.
4. **Marcel Daubry**, beau-frère, commissaire aux Registres, dénonce le réseau (1941). Odile et Orrin
   sont envoyés au bagne de **Kessaar**. Odile y accouche d'**Élise** ; l'enfant est enlevée par l'Œuvre
   des Pupilles ; Marcel la prend chez lui et l'adopte : elle devient **Lise Daubry**.
5. Orrin est fusillé. Odile est déclarée morte (1943) : **Adélaïde** a payé l'évasion, le gardien
   Haask a écrit le faux décès, Firmin l'a emportée dans une caisse à poisson. Elle vit depuis 1946 à
   Vellaak sous le nom de **Nora Ilvess**, photographe.
6. Le fils de Gaspard, **Augustin**, est fusillé en 1944 ; Gaspard fournit alors en secret le réseau
   jusqu'à la chute du régime (le **registre bleu**), se tait à son procès et meurt en 1971 tenu pour
   collaborateur — et, par sa propre fille, pour le délateur de sa sœur.
7. Marcel brûle les registres des Pupilles, fuit, meurt en Thalberie sous un faux nom (1959).
8. **Adélaïde** reconnaît Lise en 1961 à sa mèche blanche ; faute de preuve, elle attend, puis écrit
   un testament qui oblige l'État à prouver, pièce par pièce, ce qu'elle sait. Lise, devenue
   restauratrice aux Archives, a elle-même inventorié le fonds.

L'arbre complet suffit à établir les filiations ; les **secrets annexes** (05) établissent qui a fait
quoi, et changent la fin.

## 5. Ton

- **Mélancolique et chaleureux**, jamais sordide : la violence de la Régence passe par ses **papiers**
  (listes, fiches, avis, tampons), pas par des scènes. On ne montre aucune exécution.
- **Humour discret** dans la presse mondaine, les publicités, les annuaires, les lettres de Tante Adé.
- **Le papier comme personnage** : filigranes, tampons, carbones, papier à cigarette, microfilm. Le
  même filigrane à la fougère signe la médaille de 1889, les faux papiers de 1944 et les lettres de
  « N. ». Le thème : *le papier qui efface et le papier qui sauve*.
- **Points de vue multiples** : chaque document a une voix (administrative, intime, propagandiste,
  journalistique, ostrienne). Aucun narrateur omniscient avant les fins.
- **Respect des absents** : les fins ne punissent jamais le joueur ; une erreur produit une autre
  histoire, pas un écran d'échec.

## 6. Ouverture (scène de départ)

Bureau 12, troisième étage de l'Office, lundi 7 octobre 1974, 8 h 40. Sur la table : une chemise
cartonnée (OF-01 à OF-04), une note du service informatique (OF-05), l'inventaire du fonds
(OF-06) — et, glissée sous la porte, une enveloppe sans expéditeur postée de Vellaak (OF-07). Au mur,
la carte de la Velmarche. Dans le couloir, le claquement de l'imprimante du Lecteur.
L'arbre est au tableau : une case pleine (Tante Adé), deux à moitié, vingt-trois vides, dont quatre
marquées d'un point d'interrogation. Quatre autres cases n'apparaîtront qu'en chemin.
