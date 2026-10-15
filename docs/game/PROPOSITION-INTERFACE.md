# Proposition : agencer le Bureau, mieux lire les textes

> Retour des joueurs (propriétaire, octobre 2026) : « pouvoir agrandir le tableau de l'arbre mais
> aussi le panneau où il y a les textes ; le bouton "agrandir" (panneau de droite) ne fonctionne
> pas ; pouvoir agencer / redimensionner comme on veut. Les joueurs ne voyaient pas forcément bien
> les textes. » Statut : **proposition** (rien d'implémenté hors correctif §1). Auteur : design-lead.

## 1. Ce qui était cassé (corrigé, commit `3dc741a`)

- **« Agrandir » du Lecteur (zoom avant)** : la feuille est posée de travers (−0,5°) autour de son
  centre. Le zoom agrandit le texte dans une colonne de même largeur, donc la feuille s'allonge au
  carré (×1 : 5 700 px pour la lettre de mission dans un volet de 440 px ; ×4 : 39 000 px) et ses
  bords dérivaient de h/2·sin 0,5° : jusqu'à 120 px. Les premières lignes sortaient à gauche du
  Lecteur (débord non défilable), les dernières à droite : le texte « agrandi » était coupé.
  Correctif : inclinaison bornée selon la hauteur (dérive ≤ 4 px), marges latérales non zoomées,
  tampons longs à la ligne.
- **Poignée du volet en tablette paysage** (600–1279 px, donc aussi les portables en 1366×768 ou
  1920×1080 à 150 %) : affichée, focalisable, annoncée « Largeur du volet latéral », mais la
  grille 55/45 l'ignorait. Elle règle désormais la largeur (60 % au plus).
- Test : `tests/e2e/game/reader-zoom.spec.ts` (1440×900, 1280×720, 1024×768).

## 2. Pourquoi on lit mal (constats sur le jeu réel)

1. Le Lecteur vit dans un volet de **440 px** par défaut : colonne de ~360 px de texte, barre
   d'outils en mode compact (icônes seules). La poignée existe mais ne se voit pas (un trait de
   2 px), et la largeur choisie **n'est pas mémorisée** (perdue à chaque partie).
2. Le seul levier de taille est le **zoom ×1–×4**, qui grossit aussi titres, tampons et marges ;
   au-delà de ×1,5 la colonne tient 10 à 15 caractères par ligne. Il manque un réglage « taille
   du texte » propre au Lecteur ; celui des Options (`textScale`) agit sur tout le jeu.
3. Le corps de lecture (`--step-read`, 17–19 px) est correct pour du romain, juste pour la
   machine à écrire et l'écriture manuscrite (Caveat, ×1,3) des pièces d'archives.
4. Rien ne permet de donner la place au document **ou** à l'arbre selon le moment : le duo
   côte à côte est figé, le seul autre état est « volet replié » (bouton en en-tête, peu lisible).

## 3. Trois options

### Option 1 — « Lecture confortable » (adaptation légère) · effort **S**

**Ce que voit le joueur.** Dans la barre du Lecteur, un groupe **A− / A+** (5 crans, 90 à 150 %)
à côté du zoom ; la lecture démarre un cran plus grande (`--step-read` ×1,1). La poignée du
volet devient visible (encoche à 3 points, curseur ↔, infobulle « Glisser pour élargir · double-clic
pour basculer 440 / 640 px »). La largeur du volet et la taille du texte sont **mémorisées**.

- **Règle** : « ne voyaient pas bien les textes » (taille), « redimensionner » (poignée trouvable,
  mémorisée), « agrandir le panneau des textes » (double-clic = volet large).
- **Ne règle pas** : agrandir l'arbre ; agencement libre.
- **Clavier / manette / tactile** : `Alt++` / `Alt+-` dans le Lecteur (remappables ; `Ctrl` est
  pris par le zoom du navigateur), boutons ≥ 44 px atteignables à la croix ; tactile : pincement
  réservé au zoom, A−/A+ au doigt.
- **Risques** : contrat `Settings` (2 champs : `readScale`, `sideWidth`) → orchestrateur ;
  vérifier la loupe (Maj) et les surlignages à chaque cran (déjà indépendants du zoom) ; aucun
  risque Tauri ; téléphone inchangé (A−/A+ en menu « ⋯ » si la barre déborde).

### Option 2 — Dispositions prédéfinies « Enquête / Lecture / Arbre » · effort **M** (recommandée)

**Ce que voit le joueur.** Un sélecteur à trois positions dans l'en-tête (maquettes) :

- **Enquête** (défaut, l'actuel) : arbre + Lecteur côte à côte, poignée libre.
- **Lecture** : le Lecteur prend ~60 % (900 px à 1440), feuille centrée en colonne de 70 caractères,
  texte un cran plus grand ; l'arbre reste visible en colonne étroite pour déposer une pièce.
- **Arbre** : l'arbre occupe tout le Bureau ; le Lecteur devient une **fiche flottante** (500 px)
  posée sur l'arbre, déplaçable et repliable en onglet ; on glisse un nom de la fiche vers une case.

Plus Option 1 (A−/A+, poignée visible, mémorisation), dont elle est la suite naturelle.
Un document ouvert depuis l'arbre en disposition Arbre ouvre la fiche flottante ; « Vers
l'arbre » depuis la disposition Lecture repasse en Enquête.

- **Règle** : les trois demandes (agrandir l'arbre, agrandir les textes, agencer), sans écran
  vide ni réglage fin à faire : un clic.
- **Clavier / manette / tactile** : `Alt+1/2/3` (remappables, ECRANS §6), une touche de la manette
  à fixer dans le schéma (ECRANS §6), sélecteur ≥ 44 px ; en tablette paysage mêmes trois dispositions ; en tablette portrait
  et téléphone, déjà « un panneau à la fois » : on ne garde que A−/A+ (le Lecteur est plein écran).
- **Risques** : la fiche flottante doit rester un `region` dans l'ordre de tabulation (pas un
  `dialog` modal), gérer le focus au changement de disposition et l'annoncer (`role=status`) ;
  la caméra de l'arbre doit se recadrer (`fit`) au changement ; animation en `transform` seulement
  (la grille change d'un coup, la fiche glisse), neutralisée en mouvement réduit ; tutoriel en
  bulles et e2e de disposition à mettre à jour. Tauri : rien de spécifique.

### Option 3 — Bureau libre (panneaux détachables) · effort **L**

**Ce que voit le joueur.** Chaque panneau (Lecteur, Carnet, Archives, Catalogue) se détache en
fiche flottante redimensionnable, s'aimante aux bords (moitié, tiers), se superpose ; jusqu'à deux
Lecteurs pour comparer des documents (backlog ECRANS §3.1) ; en natif, le Lecteur peut sortir
dans une **fenêtre système** (second écran). Disposition sauvegardée par affaire.

- **Règle** : tout, y compris la comparaison de documents ; c'est la demande « comme on veut ».
- **Risques** : gros chantier d'accessibilité (ordre de focus de fenêtres libres, raccourcis pour
  déplacer/redimensionner au clavier et à la manette, lecteurs d'écran), sans équivalent tactile
  sur téléphone ; multi-fenêtre Tauri (état partagé entre webviews, Android exclu) ; risque de
  Bureau encombré pour un public grand public ; coûts de rendu (plusieurs feuilles + carte SVG).

## 4. Recommandation

**Option 2, en deux temps.** D'abord le socle de l'Option 1 (A−/A+, lecture un cran plus grande,
poignée visible, mémorisation : 1 lot frontend + 2 champs de contrat), livrable seul et qui
répond déjà à « on ne voit pas bien les textes ». Puis les dispositions Lecture / Arbre (1 lot
frontend + design-lead pour la fiche flottante et ses états). L'Option 3 reste au backlog, à
rouvrir seulement si la comparaison de documents devient un besoin de level design.

À trancher par l'orchestrateur : champs `readScale` / `sideWidth` / `layout` dans `Settings`
(contrat d'abord) ; noms des dispositions ; raccourcis par défaut.

## 5. Maquettes

Captures du jeu réel (démo, 1440×900) retouchées dans le DOM ; non commitées :

- `/tmp/claude-0/-home-user/aff02a55-5263-591e-a476-06daad844b88/scratchpad/ui-options/actuel-1440.png` (état actuel)
- `/tmp/claude-0/-home-user/aff02a55-5263-591e-a476-06daad844b88/scratchpad/ui-options/option-2-disposition-lecture.png`
- `/tmp/claude-0/-home-user/aff02a55-5263-591e-a476-06daad844b88/scratchpad/ui-options/option-2-disposition-arbre.png`
