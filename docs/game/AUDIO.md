# Audio — musique générative et ambiances

> Complète GAME_DESIGN §16. Code : `apps/game/src/audio/`. Décision : **tout est synthétisé à
> l'exécution avec la Web Audio API**. Aucun fichier son, aucune ressource externe, aucune licence,
> aucun réseau. Le web, la démo itch.io et les builds Tauri (WebView2, WKWebView, WebView Android)
> passent par le même code.

## 1. Intention

La Velmarche, automne 1974. Un bureau d'archiviste, la nuit, sous une lampe. Il pleut sur la vitre,
une pendule bat dans la pièce voisine, une feuille glisse. La musique est **mélancolique mais
chaude** et accompagne l'enquête sans jamais la commenter. Elle doit pouvoir tourner des heures
sans lasser : tempos lents, notes rares, silences réguliers, jamais deux phrases identiques.

## 2. Humeurs

| Humeur | Écrans | Caractère |
|---|---|---|
| `title` (Titre) | Titre, Emplacements, Nouvelle partie, Options, Succès, Stats, Bonus, Crédits | 54 BPM. Motifs de **celesta** lents (croches clairsemées) sur une nappe chaude, basse longue sur le premier temps. Ré dorien, la éolien, fa majeur. |
| `desk` (Bureau) | Bureau, ses écrans par-dessus (pause, options…), rapport final (questions) | 66 BPM. **Pouls grave** calme (premier temps, parfois le troisième), **piano feutré** rare dans le médium, nappe sombre (filtre fermé). La éolien, ré éolien, mi éolien, ré dorien. |
| `reveal` (Dénouement) | Écran de fin, une fois le dénouement choisi | 60 BPM. Majeur lumineux : **arpèges montants** de celesta, cloches aiguës, nappe ouverte. Fa majeur, do majeur, si♭ lydien. |
| aucune | Lancement, erreur fatale | Silence musical. |

Le choix est fait par la fonction pure `moodFor()` (`theory.ts`) à partir de l'écran affiché ;
`App.svelte` l'appelle dans un `$effect`. Changer d'humeur fait un **fondu enchaîné** d'environ
2,5 s (constante de temps 0,8 s) : l'humeur sortante s'efface pendant que l'entrante démarre
0,6 s plus tard. Rester dans la même humeur (Titre → Emplacements) ne coupe rien.

**Couche adaptative** (GAME_DESIGN §16) : `layersFor(part établie)` donne 0 à 4 couches, une par
quart de l'arbre établi. Au Bureau, chaque couche ajoute un peu de densité au piano ; dès 2,
une **cloche** aiguë ponctue de temps en temps ; dès 3, la nappe prend sa **septième** et la basse
sa **quinte** ; chaque couche ouvre un peu le filtre de la nappe. L'arbre complet sonne plus
plein et plus clair que le premier soir, sans jamais devenir dense.

## 3. Composition générative (`composer.ts`, pur)

Le compositeur écrit la musique **mesure par mesure** sous forme d'événements datés
(`MusicEvent`), sans aucun nœud audio : il est entièrement testé par Vitest.

- **Phrases** de 4 mesures. **Accords** enchaînés par une chaîne de Markov diatonique (degrés),
  les triades diminuées étant exclues ; retour fréquent à la tonique en tête de phrase.
- **Mélodie** : marche aléatoire par degrés (pas de −3 à +3, petits pas privilégiés), réfléchie
  aux bornes de l'ambitus, attirée sur les **notes de l'accord** aux temps forts. La dernière
  mesure d'une phrase est plus clairsemée et s'ouvre souvent sur une note longue (cadence).
- **Motif** : la première mesure d'une phrase est mémorisée ; une phrase suivante peut la
  reprendre **transposée sur le nouvel accord**, avec des notes qui tombent ou glissent d'un degré
  (cohérence musicale sans redite).
- **Respirations** : 10 à 22 % des phrases ne jouent que la nappe ; au Bureau, 8 % sont un
  **silence complet** où seules les ambiances restent. Jamais deux phrases non pleines d'affilée.
- **Modulation** : toutes les 6 à 10 phrases, changement de tonalité parmi celles de l'humeur,
  toujours amorti par une respiration sur la nouvelle tonique.
- **Humanisation** : micro-décalages (< 25 ms), vélocités et panoramiques variés.

Bornes vérifiées par les tests : toutes les notes dans la tonalité en cours ; plus de 95 % de
phrases mélodiques distinctes sur 480 mesures ; moins de 45 notes mélodiques par minute (80 en
dénouement) ; resynchronisation sans rattrapage après une suspension.

## 4. Ambiances (`ambience-plan.ts` pur, `ambience.ts`)

Mixées **sous** la musique, sur le bus « Ambiances » (volume propre dans Options › Audio).

- **Pluie sur la vitre** : lit continu de bruit rose bouclé sans couture (fondu de 0,25 s entre
  la fin et le début du tampon), deux couches : bande médium (500–3 200 Hz) et ruissellement
  grave (le même bruit lu à demi-vitesse, passe-bas 320 Hz). L'intensité suit une marche aléatoire
  lente (nouvelle cible toutes les 12 à 30 s).
- **Gouttes** : processus de Poisson, 0,4 à 1,6 par seconde selon l'intensité de la pluie.
- **Pendule lointaine** : tic, tac, une seconde chacun, **par périodes** (30 à 90 s audibles, avec
  fondu de 6 s, puis 40 à 120 s d'oubli) pour ne jamais devenir un métronome.
- **Papier froissé** : toutes les 45 à 150 s, quatre à sept frottements filtrés.

Niveau de la scène selon l'humeur : Bureau 100 %, Titre 55 %, Dénouement 35 %. Le lit de pluie
s'arrête (sources stoppées) quand l'ambiance est muette ou la scène silencieuse.

## 5. Instruments (`synth.ts`)

| Voix | Synthèse | Nœuds |
|---|---|---|
| Nappe | une dent de scie par note, plus un triangle désaccordé sur la fondamentale ; passe-bas qui s'ouvre pendant l'attaque (2,5 s), relâche 3 s | 4–5 oscillateurs, 1 filtre, 1 gain par accord |
| Piano feutré | FM deux opérateurs, rapport 1, brillance qui s'éteint en ~0,25 s | 2 oscillateurs, 2 gains, 1 panoramique |
| Celesta | FM rapport 4, attaque claire, résonance 2 à 4 temps | idem |
| Cloche | FM rapport 3,5, registre plafonné sous fa♯ 6 | idem |
| Basse | sinus + triangle à l'octave (audible sur haut-parleur de téléphone), passe-bas 420 Hz | 2 oscillateurs, 1 filtre, 2 gains |
| Réverbération | 4 filtres en peigne (103 à 211 ms, rétroaction 0,62 amortie à 2,6 kHz), répartis gauche/droite, partagés par toutes les humeurs | 14 nœuds fixes, aucune convolution |

Les gouttes et le tic-tac sont **cuits une fois** (`bake.ts` : bruit filtré par un biquad calculé
en JS, enveloppe percussive, fin forcée à zéro) puis rejoués avec une source et un gain.

## 6. Effets

Les crochets existants du moteur (`audio.play(nom)`) restent synthétisés : `paper` (frottement
qui descend), `page` (souffle qui monte puis claque), `stamp` (corps grave, claque du caoutchouc),
`type`, `nothing`, `pin`, `tap`, `open`, `close`, `unstaple` (agrafe ôtée, AFFAIRE-2 §1.7 :
pattes qui raclent le papier, tintement métallique, feuille relâchée ; au retrait d'un champ déclaré
d'une case revendiquée, bus effets, donc muet quand le son ou les effets sont coupés). `chord` (case établie) et `reveal` sont
**transposés dans la tonalité de la musique en cours** (majeure relative) pour ne jamais sonner
faux par-dessus.

## 7. Comportement du moteur (`engine.ts`)

- **Autolecture** : le contexte n'est créé qu'au premier geste (pointeur ou clavier).
  `setMood()` peut être appelé avant : l'humeur démarre au déverrouillage.
- **Ordonnanceur** : `setInterval` de 200 ms, anticipation de 0,8 s (2,5 s fenêtre cachée, si le
  son continue en arrière-plan). Il ne tourne que si le contexte joue et qu'une humeur est active.
- **Volumes** : général, musique, ambiances, effets, interface (GAME_DESIGN §16), appliqués sur
  les bus. Musique à 0 : la partition avance **sans créer de nœuds**. Ambiances à 0 : lit de pluie
  arrêté.
- **Couper le son** : volume général à 0 **suspend le contexte** (coût nul).
- **Arrière-plan** : fenêtre cachée + « Couper le son en arrière-plan » (défaut : oui) suspend le
  contexte ; au retour, compositeur et ambiance repartent de « maintenant » sans rattraper.
- **Mono** : inchangé (destination à un canal).
- Aucun son ne porte d'information exclusive (GAME_DESIGN §16).

## 8. Coût

Mesuré par rendu hors ligne (Chromium, 60 s, 44,1 kHz) : réverbération 0,4 %, ambiance 1,4 %,
musique 3 à 4 % d'un cœur de bureau ; Bureau à 4 couches + ambiance ≈ 5 %. Environ 15 à 25
oscillateurs simultanés au plus. Niveaux à volumes par défaut : musique ≈ −29 dBFS RMS
(crête ≈ −13 dBFS), ambiance du Bureau ≈ −36 dBFS RMS, soit 7 dB sous la musique.

## 9. Faire évoluer

- Nouvelle humeur : une entrée dans `MOODS` (`theory.ts`) et un cas dans `moodFor()`.
- Régler l'équilibre : `TRIM` dans `music.ts` (voix) et `ambience.ts` (pluie, gouttes, pendule,
  papier) ; `ambience` dans chaque `MoodSpec` pour le niveau de scène.
- Une salle d'archives (GAME_DESIGN §16) serait un second `AmbiencePlan` (réverbération plus
  longue, pas de pluie).
