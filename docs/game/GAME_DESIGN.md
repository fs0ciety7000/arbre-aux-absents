# Game design — L'Arbre aux absents

> Auteur : `game-designer` · v0.1 (cadrage) · 13 oct. 2026
> Portée : systèmes **génériques** du moteur. L'histoire, les noms, les lieux et le monde sont
> écrits par le scénariste (`docs/scenario/`, `docs/monde/`) ; tous les exemples ci-dessous sont
> neutres (« Personne A », « Lieu X », « Entreprise Y ») et ne préjugent pas du scénario.
> Écrans, disposition et contrôles : `docs/game/ECRANS.md`. Succès : `docs/game/SUCCES.md`.

## 0. Résumé en une minute

Le joueur reçoit un **arbre généalogique vide** (25 à 35 cases, 4 générations) et une première
pile d'archives. Il lit, souligne, cherche des mots-clés dans un **catalogue fictif**, parcourt une
**carte illustrée** du monde et remplit chaque case (prénom, nom, portrait, rôle) **en choisissant
parmi des candidats qu'il a lui-même découverts**. Le jeu ne dit jamais si une case isolée est juste :
il **verrouille trois cases correctes à la fois** dans un même groupe. Il n'y a ni pénalité, ni chrono
par défaut, ni impasse. L'arbre complet révèle le secret de la famille ; des **secrets annexes**
modifient la fin.

---

## 1. Piliers

| # | Pilier | Ce que ça impose | Ce que ça interdit |
|---|---|---|---|
| P1 | **La déduction appartient au joueur** | Validation par groupes de 3, candidats issus des lectures, aucune vérification case par case | Indice gratuit non demandé, « bon/mauvais » par champ, QCM à 4 choix |
| P2 | **Tirer n'importe quel fil** | Non-linéarité : plusieurs entrées dans chaque branche, déblocages par mots-clés plutôt que par chapitres | Porte unique bloquante, ordre imposé hors prologue |
| P3 | **Jamais d'impasse** | Invariant de contenu « toujours ≥ 1 piste ouverte », aide « Où chercher ? » | Documents manquables définitivement, état bloquant |
| P4 | **Le papier, l'interface moderne** | Documents physiques manipulables (recto/verso, zoom, loupe) dans une UI nette | Mini-jeux d'adresse, chasse au pixel |
| P5 | **Partout, avec tout** | Souris, doigt (360 px), clavier seul, manette ; parité fonctionnelle | Fonction accessible à un seul périphérique, survol obligatoire |
| P6 | **Friction utile seulement** | Le joueur réfléchit sur le contenu, pas sur l'outil : carnet automatique, recherche tolérante aux accents | Saisie au mot près sans aide, inventaire à gérer, aller-retours inutiles |

---

## 2. Boucle de jeu

### 2.1 Micro-boucle (30 s à 3 min)

```
Lire un document ──► repérer un mot-clé souligné ──► (le carnet l'enregistre seul)
      ▲                                                     │
      │                                                     ▼
 nouveau document ◄── Rechercher le terme / ouvrir un lieu sur la carte
      │
      └──► formuler une hypothèse ──► remplir un champ de l'arbre
```

### 2.2 Boucle moyenne (10 à 30 min)

Remplir des cases d'une branche → atteindre 3 cases correctes non verrouillées → **verrouillage**
(retour visuel et sonore fort) → les cases verrouillées **débloquent** du contenu (documents,
lieux, termes) → nouveau front d'enquête.

### 2.3 Boucle longue (session et partie)

Branches complétées → **révélations** de jalons (texte narratif court, 3 à 6 jalons par affaire)
→ arbre complet → **dénouement** → fins variables selon les secrets annexes → épilogue à 100 %
→ re-jeu (chronométré, Nouvelle partie +, succès).

### 2.4 Objectif visible à tout moment

Le compteur de l'arbre (`12 / 30 identifiés`) et le compteur de secrets (`2 / ? secrets`,
total masqué jusqu'à la fin) sont toujours visibles dans l'en-tête. Aucun autre objectif imposé.

---

## 3. Les archives

### 3.1 Principes

- **80 à 120 documents** pour l'affaire du MVP ; un document = 1 à 6 pages/faces.
- Chaque document est une **donnée** (schéma validé) : le moteur ne connaît aucun id d'histoire.
- Un document débloqué n'est **jamais** reperdu. Rien n'est manquable.
- Les documents sont rangés dans l'**Inventaire d'archives** (le « sac » du point & click),
  triables par date, type, lieu, état (non lu / lu / épinglé) et cherchables par titre.

### 3.2 Types de documents

| Type | Faces | Interactions spécifiques | Termes indexés typiques |
|---|---|---|---|
| Lettre | 1–4 pages + enveloppe | Tourner les pages, retourner l'enveloppe (cachet, adresse) | Noms, lieux, dates |
| Coupure de presse | 1 (parfois 2 colonnes liées) | Zoom, lien vers « le numéro complet » si débloqué | Noms, entreprises, événements |
| Photographie | Recto + verso | Zoom ×1–×4, **zones de visage** à collecter, légende au dos | Lieux, dates, prénoms griffonnés |
| Carte postale | Recto (image) + verso (texte, timbre, cachet) | Retourner, lire le cachet postal (lieu + date) | Lieux, prénoms |
| Registre civil (naissances, unions, décès) | 1 page = 4 à 8 entrées | Ligne surlignable, colonnes normalisées | Noms complets, dates, parents, témoins |
| Annuaire / bottin | 1 page = 10 à 30 entrées | Recherche dans la page, tri alpha | Noms, métiers, adresses |
| Acte notarié / testament | 1–3 pages | Signatures, mentions marginales | Noms, biens, liens |
| Faire-part (naissance, union, deuil) | 1 | Liste de proches | Noms, liens familiaux |
| Document d'entreprise (organigramme, bulletin interne, fiche du personnel) | 1–2 | Organigramme cliquable | Rôles, noms, entreprises |
| Bulletin scolaire / palmarès | 1 | — | Prénoms, écoles, années |
| Plan / affiche / prospectus | 1 | Zoom | Lieux, événements |
| Enregistrement (disque, bande) — **optionnel** | 1 + transcription | Lecture audio, **transcription toujours fournie** | Comme une lettre |
| Fiche de catalogue (résultat de recherche) | 1 | Liens vers les documents référencés | Tous |

### 3.3 Anatomie d'un document (champs de données)

`id`, `type`, `titre` (affiché dans l'inventaire), `date` (peut être approximative : « vers X »),
`source` (fonds d'archives fictif), `lieu` (lien carte, optionnel), `faces[]` (image + texte
accessible + zones), `termes[]` (mots-clés indexés et leur position dans le texte), `visages[]`
(photos), `deblocage` (conditions, §8), `secret` (optionnel : contribue à un secret annexe).

**Règle d'accessibilité absolue** : toute face a un **texte transcrit** sélectionnable (mode
« Transcription » activable), même une photo (description) ou un manuscrit.

### 3.4 Lecture

- Ouverture : 250 ms (0 ms en mouvement réduit). Le document s'affiche « posé sur le bureau ».
- Zoom : ×1 (ajusté) à ×4, pas de 0,25 ; pincement, molette, `+`/`-`, gâchettes.
- **Loupe** (desktop) : cercle de 180 px, ×2,5, maintenue avec `Maj` ou clic milieu.
- Bascule **Original / Transcription** (`T`) : la transcription garde les mots-clés soulignés.
- Un document est « lu » après **3 s d'affichage** ou un défilement jusqu'à la fin (sert aux
  statistiques et aux pastilles « non lu », jamais à bloquer).

---

## 4. Le catalogue : moteur de recherche fictif

### 4.1 Justification diégétique (proposition, à valider avec le scénariste)

Le moteur doit exister dans le monde sans le dater arbitrairement. Trois habillages possibles,
interchangeables sans changer les règles :

| Option | Habillage | Atout | Risque |
|---|---|---|---|
| **A (recommandée)** | **Le Fichier central** : terminal de consultation d'un service d'archives (fiches perforées ou microfilms indexés), auquel le personnage-joueur a accès pour sa mission | Cohérent avec n'importe quelle époque « d'archives », justifie l'indexation par mots-clés et les résultats en fiches | Moins « web » que Roottrees |
| B | Réseau télégraphique / service de renseignements par abonnement : on envoie une requête, une réponse arrive (résultats sous forme de dépêches) | Très diégétique, belle matière visuelle | Délai fictif à simuler (on le met à 0 s) |
| C | Annuaire en ligne naissant d'une époque proche de la nôtre (pages web d'époque) | Fidèle à Roottrees, permet des « sites » d'entreprises | Impose une époque, plus difficile dans un monde imaginaire |

Dans tous les cas l'interface affiche une **barre de requête**, une **liste de fiches résultat** et
un historique. Le terme de jeu est « **Catalogue** » (UI), quel que soit l'habillage.

### 4.2 Règles de requête

- Saisie libre (clavier physique, virtuel, ou manette avec clavier à suggestions) **et** recherche
  en un geste depuis un mot-clé souligné ou une entrée du carnet (`Rechercher « X »`).
- **Normalisation** : insensible à la casse, aux accents, aux espaces multiples, à la ponctuation,
  aux articles de tête configurables (« le », « la », « les », etc., liste fournie par le contenu).
- **Tolérance de frappe** : distance d'édition ≤ 1 pour les termes de 6 lettres ou plus,
  **uniquement si le terme corrigé est déjà dans le carnet** (on corrige ce que le joueur connaît,
  on ne révèle rien qu'il ne connaît pas).
- **Combinaison** : jusqu'à **2 termes** séparés par un espace ou `+` = ET logique
  (« Personne A + Lieu X »). Utile pour filtrer les annuaires ; le contenu peut réserver certains
  documents à une **requête combinée** (au plus 15 % des documents).
- **Alias** : le contenu déclare des variantes (surnoms, graphies anciennes, noms d'usage) qui
  pointent vers le même terme canonique.
- **Longueur** : 2 à 40 caractères. En dessous : message « Précisez votre recherche ».

### 4.3 Résultats

- 0 à **12 fiches** par page, triées : non consultées d'abord, puis par date.
- Une fiche = titre du document, type (icône + libellé), date, extrait de 140 caractères max avec
  le terme surligné. Ouvrir la fiche **ajoute le document à l'inventaire**.
- **Aucun résultat** : réponse diégétique neutre (« Aucune fiche pour ce terme. ») ; **pas** de
  « vouliez-vous dire » sur un terme inconnu (anti-révélation).
- Un terme **connu mais épuisé** (toutes ses fiches ouvertes) s'affiche grisé dans le carnet avec
  la mention « tout consulté » si l'aide de niveau ≥ 1 est active.
- Historique : 50 dernières requêtes, rejouables. Pas de limite de requêtes, pas de coût.

### 4.4 Anti-force brute

Les requêtes sont gratuites (P3), mais : les documents clés d'une branche sont indexés sous des
termes **qui n'apparaissent que dans d'autres documents** (le contenu le garantit, vérifié par
l'outil `content:check`) ; taper au hasard ne révèle que des fiches « publiques » sans valeur
décisive. Les statistiques comptent les requêtes vides (pour les succès d'efficacité, jamais pour
une pénalité).

---

## 5. Mots-clés soulignés et carnet automatique

### 5.1 Mots-clés soulignés

- Tout terme indexé apparaît **souligné** dans les documents (original et transcription).
- Trois états visuels, distingués par **forme et pas seulement couleur** :

| État | Rendu | Signification |
|---|---|---|
| Nouveau | Soulignement pointillé + point ● en exposant | Jamais vu dans un autre document |
| Connu | Soulignement plein | Déjà dans le carnet |
| Recherché | Soulignement plein + petite loupe en exposant | Déjà soumis au catalogue |

- Interaction : clic / tap / `Entrée` sur le terme ouvre une **bulle d'action** : `Rechercher`,
  `Voir au carnet`, `Épingler`, `Utiliser dans l'arbre` (si le terme est un candidat, §7.3).
- Cible tactile : la zone sensible d'un terme fait **au moins 44 × 44 px** (étendue invisible).

### 5.2 Carnet automatique

- **Lire un terme l'ajoute au carnet** (dès que le document est affiché, pas besoin de cliquer).
- Rubriques : **Personnes**, **Lieux**, **Organisations**, **Dates et événements**, **Objets et
  divers**. La catégorie vient des données.
- Une entrée affiche : libellé, alias connus, nombre d'occurrences, liste des documents où il
  apparaît (cliquables), état recherché/épuisé, note libre du joueur, lien vers les cases de
  l'arbre qui l'utilisent.
- **Liens automatiques** : deux entrées co-présentes dans ≥ 2 documents sont listées comme
  « souvent cités ensemble » (max 5 par entrée). Pur constat, ne révèle aucun lien de parenté.
- Tri : alphabétique, ordre de découverte, fréquence. Filtre texte instantané.
- Le carnet ne contient **jamais** de déduction écrite par le jeu (pas de « X est le père de Y »).

---

## 6. Épingles, surlignage et notes

- **Épingler** un document, une page ou un passage le place sur le **Tableau d'épingles** (mur de
  liège moderne). Max **60 épingles** (au-delà : message, on retire la plus ancienne non annotée
  si le joueur confirme).
- Sur le tableau : déplacement libre (souris, doigt, clavier par grille de 8 px), **fils** entre
  épingles (max 120), étiquette de fil (40 caractères).
- **Surligner** un passage dans un document : 5 couleurs, chacune doublée d'un **motif**
  (plein, hachuré, pointillé, ondulé, encadré) pour le daltonisme. Les surlignages sont listés
  dans le carnet sous « Passages ».
- **Notes** : une note libre par case de l'arbre, par entrée du carnet, par document et par
  épingle ; 2 000 caractères max ; texte brut. Marqueur « note » visible sur l'élément.
- Tout est sauvegardé ; rien n'est vérifié par le moteur.

---

## 7. L'arbre

### 7.1 Structure

- **25 à 35 cases** sur **4 générations** (MVP), disposées par le contenu (coordonnées de
  grille), avec liens d'union et de filiation dessinés. Les liens sont **donnés** dès le départ
  (la forme de l'arbre est connue, comme dans Roottrees) ; le joueur identifie les personnes.
- Certaines cases portent un **indice fixe** dès le départ (ex. « l'aînée », « décédé jeune »)
  si le contenu le prévoit, pour amorcer.
- Chaque case appartient à un **groupe de validation** (§7.4), par défaut sa **branche**.
- Zoom de l'arbre : 50 % à 200 % ; vue « Ensemble » qui fait tenir tout l'arbre.

### 7.2 Champs d'une case

| Champ | Obligatoire pour la validation | Source des candidats |
|---|---|---|
| Prénom | Oui | Termes « Personnes » découverts (décomposés en prénoms) |
| Nom de famille (nom de naissance) | Oui | Termes « Personnes » découverts (noms) |
| Portrait | Oui | Visages collectés sur les photos (§7.3) |
| Rôle / métier | Oui | Termes « rôle » découverts (métiers, fonctions, statuts) |
| Note libre | Non | Joueur |
| Dates (naissance, décès) | **Non** (option de contenu, voir Questions) | — |

Le contenu peut désactiver un champ pour une case (ex. pas de portrait connu → la case affiche
une silhouette fixe et le champ ne compte pas).

### 7.3 Saisie : listes de candidats découverts (recommandé)

**Choix** : saisie **par listes de candidats découverts**, avec filtre par frappe. **Pas** de
texte libre pour les champs validés.

Raisons : pas de faute d'orthographe punie (P6), jouable à la manette et au doigt sur 360 px (P5),
et surtout **la liste ne contient que ce que le joueur a lu**, donc remplir une case prouve qu'on a
trouvé l'info (P1). Inconvénient assumé : la liste grossit et sert d'indice « il existe un prénom
X » ; c'est compensé par les **leurres** (le contenu doit fournir au moins **1,5 candidat par case**
pour chaque champ, soit ≥ 45 prénoms pour 30 cases, dont figurants et homonymes).

Fonctionnement :

- Toucher un champ ouvre un **sélecteur** : liste filtrable (frappe = filtre préfixe puis
  sous-chaîne), triée par ordre de découverte ou alphabétique, avec le document d'origine de
  chaque candidat (`vu dans : Lettre du …`).
- Un candidat déjà placé dans une autre case reste disponible (homonymes possibles), avec la
  mention « déjà utilisé dans 1 case ».
- **Glisser-déposer** : un mot-clé souligné ou un visage peut être glissé sur un champ (souris,
  doigt avec appui long 400 ms) ; équivalent clavier/manette : `Utiliser dans l'arbre` → choisir
  la case → choisir le champ.
- **Portraits** : sur une photo, chaque **zone de visage** (définie par le contenu, au moins
  44 × 44 px à zoom ajusté) se « collecte » au toucher et rejoint la **galerie des visages**
  (vignette numérotée + photo d'origine). Le joueur peut renommer la vignette (étiquette libre,
  non validée).
- Vider un champ : bouton `×` ou `Suppr`.

**Variante optionnelle (option d'accessibilité, désactivée par défaut)** : « saisie libre
assistée » : le joueur tape, le moteur propose les candidats correspondants ; la valeur n'est
acceptée que si elle correspond à un candidat découvert. C'est la même règle, autre ergonomie.

### 7.4 Validation par groupes de 3 — règles exactes

Définitions :

- **Case complète** : tous ses champs obligatoires sont remplis.
- **Case correcte** : complète **et** chaque champ égal à la solution (comparaison sur l'id
  canonique du candidat, alias compris).
- **Groupe** : ensemble de cases défini par le contenu (par défaut une branche), taille **3 à 8**.
  Toute case appartient à exactement un groupe.
- **Cases en jeu d'un groupe** : ses cases complètes **non verrouillées**.

Règles :

1. **R1 — Déclenchement** : le moteur évalue un groupe **à chaque fois qu'une de ses cases
   devient complète ou change** alors qu'elle est complète, après un délai de **800 ms** sans
   nouvelle modification dans ce groupe (évite les verrouillages pendant qu'on hésite).
   Option (Questions à trancher) : bouton explicite « Soumettre la branche ».
2. **R2 — Seuil** : `seuil = min(3, nombre de cases non verrouillées du groupe)`.
3. **R3 — Verrouillage** : si le nombre de cases **correctes** parmi les cases en jeu est
   ≥ `seuil`, **toutes** les cases correctes en jeu du groupe se verrouillent ensemble.
4. **R4 — Silence sinon** : si le seuil n'est pas atteint, **aucun** retour (ni nombre de
   cases justes, ni champ fautif), sauf aide de niveau 2 activée (§10).
5. **R5 — Pas de retour négatif par case** : les cases incorrectes ne sont jamais marquées.
   Le joueur peut déduire qu'une case non verrouillée après un verrouillage contient une erreur ;
   c'est voulu, mais sans savoir quel champ.
6. **R6 — Les verrouillées ne comptent plus** : une case verrouillée ne peut plus contribuer au
   seuil d'un futur verrouillage (empêche de « porter » une devinette sur des cases déjà sûres).
7. **R7 — Indépendance des groupes** : une évaluation ne regarde qu'un groupe. Des cases correctes
   réparties sur deux groupes (2 + 2) ne verrouillent rien.
8. **R8 — Fin de groupe** : avec R2, les 1 ou 2 dernières cases d'un groupe se verrouillent seules
   si elles sont justes. Le contenu doit donc rendre ces dernières cases **les mieux documentées**
   (consigne au level design : pas de « dernière case devinable par élimination » uniquement).
9. **R9 — Pas de pénalité** : aucune perte, aucun délai, aucun compteur visible d'essais.
   Les statistiques internes comptent les « évaluations sans verrouillage » (succès, §13).

Exemples neutres (groupe de 5 cases, seuil 3) :

| Situation | Résultat |
|---|---|
| 2 cases complètes, 2 correctes | Rien (seuil non atteint) |
| 4 complètes, 3 correctes | Les 3 correctes se verrouillent ; la 4ᵉ reste ouverte, non marquée |
| Puis 2 restantes : seuil = 2 ; 2 complètes, 1 correcte | Rien |
| 2 complètes, 2 correctes | Les 2 se verrouillent ; groupe terminé |

### 7.5 Verrouillage : effets et retour visuel

- Animation **tampon** sur chaque case (« Établi »), décalée de 120 ms entre cases, durée totale
  ≤ 900 ms ; en mouvement réduit : apparition du tampon en fondu 150 ms, sans secousse.
- La case passe en **lecture seule**, cadre doré + icône cadenas (forme, pas seulement couleur),
  annonce lecteur d'écran : « 3 cases établies : [Prénom Nom], … ».
- Son : coup de tampon + accord court (§16). Vibration Android 30 ms si activée.
- Le compteur global s'incrémente ; si un **jalon** est atteint (groupe complet, génération
  complète), une **carte de révélation** (≤ 120 mots) s'ouvre, refermable, archivée dans le
  Journal.
- **Déblocages** liés au verrouillage : voir §8.
- **Déverrouiller** : impossible (une vérité établie reste établie) ; seul « Recommencer la
  partie » remet à zéro.

### 7.6 Anti-devinette (récapitulatif)

1. Candidats limités aux termes **lus** (P1).
2. Validation **par 3** dans un même groupe, cases verrouillées exclues (R3, R6, R7).
3. Aucune information par champ (R4, R5).
4. **Leurres** obligatoires : ≥ 1,5 candidat par case et par champ, homonymes, visages de
   figurants (≥ 1,3 visage par case à portrait).
5. Combinatoire : pour 4 champs à ~45 candidats chacun, deviner une case au hasard est
   impraticable ; deviner 3 en même temps encore plus.
6. Délai R1 de 800 ms : neutralise le « balayage » rapide d'une liste en observant le cadenas
   (en plus, un changement réinitialise le délai).
7. **Garde-fou anti-balayage** : si un même champ change **plus de 6 fois en 30 s** dans un groupe,
   l'évaluation de ce groupe est suspendue **10 s** (silencieusement, sans message culpabilisant).
   À tester en playtest : doit être invisible pour un joueur normal.

---

## 8. Progression et déblocages

### 8.1 Sources de déblocage (définies dans les données)

| Déclencheur | Débloque | Exemple neutre |
|---|---|---|
| Lecture d'un document | Termes, lieux sur la carte, visages | Une lettre mentionne « Lieu X » → le lieu apparaît en silhouette |
| Recherche d'un terme (seul ou combiné) | Documents (fiches) | « Entreprise Y » → bulletin interne |
| Ouverture d'un lieu de la carte | Documents du lieu, sous-lieux | « Lieu X » → registre civil de X |
| Verrouillage de cases | Documents, termes, nouvelles cases révélées, jalon narratif | 3 cases établies → l'album de famille |
| Secret annexe découvert | Variante de fin, succès, document bonus | — |

### 8.2 Prologue et ouverture

- **Prologue guidé** (§15) : un mini-groupe de 3 cases, 5 à 8 documents, 15 à 20 min.
- Après le prologue, **au moins 3 groupes** doivent avoir une porte d'entrée (P2).
- **Pas d'actes** imposés. Des « portes » douces existent : certains groupes de 4ᵉ génération ne
  s'ouvrent qu'après des verrouillages ailleurs (le contenu fixe ces dépendances, max
  **3 niveaux de dépendance** entre groupes).

### 8.3 Invariant « aucune impasse »

Dans tout état atteignable, il existe au moins **une** action productive parmi : document non lu,
terme connu dont la recherche ouvre une fiche non consultée, lieu non ouvert, case vérifiable
avec l'information disponible. `content:check` le vérifie par exploration du graphe de déblocage
(états simplifiés). L'aide « Où chercher ? » (§10) s'appuie sur ce même calcul.

### 8.4 Journal de progression

Liste chronologique : verrouillages, jalons, secrets trouvés, documents marquants. Sert de résumé
« précédemment » au retour en jeu (affiché si > **24 h** depuis la dernière session : 3 dernières
entrées).

---

## 9. La carte comme navigation

- Carte SVG illustrée (gravure rehaussée d'aquarelle, cartouche, rose des vents, échelle
  fantaisie), fournie par le `cartographe`. Elle est **un écran de jeu** et un **index** d'archives.
- **États d'un lieu** :

| État | Rendu | Interactif |
|---|---|---|
| Inconnu | Absent (ou simple décor gravé sans étiquette) | Non |
| Mentionné | Silhouette + étiquette en italique, pastille « ? » | Oui : montre les documents qui le citent |
| Ouvert | Aquarelle « posée », étiquette droite, pastille du nombre de documents non lus | Oui : ouvre le panneau du lieu |
| Ouvert, nouvelles pièces | Comme ouvert, pastille « + » (accent, nommée « nouvelles pièces à consulter ») : des pièces du fonds sont devenues accessibles depuis la dernière ouverture. Toujours affichée (état du lieu, comme « ? »), prioritaire sur le nombre de non lus | Oui : le panneau propose **Rouvrir le fonds du lieu** |
| Épuisé | Aquarelle + coche discrète | Oui |

- **Panneau du lieu** : nom, courte description (≤ 60 mots), fonds d'archives du lieu (documents
  débloqués et « fiches à trouver : N » si aide ≥ 1), termes associés, personnes de l'arbre liées
  (uniquement celles **verrouillées**).
- **Pièces conditionnées** (audit du 15/10/2026) : ouvrir un lieu ne débloque que les pièces
  accessibles à cet instant ; rien n'est débloqué d'office ensuite (la boucle reste « revenir au
  lieu »). Ouvert, sans rien d'accessible mais avec des pièces encore conditionnées, le panneau dit
  « D'autres pièces de ce fonds s'ouvriront avec l'enquête » (aide ≥ 1, sans nombre) au lieu de
  « fiches à trouver : 0 ». Quand ces pièces deviennent accessibles : pastille « + » sur la carte et
  dans la liste, mention « De nouvelles pièces de ce fonds sont accessibles » et bouton **Rouvrir le
  fonds du lieu** dans le panneau. Lieu sans aucun fonds : « Rien à consulter ici », coché dès
  l'ouverture. Moteur : `placeCounters` (`remaining`, `pending`).
- Zoom ×1 à ×4 en 3 niveaux de détail (région, ville, quartier si fourni). Pincement, molette,
  boutons `+`/`−`, gâchettes.
- **Navigation au clavier/manette** : `Tab` / croix directionnelle passe d'un lieu interactif à
  l'autre (ordre ouest → est, nord → sud), plus une **vue Liste** équivalente (accessible et
  lecteur d'écran), toujours disponible par un bouton.
- Cible minimale d'un lieu : **44 × 44 px** à tout niveau de zoom (zone sensible agrandie).
- **Calques** (bascule) : lieux mentionnés, lieux liés à la case sélectionnée de l'arbre, trajets
  (si le contenu en déclare, ex. un déménagement révélé par des cachets postaux).
- La carte n'est **jamais** le seul accès à un document : chaque document de lieu est aussi
  atteignable par le catalogue (P3).

---

## 10. Aides réglables

Les aides sont des **options**, modifiables à tout moment, sans pénalité ni marquage de la
sauvegarde. Préréglages + réglages fins :

| Niveau (préréglage) | Contenu |
|---|---|
| **0 — Archiviste** | Aucune aide, pastilles « non lu » masquées |
| **1 — Enquêteur (défaut)** | Pastilles « non lu », termes épuisés grisés, compteur « fiches restantes » par lieu, bouton « Où chercher ? » |
| **2 — Assisté** | Niveau 1 + **compteur de groupe** : après une évaluation sans verrouillage, « N case(s) correcte(s) en jeu dans ce groupe » (pas lesquelles) |
| **3 — Guidé** | Niveau 2 + **indices progressifs par case** (3 paliers, ci-dessous) |
| Personnalisé | Chaque aide activable séparément |

**« Où chercher ? »** (niveaux 1+) : propose une piste ouverte (document non lu le plus ancien,
terme non recherché le plus cité, lieu non ouvert) sans parler de l'arbre. Délai de recharge
nul.

**Indices progressifs par case** (niveau 3) — à la demande, sur une case non verrouillée :

1. **Piste** : « Cette personne apparaît dans un document de type *registre*. »
2. **Document** : nom du document qui permet d'identifier un champ manquant ou erroné.
3. **Passage** : le passage surligné dans ce document.
4. **Révélation** (confirmation demandée) : remplit **un** champ juste. La case verrouillée par
   ce biais porte un petit symbole « aidé » visible seulement dans les statistiques.

Écart entre deux paliers sur la même case : aucun délai obligatoire, mais une confirmation
« Voir l'indice suivant ? ». Les indices sont écrits par le contenu (3 textes par case) ; si
absents, le moteur génère les paliers 2 et 3 depuis les données de déblocage.

---

## 11. Sauvegarde

- **Automatique** : après chaque action significative (lecture, recherche, champ modifié,
  épingle, verrouillage), regroupée par lot de **1 s** ; et à la mise en arrière-plan (Android,
  onglet caché), à la fermeture.
- **3 emplacements** + 1 emplacement automatique de secours (copie de l'état d'il y a ≥ 10 min).
- Contenu : version de schéma, id de l'affaire et version du contenu, état complet (documents,
  termes, cases, notes, épingles, carte, options d'aide, statistiques, horodatages). Taille cible
  < **500 Ko**.
- Stockage : dossier de données de l'application (desktop/Android via l'empaquetage natif),
  IndexedDB en navigateur. Écriture atomique (fichier temporaire puis renommage).
- **Export / import** d'une sauvegarde en fichier `.json` (transfert entre appareils, démo → jeu
  complet : la progression de la démo est importable dans la version complète).
- **Migration** : chaque version de schéma a une migration testée ; une sauvegarde d'un contenu
  plus récent que le jeu est refusée avec message clair, jamais écrasée.
- Options et succès sont stockés **hors emplacement** (globaux au profil).

---

## 12. Durée cible

| Phase | Joueur moyen | Joueur rapide (re-jeu chrono) |
|---|---|---|
| Prologue/tutoriel | 15–20 min | 3–5 min |
| Arbre principal (25–35 cases) | 5 h 30 – 9 h | 60–120 min |
| Secrets annexes (tous) | +45 min – 1 h 30 | +15 min |
| Épilogue à 100 % | 20–30 min | 10 min |
| **Total première partie** | **6 à 10 h** (100 % : 8 à 12 h) | — |

Rythme visé : un **verrouillage toutes les 15 à 25 min** en moyenne, une **révélation (jalon)
toutes les 60 à 90 min**. Mesuré en playtest via les statistiques horodatées.

---

## 13. Rejouabilité

### 13.1 Secrets annexes

- **5 à 8 secrets** par affaire, **hors arbre** (le scénariste les définit). Un secret est
  « découvert » quand le joueur **le prouve** par une action vérifiable, au choix du contenu :
  - **Liaison de preuves** : épingler et relier par un fil les 2 à 3 documents qui l'établissent,
    puis « Formuler » (le moteur vérifie l'ensemble, même logique que les groupes : tout juste ou
    silence) ;
  - **Question du dossier** : une question à choix parmi des **candidats découverts** (ex. « Qui
    a écrit la lettre non signée ? ») débloquée après lecture des documents nécessaires ; une
    réponse fausse ne révèle rien, aucun compteur.
- Compteur `secrets : N / ?` (total révélé après le dénouement).

### 13.2 Fins multiples

- La fin est **composée** : tronc commun (arbre complet) + **paragraphes conditionnels** par
  secret découvert + **conclusion** choisie selon le nombre de secrets (paliers proposés : 0–2,
  3–5, tous). Soit au moins **3 conclusions** distinctes et des dizaines de combinaisons de texte.
- Option de contenu : **un choix final** du joueur (ex. à qui remettre le dossier) parmi 2 à 3
  options débloquées par des secrets précis. À confirmer avec le scénariste.
- Après le dénouement, la partie **continue** (on peut chercher les secrets restants) et le
  dénouement est rejouable depuis le Journal.

### 13.3 Épilogue à 100 %

Débloqué quand arbre complet + tous les secrets : une courte séquence/document final et une
**carte complète** illustrée (calque « famille » sur la carte du monde).

### 13.4 Mode chronométré

- Débloqué après **un dénouement**. Nouvelle partie dédiée (emplacement séparé).
- Chrono affiché mm:ss, **mis en pause** dans les menus, options et lorsque l'application passe en
  arrière-plan. Fractionnés enregistrés à chaque verrouillage.
- Règles : aides limitées au niveau 1, pas d'import de sauvegarde. Classement **local** (10
  meilleurs temps), pas de classement en ligne au MVP.
- Objectifs de temps (succès) : < 3 h, < 2 h, < 90 min (à recalibrer en playtest).

### 13.5 Nouvelle partie + (Archives annotées)

Débloquée après l'épilogue à 100 %. Même affaire, avec :
- **Notes de l'atelier** : commentaires d'auteur sur 20 à 30 documents (écriture, illustration,
  fausses pistes), affichés dans une marge activable ;
- **Leurres renforcés** (option) : candidats supplémentaires prévus par le contenu ;
- carnet de la partie précédente consultable en lecture seule (option).

### 13.6 Succès et statistiques

- Succès : voir `SUCCES.md` (20 à 30, plateformes : écran interne ; itch.io n'a pas de succès
  natifs ; Steam hors MVP mais la structure est compatible).
- **Statistiques** (écran dédié, par partie et globales) : temps de jeu, documents lus / total,
  termes découverts, requêtes (dont vides), lieux ouverts, cases établies, évaluations sans
  verrouillage, aides utilisées par niveau, secrets, fins vues, meilleurs temps chrono.
  Présentation neutre, jamais comparative ni culpabilisante.

---

## 14. Durée de vie : affaires additionnelles

Une affaire = un dossier de données (documents, termes, arbre, groupes, lieux, secrets, fins,
succès propres). Le moteur charge la liste des affaires disponibles. Succès « génériques » communs
+ succès propres par affaire. Carte : une affaire peut ajouter des lieux sur la carte du monde.
Affaire 2 (case revendiquée, entrée, choix final, succès) : `docs/game/AFFAIRE-2.md`.

---

## 15. Onboarding et tutoriel intégré

- **Aucun écran de règles** au départ. Le prologue **est** le tutoriel : une petite affaire
  dans l'affaire (1 groupe de 3 cases, 5 à 8 documents), jouée dans l'interface réelle.
- Étapes introduites **une par une**, chacune par une **bulle contextuelle** (≤ 25 mots, une
  action attendue, bouton « Compris ») :
  1. Ouvrir un document de l'inventaire ; 2. Toucher un mot souligné → le carnet ; 3. Rechercher
  ce terme au catalogue ; 4. Collecter un visage sur une photo ; 5. Remplir une case ;
  6. Comprendre le **verrouillage par 3** (bulle explicite au moment où il survient, ou au bout
  de 5 min de groupe complet non verrouillé : « Les cases ne sont confirmées que par trois. »)
  ; 7. Ouvrir la carte ; 8. Épingler.
- Chaque bulle s'adapte au périphérique actif (souris, tactile, clavier, manette) : libellés de
  touches dynamiques.
- **Passer le tutoriel** : proposé à la création de partie (« J'ai déjà joué ») ; les mécaniques
  restent expliquées dans **Aide › Comment jouer** (fiches illustrées consultables à tout moment).
- Mécaniques avancées (recherche combinée, fils sur le tableau, secrets) : bulle au **premier
  usage pertinent**, une seule fois, réactivable dans les options.

---

## 16. Audio

- **Musique** : 4 à 6 pistes d'ambiance calmes (bureau, archives, carte, révélation, dénouement,
  menu), boucles 2–4 min, fondu enchaîné 2 s. Couche **adaptative** : un instrument s'ajoute par
  génération complétée (4 couches).
- **Ambiances** : bureau (pendule, pluie légère ou rue, selon le monde), salle d'archives.
- **Effets** : page tournée, papier posé, photo retournée, tampon (verrouillage), plume/stylo
  (note), punaise (épingle), touches du terminal (catalogue), carte dépliée, accord de révélation,
  « rien trouvé » discret.
- Aucun son porteur d'information exclusive : chaque son a un équivalent visuel (et inversement
  pour le lecteur d'écran).
- **Volumes séparés** : général, musique, ambiances, effets, interface ; **mono** ; couper le son
  en arrière-plan (défaut : oui) ; pas de doublage (hors MVP). Enregistrements éventuels :
  transcription toujours visible.
- **Retour haptique** (Android, manette) : verrouillage 30 ms, révélation 2 × 40 ms ;
  désactivable.

---

## 17. Accessibilité

| Domaine | Options et règles |
|---|---|
| **Sans limite de temps** | Par défaut, aucun chrono ni action minutée ; seul le mode chronométré (optionnel) en a. Aucune bulle ne disparaît seule. |
| Taille du texte | 5 crans : 87,5 %, 100 % (défaut), 125 %, 150 %, 200 % ; s'applique aux transcriptions et à l'UI ; les originaux se zooment. |
| Police | Défaut (choisie par `design-lead`) ; **police adaptée à la dyslexie** ; interlignage 1,5 / 1,8 ; espacement des lettres +0,05 em ; texte aligné à gauche (jamais justifié). |
| Transcription | Mode « Transcription par défaut » : tout document s'ouvre en texte transcrit. |
| Contraste | Thème standard (AA minimum) ; **thème contraste élevé** (AAA pour le texte, soulignements épaissis 2 px → 3 px) ; option « réduire la texture papier ». |
| Daltonisme | Aucune information portée par la seule couleur : formes, motifs, icônes doublent chaque état ; palettes alternatives (protanopie, deutéranopie, tritanopie) pour surlignage et calques de carte. |
| Mouvement réduit | Suit `prefers-reduced-motion` et option en jeu : pas de zoom animé, pas de secousse de tampon, fondus ≤ 150 ms, pas de parallaxe sur la carte. |
| Lecteur d'écran | Structure sémantique ; arbre exposé comme **liste hiérarchique** (génération → case → champs) ; annonces des verrouillages et déblocages (région « live » polie) ; descriptions des photos et des zones de visage ; carte en vue Liste. Cible : NVDA, VoiceOver (macOS), TalkBack. |
| Moteur / clavier | Clavier complet, focus visible (anneau ≥ 2 px, contraste 3:1), aucun piège de focus, raccourcis remappables. |
| Motricité | Cibles ≥ 44 × 44 px (48 dp Android) ; glisser-déposer **toujours** doublé d'une alternative en 2 sélections ; appui long réglable (300 / 400 / 600 ms) ; double-tap jamais requis. |
| Cognition | Journal « précédemment » ; Aide › Comment jouer ; aides réglables (§10) ; option « confirmer avant d'effacer un champ ». |
| Audio | Voir §16 : sous-titres/transcriptions, mono, volumes séparés. |

---

## 18. Questions à trancher

1. **Habillage du catalogue** : option A (Fichier central), B (service télégraphique) ou C (pages
   web d'époque) ? Dépend de l'époque du monde choisie par le scénariste.
2. **Évaluation automatique (800 ms) ou bouton « Soumettre la branche »** ? Automatique = fluide
   façon Roottrees ; bouton = plus de contrôle et moins de devinette par balayage. Recommandation :
   automatique + garde-fou §7.6-7, à valider en playtest.
3. **Groupes = branches** systématiquement, ou groupes transverses définis par le scénariste
   (ex. « les témoins d'un même acte ») ?
4. **Champ « dates »** dans les cases : validé (plus de difficulté), informatif seulement, ou
   absent ?
5. **Nom de naissance vs nom d'usage** : un seul champ « nom » ou deux ? (impact fort sur
   l'écriture des unions).
6. **Saisie libre assistée** proposée comme option, ou listes uniquement ?
7. **Succès « sans aide »** : en proposer un (motivation des puristes) au risque de faire des aides
   une punition, ou n'en proposer aucun ? Recommandation : aucun.
8. **Choix final du joueur** dans le dénouement : oui (fins plus marquées) ou fin uniquement
   composée selon les secrets ?
9. **Garde-fou anti-balayage** (§7.6-7) : le garder, l'assouplir, le supprimer ?
10. **Classement en ligne** du mode chronométré : hors MVP confirmé ?
11. **Démo itch.io** : périmètre (prologue + 1 groupe ? 60 min ?) et import de sa sauvegarde dans
    la version complète.
12. **Enregistrements audio** comme type de document : au MVP ou plus tard (coût de production) ?
13. **Leurres** : 1,5 candidat par case et par champ est-il tenable pour le scénariste ?
