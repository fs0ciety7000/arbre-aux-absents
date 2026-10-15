# Écrans, navigation et contrôles — L'Arbre aux absents

> Auteur : `game-designer` · v0.1 (cadrage) · 13 oct. 2026
> Complète `GAME_DESIGN.md`. Le rendu visuel (couleurs, typo, composants) relève de
> `design-lead` (`docs/DESIGN.md`) : ici on fixe **quoi**, **où** et **comment on l'actionne**.

## 1. Inventaire des écrans et panneaux

### 1.1 Écrans hors partie

| ID | Écran | Contenu | Accès |
|---|---|---|---|
| E01 | Lancement | Logo studio et titre du jeu (≤ 2 s depuis le chargement de la page, passable), détection périphérique ; précédé d'un splash HTML/CSS identique dans `index.html` | Démarrage |
| E02 | Titre | Continuer (dernier emplacement), Nouvelle partie, Charger, Options, Succès, Statistiques, Bonus, Crédits, Quitter (desktop) | E01 |
| E03 | Emplacements | 3 emplacements + secours : affaire, % arbre, secrets, temps, date ; Charger / Effacer (confirmation) / Exporter / Importer | E02 |
| E04 | Nouvelle partie | Choix de l'affaire (MVP : 1), mode (Normal / Chronométré / Archives annotées si débloqués), préréglage d'aide, « J'ai déjà joué » (passer le tutoriel) | E02 |
| E05 | Options | Onglets : Jeu, Aides, Affichage, Accessibilité, Audio, Contrôles (remappage), Langue (FR au MVP), Données | E02, pause |
| E06 | Succès | Grille : obtenus, en cours (avec progression), cachés (« ??? ») | E02, pause |
| E07 | Statistiques | Partie en cours / globales | E02, pause |
| E08 | Bonus | Carte complète (si épilogue), galerie des portraits établis, artbook léger, fins vues | E02 |
| E09 | Crédits | CM Interactive, CM Creative Lab, CARDOR Media | E02, fin |

### 1.2 Écran de jeu : le Bureau (hub)

Le **Bureau** est l'unique écran de jeu. Il héberge des **panneaux** :

| ID | Panneau | Rôle |
|---|---|---|
| P01 | **Arbre** | Cases, liens, zoom, compteur, sélecteurs de champ |
| P02 | **Archives** (inventaire) | Liste/grille des documents, tri, filtres, pastilles |
| P03 | **Lecteur** | Document ouvert : faces, zoom, loupe, Original/Transcription, surlignage, épingle, visages |
| P04 | **Catalogue** | Barre de requête, résultats, historique |
| P05 | **Carnet** | Rubriques de termes, passages surlignés, notes |
| P06 | **Carte** | Carte illustrée, calques, vue Liste, panneau du lieu |
| P07 | **Tableau d'épingles** | Épingles, fils, étiquettes |
| P08 | **Journal** | Verrouillages, jalons, secrets, dénouement rejouable |
| P09 | **Aide** | « Où chercher ? », indices de la case sélectionnée, Comment jouer |
| P10 | **Sélecteur de candidat** (modal léger) | Liste filtrable pour un champ de case |
| P11 | **Galerie des visages** | Visages collectés, étiquettes, origine |
| P12 | **Secret / Question du dossier** (modal) | Formuler une preuve ou répondre |
| P13 | **Carte de révélation** (modal) | Texte de jalon, ≤ 120 mots |
| P14 | **Pause** | Reprendre, Options, Succès, Statistiques, Sauvegarder et quitter |
| P15 | **Dénouement / Fin** | Séquence finale composée, puis « Continuer l'enquête » ou « Titre » |
| P16 | **Résultats chrono** | Temps, fractionnés, classement local |

En-tête permanent du Bureau : compteur `identifiés N / T`, `secrets N / ?`, chrono (mode
chronométré uniquement), bouton Aide, bouton Pause. Hauteur 48 px (desktop) / 56 px (téléphone).

## 2. Flux de navigation

```
E01 ─► E02 ─┬─ Continuer ───────────────────────────► Bureau
            ├─ Nouvelle partie ─► E04 ─► (prologue) ─► Bureau
            ├─ Charger ─► E03 ─────────────────────► Bureau
            ├─ Options E05 · Succès E06 · Stats E07 · Bonus E08 · Crédits E09
            └─ Quitter (desktop uniquement)

Bureau ─┬─ panneaux P01–P11 (libres, aucun ordre)
        ├─ Échap / Start ─► P14 Pause ─► E05/E06/E07 · Titre
        ├─ verrouillage jalon ─► P13 ─► Bureau
        ├─ secret ─► P12 ─► Bureau
        └─ arbre complet ─► P15 Dénouement ─┬─ Continuer l'enquête ─► Bureau
                                            ├─ (chrono) ─► P16 ─► E02
                                            └─ Titre ─► E02
```

Règles de flux :
- **Retour** (`Échap`, bouton B, geste retour Android, bouton ← de l'en-tête) ferme d'abord le
  modal, puis le panneau secondaire, puis ouvre la Pause. Jamais de sortie de partie sans
  confirmation ; la sauvegarde est faite avant.
- Chaque panneau **mémorise son état** (défilement, filtre, zoom, document ouvert) pendant la
  session et dans la sauvegarde.
- Liens transverses partout : un terme → Carnet / Catalogue ; un document → Carte (lieu) ;
  une case → documents liés (cases verrouillées uniquement) ; un lieu → documents.
- **Historique de navigation** interne : `Alt+←` / `Alt+→` (desktop), bouton ← (téléphone),
  20 entrées.

## 3. Dispositions par format

Points de rupture (largeur de la fenêtre, pas de l'appareil) :

| Format | Largeur | Principe |
|---|---|---|
| Téléphone | 360–599 px | **Un panneau à la fois**, barre d'onglets en bas |
| Tablette / petite fenêtre | 600–1279 px | **Deux volets** (paysage) ou un volet + tiroir (portrait) |
| Desktop | ≥ 1280 px | **Bureau à trois zones**, volets redimensionnables |

### 3.1 Desktop (≥ 1280 px)

```
┌──────────────────────── En-tête 48 px ─────────────────────────┐
├──────┬───────────────────────────────┬─────────────────────────┤
│ Rail │  Zone principale              │  Volet latéral          │
│ 64px │  (Arbre par défaut, ou Carte, │  (Lecteur par défaut ;  │
│ icô- │   ou Tableau d'épingles)      │   onglets : Lecteur,    │
│ nes  │                               │   Archives, Catalogue,  │
│      │                               │   Carnet, Journal, Aide)│
│      │                               │  360–640 px, glissable  │
└──────┴───────────────────────────────┴─────────────────────────┘
```

- Le duo **Arbre + Lecteur côte à côte** est l'état par défaut : c'est le cœur de la déduction.
- Volet latéral redimensionnable (poignée, `Ctrl+[` / `Ctrl+]` par pas de 40 px), repliable.
- **Lecteur détachable** en fenêtre flottante (desktop natif) ou en second volet : jusqu'à
  **2 documents** comparés côte à côte (comparaison de signatures, d'écritures, de dates).
  *Reporté au backlog, hors 2.0 ; affaire 2, E04 et case revendiquée : `AFFAIRE-2.md`.*
- Le Sélecteur de candidat P10 : petite boîte filtrable pour un prénom, un nom ou un métier ;
  **grande boîte** (presque tout le Bureau) pour un portrait : grille de visages, descriptions
  repliées, aperçu à droite, recherche et filtre « document ouvert » (DESIGN §13.13).
- **Dispositions** (desktop et tablette paysage ; `Settings.layout`, mémorisée) : sélecteur à
  trois boutons dans l'en-tête, `Alt+1/2/3` :
  - **Enquête** (défaut) : arbre + volet côte à côte, poignée libre (largeur mémorisée).
  - **Lecture** : le volet (Lecteur) prend ~60 % du Bureau, feuille centrée (~70 caractères),
    texte un cran plus grand ; l'arbre reste visible en colonne étroite. « Vers l'arbre » (ou
    toute navigation vers une case) repasse en Enquête.
  - **Arbre** : l'arbre occupe tout le Bureau ; le volet devient une **fiche flottante**
    (500 × 640 px au plus) posée sur l'arbre, déplaçable (poignée : souris, doigt, flèches,
    `Maj` = plus loin), position bornée au Bureau et mémorisée (`Settings.cardPosition`),
    repliable en onglet. Ouvrir un document l'y affiche. C'est une région dans l'ordre de
    tabulation, pas une modale.
- **Plein écran du document** : bouton « Plein écran » de la barre du Lecteur (et de la fiche,
  `F` dans le Lecteur) ; le document occupe tout l'écran (feuille de 960 px au plus, A− / A+
  actifs), le Bureau dessous est inerte. On revient par le bouton (« Revenir en fiche » en
  disposition Arbre, « Quitter le plein écran » sinon), `Échap` ou B ; le focus revient au
  bouton de départ. Disponible sur tous les formats.
- Fenêtré minimum : 1024 × 640 (bascule en disposition tablette sous 1280).

### 3.2 Tablette (600–1279 px)

- **Paysage** : deux volets (volet latéral 440 px par défaut, réglable à la poignée ou au clavier
  comme au desktop, 60 % de la largeur au plus), rail d'icônes en haut
  à gauche réduit à 56 px ; mêmes onglets que desktop.
- **Portrait** : zone principale plein écran + **tiroir bas** (hauteur 40 % / 90 %, deux crans,
  poignée de 24 px) pour le Lecteur et les onglets secondaires. Barre d'onglets en bas comme le
  téléphone.
- Sélecteur de candidat : feuille modale centrée (prénom, nom, métier) ; portrait : grande boîte
  à hauteur fixe, sans aperçu sous 1024 px (descriptions par l'interrupteur).
- Paysage : mêmes trois dispositions qu'au desktop. Portrait (et téléphone) : pas de sélecteur
  (un panneau à la fois) ; le plein écran du document reste disponible.

### 3.3 Téléphone (360 px)

```
┌──────── En-tête 56 px : ← · N/T · ? · ≡ ────────┐
│                                                  │
│       Panneau actif (plein écran)                │
│                                                  │
│   [ Mini-lecteur épinglé : 72 px, optionnel ]    │
├──────────────────────────────────────────────────┤
│ Arbre │ Archives │ Catalogue │ Carnet │ Carte    │  barre 64 px
└──────────────────────────────────────────────────┘
```

- **5 onglets** fixes en bas ; Tableau d'épingles, Journal, Galerie et Aide dans le menu `≡`.
- Le Lecteur s'ouvre **plein écran** au-dessus des onglets ; bouton « Vers l'arbre ».
- **Mini-lecteur** (pont entre document et arbre) : depuis le Lecteur, « Garder sous la main »
  réduit le document en bandeau de 72 px (titre + extrait surligné) visible au-dessus de la
  barre d'onglets dans l'Arbre ; un toucher le rouvre. C'est la réponse au manque de place pour
  le côte à côte.
- **Arbre sur 360 px** : vue par **génération** (balayage horizontal entre générations,
  indicateur 1·2·3·4) + vue Ensemble zoomable ; une case mesure min. 144 × 168 px ; toucher
  une case ouvre sa **fiche** en feuille basse (champs en lignes de 56 px).
- Sélecteur de candidat : **plein écran** avec champ de filtre en haut, liste à lignes de 56 px ;
  portrait : grille de deux colonnes, descriptions repliées (interrupteur), tout défile d'un bloc.
- Carte : plein écran, vue Liste en bascule dans l'en-tête.
- Texte minimal 16 px à 100 % ; aucune information en survol.

## 4. Contrôles

### 4.1 Souris

| Action | Geste |
|---|---|
| Sélectionner, ouvrir, activer | Clic gauche |
| Menu contextuel (Rechercher, Épingler, Utiliser dans l'arbre, Copier) | Clic droit ou `≡` contextuel |
| Glisser un terme / visage vers un champ, une épingle sur le tableau | Glisser-déposer |
| Zoom (arbre, carte, document) | Molette ; `Ctrl` + molette sur les listes |
| Déplacer la vue | Glisser sur le fond (clic gauche ou milieu) |
| Loupe sur un document | Maintenir `Maj` ou clic milieu |
| Retour | Bouton souris 4 / « précédent » |

Curseur contextuel (référence point & click) : flèche, **main** (saisissable), **loupe**
(zoomable/visage), **plume** (champ éditable), **épingle** (en mode tableau). Le curseur ne porte
jamais seul une information : l'état est aussi affiché (soulignement, icône).

### 4.2 Tactile (gestes)

| Action | Geste |
|---|---|
| Activer | Toucher |
| Menu contextuel | Appui long (400 ms, réglable 300/600) |
| Glisser vers un champ / déplacer une épingle | Appui long puis glisser |
| Zoom | Pincer ; boutons `+`/`−` toujours présents |
| Déplacer la vue | Glisser à un doigt (sur fond) |
| Tourner une page / retourner une photo | Balayage horizontal sur le document **ou** bouton « Retourner » |
| Changer de génération (arbre téléphone) | Balayage horizontal sur l'arbre ou indicateur 1·2·3·4 |
| Tiroir (tablette portrait) | Glisser la poignée ; toucher la poignée = cran suivant |
| Retour | Geste/bouton retour système Android, bouton ← |

Aucun geste à plusieurs doigts n'est indispensable (le pincement a toujours des boutons
équivalents) ; aucun double-tap requis. Bords de l'écran réservés au système (pas de geste sur
16 px de bordure).

### 4.3 Clavier (raccourcis, tous remappables)

| Touche | Action |
|---|---|
| `Tab` / `Maj+Tab` | Élément suivant / précédent |
| Flèches | Navigation dans les grilles (arbre : case voisine selon les liens ; listes ; carte : lieu voisin) |
| `Entrée` / `Espace` | Activer |
| `Échap` | Retour / fermer / pause |
| `Menu` ou `Maj+F10` | Menu contextuel |
| `1`…`5` | Onglets : Arbre, Archives, Catalogue, Carnet, Carte |
| `6` / `7` / `8` | Tableau d'épingles, Journal, Galerie des visages |
| `/` ou `Ctrl+F` | Focus sur la barre du Catalogue (si Catalogue ouvert : recherche dans le panneau courant) |
| `T` | Lecteur : Original / Transcription |
| `R` | Lecteur : retourner (verso) |
| `PgPréc` / `PgSuiv` | Page précédente / suivante |
| `+` / `-` / `0` | Zoom avant / arrière / ajuster |
| `Maj` (maintenu) | Loupe (centrée sur le focus au clavier) |
| `P` | Épingler l'élément focalisé |
| `H` | Surligner la sélection (puis `1`–`5` pour la couleur) |
| `N` | Note sur l'élément focalisé |
| `U` | « Utiliser dans l'arbre » sur le terme / visage focalisé |
| `Suppr` | Vider le champ de case focalisé (confirmation si option active) |
| `F1` ou `?` | Aide (« Où chercher ? », indices de la case) |
| `Alt+←` / `Alt+→` | Historique de navigation |
| `Ctrl+[` / `Ctrl+]` | Rétrécir / élargir le volet latéral |
| `Alt+1` / `Alt+2` / `Alt+3` | Disposition Enquête / Lecture / Arbre (desktop, tablette paysage) |
| `Alt+=` / `Alt+-` | Lecteur : texte plus grand / plus petit (A+ / A−) |
| `F` | Lecteur : plein écran du document (`Échap` pour revenir) |
| `F11` | Plein écran (desktop) |
| `Ctrl+S` | Sauvegarde manuelle (confirmation visuelle ; la sauvegarde auto existe déjà) |

**Navigation dans le texte d'un document** au clavier : `Tab` parcourt les **mots-clés
soulignés** puis les zones de visage, dans l'ordre de lecture. Sélection libre de texte pour le
surlignage : `Maj+flèches` en mode Transcription.

### 4.4 Manette (disposition Xbox ; libellés adaptés PlayStation / Nintendo)

| Bouton | Action |
|---|---|
| Stick gauche | **Curseur virtuel** (vitesse réglable, aimantation sur les éléments interactifs à 24 px) |
| Croix | Navigation par focus (élément suivant dans la direction) |
| A | Activer / sélectionner |
| B | Retour / fermer |
| X | Menu contextuel (Rechercher, Épingler, Utiliser dans l'arbre, Note) |
| Y | Catalogue : rechercher l'élément focalisé (ou ouvrir la barre) |
| LB / RB | Onglet précédent / suivant |
| LT / RT | Zoom arrière / avant |
| Stick droit | Déplacer la vue (arbre, carte, document zoomé) |
| Clic stick gauche | Loupe |
| Clic stick droit | Original / Transcription |
| Start (Menu) | Pause |
| Select (Vue) | Carnet (rapide) |

- **Saisie de texte** (Catalogue, notes, filtre) : clavier virtuel à l'écran avec **ligne de
  suggestions** issues du carnet (sélection directe), plus le clavier système (Steam Deck,
  Android). Au Catalogue, la plupart des recherches se font sans taper, via Y sur un terme.
- Glisser-déposer remplacé par « Prendre » (A sur un terme/visage, maintenu 400 ms) → naviguer
  → « Déposer » (A) sur un champ ; B annule.
- Libellés d'aide en bas d'écran mis à jour selon le contexte et le périphérique actif (détection
  automatique au dernier périphérique utilisé).
- Dispositions, A− / A+, plein écran, poignée du volet et de la fiche : boutons de l'en-tête et
  des barres atteints à la croix, activés par A (sur la poignée du volet, A bascule standard ↔
  large) ; B quitte le plein écran. Pas de bouton dédié aux dispositions dans le schéma.

### 4.5 Parité

Toute action existe sur les 4 périphériques ; le tableau de parité est un **critère de recette**
(QA) : une ligne par action de `GAME_DESIGN.md`, une colonne par périphérique.

## 5. États vides, chargement et erreurs

| Contexte | État | Texte (indicatif) et comportement |
|---|---|---|
| Archives | Vide (avant prologue) | « Votre bureau est vide. Ouvrez la première enveloppe. » + bouton |
| Archives | Filtre sans résultat | « Aucun document ne correspond. » + « Effacer les filtres » |
| Catalogue | Avant toute requête | Exemples cliquables tirés des **termes connus** non recherchés (3 max) ; sinon « Saisissez un nom, un lieu, une entreprise. » |
| Catalogue | Aucun résultat | « Aucune fiche pour ce terme. » (sans suggestion d'orthographe sur terme inconnu) |
| Catalogue | Requête trop courte | « Précisez votre recherche (2 caractères minimum). » |
| Catalogue | Tout consulté (aide ≥ 1) | « Toutes les fiches de ce terme sont déjà dans vos archives. » |
| Carnet | Rubrique vide | « Aucun lieu noté pour l'instant. Les mots soulignés s'ajoutent seuls. » |
| Carte | Aucun lieu connu | Carte en décor gravé, bandeau « Les lieux apparaîtront au fil de vos lectures. » |
| Tableau d'épingles | Vide | Illustration + « Épinglez un document ou un passage avec P / appui long. » |
| Tableau d'épingles | Limite 60 atteinte | « Le tableau est plein. Retirer la plus ancienne épingle sans note ? » (Oui / Annuler) |
| Galerie des visages | Vide | « Touchez un visage sur une photographie pour le collecter. » |
| Sélecteur de candidat | Aucun candidat | « Vous n'avez encore trouvé aucun [prénom]. Lisez d'autres documents. » + bouton « Où chercher ? » |
| Arbre | Aucune case remplie | Bulle (si tutoriel non passé) pointant la première case |
| Journal | Vide | « Rien d'établi pour l'instant. » |
| Aide | Aide désactivée (niveau 0) | « Les aides sont désactivées. Les activer ? » (lien Options) |
| Lecteur | Image non chargée | Transcription affichée d'office + « L'image n'a pas pu être chargée. Réessayer. » |
| Sauvegarde | Échec d'écriture | Bandeau persistant : « Sauvegarde impossible (espace disque ?). Votre progression reste en mémoire. Réessayer · Exporter ». Nouvel essai auto toutes les 30 s |
| Sauvegarde | Fichier corrompu | « Cet emplacement est illisible. » + proposer l'emplacement de secours ; jamais d'écrasement silencieux |
| Sauvegarde | Version de contenu plus récente | « Cette sauvegarde vient d'une version plus récente du jeu. Mettez le jeu à jour. » |
| Import | Fichier invalide | « Ce fichier n'est pas une sauvegarde de L'Arbre aux absents. » |
| Contenu | Erreur de chargement de l'affaire | Écran d'erreur avec code, bouton « Revenir au titre », journal technique copiable |
| Navigateur (démo) | Stockage bloqué / navigation privée | Bandeau : « Votre navigateur n'autorise pas la sauvegarde. Exportez votre partie avant de fermer. » |
| Manette | Déconnectée en jeu | Pause automatique + « Manette déconnectée. » |
| Fenêtre | Trop petite (< 360 px de large) | Message plein écran « Agrandissez la fenêtre » |

Chargements : aucun écran de chargement > 1 s attendu ; au-delà de 300 ms, indicateur discret
(plume animée ; statique en mouvement réduit).

## 6. Questions à trancher

1. **Zone principale par défaut sur desktop** : Arbre (recommandé) ou Bureau « physique »
   (documents éparpillés) façon point & click pur ?
2. **Lecteur détachable en fenêtre native** (desktop) : utile pour les écrans multiples, coût
   technique selon l'empaquetage retenu par `architect`.
3. **Téléphone en paysage** : supporté (disposition tablette compacte) ou verrouillé en portrait ?
4. **Curseur virtuel à la manette** par défaut, ou navigation par focus par défaut (curseur en
   option) ?
5. **Mini-lecteur** sur téléphone : suffisant pour croiser document et arbre, ou faut-il un
   écran scindé haut/bas dès 640 px de hauteur ?
6. Faut-il un **Bureau physique** décoratif (objets cliquables menant aux panneaux) sur l'écran
   titre ou en fond, pour l'esprit point & click ? À voir avec `design-lead`.
