# ITCH — page itch.io et publication

> Préparé le 13/10/2026. **Rien n'est publié** : ni page, ni build. Ce fichier contient le texte à
> coller dans l'éditeur de page itch.io, les réglages et la procédure `butler`
> (`scripts/itch-push.sh`). Les points marqués **[à trancher]** sont des questions pour le
> propriétaire (récapitulées au §10).

## 1. Identité de la page

| Champ itch.io | Valeur |
|---|---|
| Title | `L'Arbre aux absents` |
| Project URL | `https://<compte>.itch.io/arbre-aux-absents` **[à trancher : compte]** |
| Short description or tagline (≤ 130 car.) | `Enquête généalogique en solo : rendez leur nom aux absents d'une famille effacée des registres, pièce après pièce.` (114 caractères) |
| Classification | `Games` |
| Kind of project | `HTML` si une version navigateur est jouable sur la page (démo ou jeu complet), sinon `Downloadable` |
| Release status | `In development` tant que la date n'est pas annoncée, puis `Released` |
| Genre | `Puzzle` (déduction) ; second choix : `Adventure` |
| Language | Français |
| Inputs | Keyboard, Mouse, Touchscreen, Xbox controller, Playstation controller |
| Accessibility | Color-blind friendly, Configurable controls, High-contrast, Playable without timed input, Playable with keyboard only (cocher seulement les cases que propose l'éditeur) |
| Average session | `A few hours` |
| Made with | Svelte, Tauri, Vite |
| Community | Comments (ou Disabled au lancement de la démo) |

Formulations alternatives de l'accroche, si l'on préfère :

- `Un bureau, une lampe, des cartons d'archives : reconstituez l'arbre d'une famille que l'État a rayée.` (101)
- `Lisez, cherchez, recoupez : nommez trente personnes effacées des registres d'un pays imaginaire.` (96)

## 2. Description complète (à coller)

Le texte ne divulgue rien au-delà de la scène d'ouverture et de la présentation du site.

---

**Velmarche, automne 1974.** La Régence est tombée depuis vingt ans. Pendant quinze ans, elle a
rayé des registres les citoyens jugés indésirables ; une loi nouvelle permet enfin de rendre leur
nom à ceux qu'on appelait les « absents », à condition de le **prouver**.

Vous êtes rapporteur à l'Office de Réinscription civile. Sur votre bureau : un arbre généalogique
presque vide, des cartons d'archives, une carte murale du pays et, au bout du couloir, un terminal
flambant neuf qui interroge le fonds des Archives nationales. Une vieille institutrice vient de
mourir ; son testament exige que l'État retrouve tous les descendants de sa famille. À vous de les
nommer.

### Le jeu

- **Lire** des lettres, actes, photographies, annuaires, cartes postales et coupures de presse,
  en original ou en transcription.
- **Chercher** au Lecteur des archives : il ne connaît que les noms exacts que vous avez lus.
- **Noter** : un carnet relie les termes rencontrés ; épinglez, surlignez, annotez.
- **Remplir l'arbre** : pour chaque case, un nom, un visage, un métier.
- **Établir** : les réponses ne se valident que par groupes, comme le veut la loi des deux pièces.
  On ne devine pas, on déduit. Pas de pénalité, pas de chronomètre imposé.
- **Explorer la carte** gravée et aquarellée d'un pays imaginaire : chaque lieu ouvre ses archives.

### En chiffres

- Une affaire complète : **30 personnes** sur quatre générations, **118 documents**, **19 lieux**.
- **Six à dix heures** pour l'affaire principale.
- Des secrets en marge de l'arbre qui changent le dénouement : **plusieurs fins**.
- **30 succès**, un mode chronométré et des statistiques pour rejouer.
- Aucune impasse : tout reste atteignable, quel que soit l'ordre dans lequel vous tirez les fils.

### Contrôles

Tout le jeu se joue au choix à la souris, au doigt, au clavier seul ou à la manette.

- **Souris** : clic pour ouvrir et sélectionner, clic droit pour le menu contextuel (Rechercher,
  Épingler, Utiliser dans l'arbre), glisser-déposer d'un nom ou d'un visage vers une case, molette
  pour zoomer.
- **Écran tactile** : toucher pour activer, appui long pour le menu contextuel (durée réglable),
  pincer ou boutons + / − pour zoomer. Aucun geste à plusieurs doigts n'est indispensable.
- **Clavier** (raccourcis remappables dans les options) : `Tab` et flèches pour naviguer,
  `Entrée` pour activer, `Échap` pour revenir ou mettre en pause, `1` à `8` pour les panneaux
  (Arbre, Archives, Catalogue, Carnet, Carte, Tableau d'épingles, Journal, Galerie des visages),
  `/` pour chercher, `T` original / transcription, `R` retourner un document, `P` épingler,
  `N` noter, `U` utiliser dans l'arbre, `F1` aide, `Ctrl+S` sauvegarder.
- **Manette** (disposition Xbox ; libellés PlayStation et Nintendo adaptés) : croix ou stick gauche
  pour naviguer, A valider, B retour, X menu contextuel, Y rechercher, LB / RB changer de panneau,
  LT / RT zoom, Start pause, Select carnet.

### Accessibilité

- Aucune limite de temps (le chronomètre n'existe que dans le mode chronométré, optionnel).
- Taille du texte de 87,5 % à 200 %, police très lisible ou adaptée à la dyslexie, interlignage et
  espacement des lettres réglables, écriture manuscrite remplaçable, transcription par défaut.
- Thème contraste élevé, texture du papier réduite, palettes pour la protanopie, la deutéranopie
  et la tritanopie ; aucune information portée par la seule couleur.
- Mouvement réduit (suit le réglage du système), lecteur d'écran (arbre exposé en liste
  hiérarchique, annonces des découvertes), cibles tactiles larges.
- Aides réglables, de « aucune » à des indices progressifs : elles ne sont jamais une punition.

### Plateformes

Windows, macOS (Intel et Apple Silicon), Linux (AppImage), Android ; démo jouable dans le
navigateur. Sauvegarde locale automatique, export et import de sauvegarde en fichier : la
progression de la démo se reprend dans le jeu complet.

### Avertissement de contenu

Le jeu évoque un régime autoritaire, la déportation, des exécutions, la séparation d'une mère et de
son enfant, la délation et la mort de proches. Ces faits passent par des documents (listes,
fiches, avis, lettres) : aucune scène violente n'est montrée. Pas de contenu sexuel, pas de
langage grossier.

### Crédits

Développé par **CM Interactive**, écrit et illustré par **CM Creative Lab**, une production
**CARDOR Media**. Polices : Fraunces, Literata, Instrument Sans, Oswald, Courier Prime, Caveat,
Atkinson Hyperlegible Next (SIL Open Font License 1.1).

Site, artbook et dossier de presse : https://arbre.fs0ciety.org

---

Notes pour la relecture du texte :

- « 30 personnes », « 118 documents », « 19 lieux », « 30 succès », « plusieurs fins » : chiffres de
  `docs/ROADMAP.md` (état vérifié par `content:check`). À relire si le contenu change.
- Musique : non mentionnée volontairement (le moteur audio est prêt, aucune piste n'est livrée).
- Tutoriel : non mentionné (bulles au backlog) ; ne pas cocher « Interactive tutorial ».
- Manette : l'implémentation actuelle (`apps/game/src/input/controller.ts`) navigue par focus ; le
  curseur virtuel et la loupe au clic du stick, décrits dans `docs/game/ECRANS.md` §4.4, ne sont pas
  annoncés. Le clic du stick droit bascule original / transcription.
- Les crédits en jeu (`creditsScreen.fonts`) omettent Fraunces et Oswald, présents sur le site :
  à aligner avant la sortie.

## 3. Mots-clés (10 au plus)

`deduction`, `detective`, `mystery`, `investigation`, `genealogy`, `puzzle`, `point-and-click`,
`story-rich`, `singleplayer`, `accessible`

Variantes possibles si itch.io en propose de plus suivies : `noir`, `historical`, `cozy`.

## 4. Visuels

### Captures (5, dans l'ordre d'affichage)

Choisies dans `/mnt/project-files/arbre-aux-absents/captures/` (v2, affaire réelle « Succession
Varenque », aucune réponse visible). Ne pas utiliser les captures `v2-jeu-arbre-etabli-*`,
`v2-jeu-revelation-*`, `v2-jeu-rapport-*` et `v2-jeu-fin-*` : elles montrent l'affaire d'essai
« La malle du grenier » (fixture de développement), absente du jeu publié.

| # | Fichier | Taille | Montre |
|---|---|---|---|
| 1 | `v2-jeu-titre-1440.png` | 1440 × 900 | Écran titre sur l'art clé « Le bureau sous la lampe » |
| 2 | `v2-jeu-lecteur-1440.png` | 1440 × 900 | L'arbre vide et un document ouvert (annuaire de 1906) |
| 3 | `v2-jeu-catalogue-1440.png` | 1440 × 900 | Le Catalogue (Lecteur des archives) et une fiche trouvée |
| 4 | `v2-jeu-carte-1440.png` | 1440 × 900 | La carte gravée de la Velmarche et ses lieux |
| 5 | `v2-jeu-carte-390.png` | 780 × 1688 | La même carte sur téléphone (Android), barre d'onglets en bas |

itch.io recommande 3 à 5 captures ; le format 16:10 s'affiche sans recadrage. La capture
téléphone montre la parité mobile ; la remplacer par `v2-jeu-bureau-1440.png` si l'on veut cinq
images de même format.

### Image de couverture (630 × 500)

- **Format** : 630 × 500 px (ratio 1,26), PNG, idéalement fournie en 1260 × 1000 (itch.io la
  réduit). Elle s'affiche aussi en vignette 315 × 250 : le titre doit rester lisible à cette taille.
- **Source** : `art/keyart/keyart-desk.svg` (art clé 16:9, viewBox 1600 × 900, rendu avec
  `class="art"` **sans** `on-night`, voir `art/keyart/README.md`). Ne pas partir de
  `keyart-desk-tall.svg` (4:5, trop haut pour le cadre).
- **Cadrage** : fenêtre 1134 × 900 en unités du viewBox, de x = 466 à x = 1600 (toute la hauteur) :
  la lampe et sa flaque de lumière à gauche, la zone calme du tiers droit (mur sombre, liège,
  carte dans la pénombre) pour le titre.
- **Titre** : le logotype de l'écran titre (« L'Arbre » / « aux » / « absents »), « aux » en
  `--brand`, le reste en `--text`, posé dans le tiers droit, avec le voile `--scrim-art` si besoin
  (contrastes vérifiés dans `docs/DESIGN.md`). Aucun autre texte, aucun logo de la maison.
- **Rendu** : `node art/tools/keyart/sheet.mjs <sortie.png> --cols 1 --width 1600 art/keyart/keyart-desk.svg`
  (Playwright, classes résolues par les tokens), puis recadrage et ajout du titre ; aperçu rapide
  possible depuis `captures/keyart-desk-1440.png` ou `captures/v2-jeu-titre-1440.png`.
- Aucun visage de personnage, aucun secret (règle de l'art clé).

### Thème de la page (Edit theme)

Valeurs lues dans `packages/ui/src/styles/tokens.css` (thème « bureau », par défaut). Les tokens
sont en OKLCH ; l'hexadécimal est la conversion sRGB, même formule que
`packages/ui/scripts/contrast.mjs`.

| Réglage itch.io | Token | OKLCH | Hex |
|---|---|---|---|
| Background | `--canvas` (`--raw-night-950`) | `oklch(0.2 0.054 260)` | `#07152e` |
| Background 2 (colonne) | `--surface-1` (`--raw-night-900`) | `oklch(0.245 0.058 259)` | `#0e203c` |
| Text | `--text` (`--raw-vellum-100`) | `oklch(0.96 0.014 88)` | `#f6f1e7` |
| Link | `--accent` (`--raw-brass-400`) | `oklch(0.84 0.155 80)` | `#ffbe3d` |
| Button | `--accent` (`--raw-brass-400`) | `oklch(0.84 0.155 80)` | `#ffbe3d` |
| (bordure, si proposée) | `--surface-2` (`--raw-night-850`) | `oklch(0.285 0.06 258)` | `#162a47` |
| (titres, si proposé) | `--brand` (`--raw-vermilion-400`) | `oklch(0.72 0.17 36)` | `#fc7754` |

Contrastes calculés : texte sur colonne 14,5:1, texte sur fond 16,2:1, lien sur colonne 9,8:1,
titre vermillon sur fond 6,8:1. itch.io écrit le texte des boutons lui-même : vérifier dans
l'aperçu qu'il reste sombre sur le safran (`--accent-contrast`, `--raw-night-1000`,
`oklch(0.15 0.042 260)` = `#030a1d`, 11,9:1).

Polices : itch.io ne propose que des Google Fonts. Titre en **Fraunces**, texte en **Literata**
(les deux du design system, `--font-display` et `--font-read`). Bannière : facultative ; si oui,
une bande de l'art clé (1600 × 900 recadré en 960 × ~200, sans titre).

## 5. Canaux et artefacts

Un canal butler par cible. Les noms contiennent `windows`, `macos` (« mac »), `linux` et
`android` : itch.io en déduit la plateforme. Les canaux HTML5 doivent être marqués « This file will
be played in the browser » à la main après le premier envoi.

| Canal | Contenu | Workflow › artefact | Fichier dans l'artefact |
|---|---|---|---|
| `html5-demo` | démo jouable dans le navigateur | `ci.yml` › `itch-zips` | `arbre-aux-absents-demo.zip` (~1,25 Mo, 60 fichiers) |
| `html5` | jeu complet dans le navigateur **[à trancher]** | `ci.yml` › `itch-zips` | `arbre-aux-absents-web.zip` (~2 Mo, 124 fichiers) |
| `windows` | installeur NSIS par utilisateur | `tauri.yml` › `desktop-windows` | `nsis/*-setup.exe` (le `.msi` reste hors itch) |
| `macos` | image disque universelle (Intel + Apple Silicon) | `tauri.yml` › `desktop-macos-universal` | `*.dmg` |
| `linux` | AppImage (GStreamer embarqué) | `tauri.yml` › `desktop-linux` | `appimage/*.AppImage` (`.deb` et `.rpm` restent hors itch) |
| `android` | APK release signé | `tauri.yml` › `android` | `arbre-aux-absents-<version>.apk` (l'AAB est pour le Play Store) |

Remarques :

- `ci.yml` produit aussi `game-web` et `game-web-demo` (dossiers non zippés) : inutiles pour itch,
  `itch-zips` les contient déjà.
- **Android** : sans les 4 secrets de signature, `tauri.yml` ne produit qu'un APK `-debug`, non
  publiable ; le script le refuse.
- **Une seule** version navigateur peut être jouable sur une page itch.io. Démo gratuite + jeu
  payant : `html5-demo` jouable sur la page, `html5` non envoyé (ou sur une page distincte). Jeu
  gratuit : `html5` jouable, pas de démo.
- **Application itch (itch app)** : l'AppImage se lance directement. L'installeur Windows et le
  `.dmg` conviennent au téléchargement par le navigateur ; pour une installation propre par
  l'application itch, il faudrait des artefacts « portables » (dossier de l'exécutable Windows,
  bundle `.app` archivé), à ajouter à `tauri.yml` plus tard (backlog).
- Signature : sans certificat, macOS (Gatekeeper) et Windows (SmartScreen) avertissent au premier
  lancement (DEPLOYMENT §2). À indiquer dans la description tant que ce n'est pas réglé.

### Zips HTML5 : vérifiés

`scripts/package-itch.ts` appelle `zipWebBuild` (`packages/content-tools/src/zip.ts`) :

- il **échoue** si `index.html` n'est pas à la racine du dossier zippé, ou s'il y a 1000 fichiers
  ou plus (limite itch.io) ;
- les chemins d'entrée sont relatifs au dossier (`apps/game/dist`, `apps/game/dist-demo`), donc
  `index.html` est à la racine du zip, sans dossier parent ;
- `apps/game/vite.config.ts` construit avec `base: './'` : tous les liens sont relatifs.

Vérifié sur les zips de `dist/itch/` le 13/10/2026 : `index.html` à la racine des deux archives,
aucune référence absolue (`/assets/…`, `url(/…)`) dans le HTML, le JS et le CSS.

### Réglages de l'intégration navigateur

- Embed options : taille **1280 × 800** (fenêtre par défaut du bureau, `tauri.conf.json`), bouton
  plein écran activé, « Mobile friendly » coché (orientation : automatique ; le jeu tient à 360 px),
  « Automatically start on page load » décoché.
- SharedArrayBuffer : inutile.
- Sauvegardes : stockage du navigateur dans l'iframe itch.io (IndexedDB). Rappeler dans la
  description l'export de sauvegarde (écran Charger › Exporter) pour les reprendre ailleurs.

## 6. `.itch.toml` : non fourni

Le manifeste de l'application itch se lit à la **racine de chaque build envoyé**, pas à la racine
du repo : à la racine du repo il ne serait jamais publié. Avec un seul fichier par canal (AppImage,
installeur, `.dmg`, APK), l'application itch n'a rien à choisir et le manifeste n'apporte rien. Il
deviendra utile avec des builds portables à plusieurs fichiers (action de lancement, prérequis) :
le script le copiera alors dans chaque dossier envoyé.

## 7. Publication avec butler

Prérequis : [butler](https://itch.io/docs/butler/) installé, clé d'API créée sur
itch.io (Settings › API keys) et exportée **dans le shell seulement** :

```bash
export BUTLER_API_KEY=…            # jamais dans un fichier du repo
gh run download <run-id-ci>     -D artefacts -n itch-zips
gh run download <run-id-tauri>  -D artefacts   # desktop-linux, desktop-windows, desktop-macos-universal, android
sh scripts/itch-push.sh --dry-run artefacts <compte>/arbre-aux-absents   # affiche les commandes
sh scripts/itch-push.sh artefacts <compte>/arbre-aux-absents             # envoie
```

- `--userversion` vient de `apps/game/package.json` (actuellement `0.0.0` : monter la version
  avant le premier envoi ; le script avertit).
- `--channels "html5-demo windows"` limite l'envoi à certains canaux ; un canal sans artefact est
  sauté avec un message.
- Le script cherche les fichiers dans tout le dossier : la structure de `gh run download`
  (un sous-dossier par artefact) comme un dossier à plat conviennent.
- Un workflow `itch.yml` (envoi sur tag `v*`, secret `BUTLER_API_KEY`) pourra reprendre ce script
  plus tard.

## 8. Avant d'ouvrir la page

- [ ] Version montée dans `apps/game/package.json`, tag `v*` poussé, builds `tauri.yml` verts.
- [ ] Secrets Android présents (APK release), signature macOS / Windows décidée.
- [ ] Builds testés sur appareils réels (ROADMAP › Backlog).
- [ ] Crédits en jeu alignés sur le site (Fraunces, Oswald).
- [ ] Couverture 630 × 500 produite, 5 captures envoyées, thème appliqué.
- [ ] Canaux HTML5 marqués « played in the browser », dimensions réglées.
- [ ] Page en `Draft` puis aperçu, puis `Public` (ou `Restricted` pour une clé de test presse).
- [ ] Lien itch.io ajouté au site (presse : « Bientôt sur itch.io » → lien réel).

## 9. Prix (proposition, à trancher)

La fiche vise un public « prêt à payer 10 à 15 € pour 6 à 10 heures ». Pistes :

- **A.** Jeu payant (prix minimum autour de 12 €, « payer plus » ouvert), démo HTML5 gratuite sur
  la page, téléchargements desktop et Android réservés aux acheteurs.
- **B.** Démo gratuite sur une page séparée (`arbre-aux-absents-demo`), page principale payante.
- **C.** Gratuit ou « payez ce que vous voulez » : `html5` jouable, pas de démo.

## 10. Questions ouvertes pour le propriétaire

1. **Prix** et modèle (A, B ou C ci-dessus), devise et éventuelle réduction de lancement.
2. **Démo gratuite et jeu payant**, ou jeu gratuit ? (décide si le canal `html5` est envoyé.)
3. **Compte itch.io** qui publie (compte personnel ou compte studio CM Interactive / CARDOR Media)
   et URL du projet.
4. **Classification d'âge** : itch.io n'a qu'un indicateur « contenu pour adultes » ; vu
   l'avertissement de contenu (§2), proposition : non coché, avec la mention « déconseillé aux moins
   de 12 ans » dans la description. Faut-il viser une classification formelle (IARC, utile pour
   le Play Store) ?
5. Signature macOS et Windows avant la vente, ou publication non signée avec avertissement ?
