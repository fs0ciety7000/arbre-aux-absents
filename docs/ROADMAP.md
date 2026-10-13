# ROADMAP — L'Arbre aux absents

> Mémoire du projet entre sessions. Mise à jour à **chaque** clôture (`/ship`).

## Session 0 — 13 oct. 2026 (kickoff)

Fait :
- [x] Fiche projet, nom, repo créé par `new-project.yml`, branche de travail
- [x] Agents spécialisés : game-designer, level-designer, scenariste, cartographe
- [x] Stack et contrat (architect) : `docs/ARCHITECTURE.md`
- [x] Game design : `docs/game/`
- [x] Bible du monde et de l'affaire : `docs/monde/`, `docs/scenario/`
- [x] Lot 0 : monorepo, contrat zod, `check` vert
- [x] Vague A : moteur pur (192 tests), outils de contenu (parseur, compilation, 11 règles, solveur),
      caméra de carte, design system « Le bureau sous la lampe », infra (Docker, CI, Tauri)
- [x] Vague B : interface du jeu (écrans E01–E09, Bureau, 11 panneaux, carte interactive, manette,
      audio), plateforme web/Tauri, site vitrine (accueil, monde, artbook, charte, presse, crédits, /design)
- [x] Vague C : la Velmarche (carte 5 couches, 19 lieux), 118 documents, progression (7 groupes,
      165 mots-clés, 87 aides, 30 succès, rapport final Q1–Q6 + choix), 30 portraits, 60 illustrations
- [x] Vague D : intégration, passe de cohérence (bible v0.2), QA (7 bugs corrigés), 44 tests e2e,
      perf (LCP site mobile 1,3 s ; jeu 0,7 s sur Slow 4G avec chargement à la demande)

**État vérifié** : `npm run check` vert (444 tests unitaires, `content:check` OK, solveur : 118 documents,
30 cases, 6 fins atteignables, démo à 9 cases) ; `npm run build` et zips itch (complet 2 Mo, démo 1,25 Mo) ;
`npm run test:e2e` 44/44 ; image Docker du site testée (`docker-smoke.sh`) à partir du build local
(le build Docker complet ne peut pas télécharger npm dans le bac à sable : à valider en CI).

## Session 0 bis — 13 oct. 2026 (mise en ligne du site)

- [x] DNS Cloudflare : CNAME `arbre` → `fs0ciety.org`, proxied
- [x] Coolify : projet « Arbre aux absents » (`9ncijjge9recntgn78krbybu`), app `eweadblfcqdmi41stteqeskr`,
      Dockerfile, port 8080, santé `/healthz`, auto-deploy sur `claude/project-thread-kdwfab`
- [x] Build Docker complet validé sur le serveur (premier essai), conteneur « healthy »
- [x] Vérifié en prod : 7 pages 200, `/healthz` ok, CSP présente, `/art/*.svg` et `/_app/immutable/`
      en cache `immutable`, 404 propre, aucune erreur console/CSP (Playwright Chromium)

## Session 0 ter — 13 oct. 2026 (design system v2 « Le dossier vivant »)

- [x] DESIGN v2 (design-lead) : matières (chemise kraft, feuilles, fiches bristol, scotch, Dymo, tampons),
      motion maison `@arbre/ui/motion`, illustrations clés et vignettes générées
- [x] Jeu sur v2 : tous les écrans et panneaux, chorégraphies (distribution, encrage de la carte, verrou),
      LCP mobile 0,8 s
- [x] Site sur v2 : 7 pages + /design, animations au défilement sans hydratation (script haché CSP),
      LCP mobile ≈ 1,85 s
- [x] Vérifié : `npm run check`, build, 44 e2e (axe AA, 390 px, CSP, mouvement réduit)
- [x] Scénario complet remis à l'utilisateur sous forme de document

## Session 0 quater — 13 oct. 2026 (finitions téléphone)

- [x] Chemise : cote sur la ligne des onglets en vue à un panneau (≈ 45 px gagnés)
- [x] Lecteur : barre sur deux lignes, mode compact en icônes sous 40 rem
- [x] `Toast` : bandeau compact en bas sous 600 px, titre allégé, encarts de sécurité
- [x] Vérifié : `npm run check`, 44 e2e, aucun défilement horizontal à 390 et 768 px

## Backlog

- Primitives à reprendre (design-lead) : `Wordmark as="p|span"` (aria-label refusé par axe), `KeyArt`
  en mode scindé et fond transparent, lecture « à la visibilité » des entrées sans hydratation,
  `BrandLogo` mono en masque CSS, `Stamp` (classe transmise), titre Dymo pour `Panel`, matière liège,
  tirage photo interactif, `Toast` trop lourd en étroit, hauteur propre de `KeyArt fit="cover"`.
- Toasts sur bureau (1440 px) : titre en capitales Courier sur trois lignes, posé sur le panneau latéral ;
  plafonner à deux toasts sur téléphone.
- Zones de clic : couvertures des Archives (`button.cover`, ≈ 28 px) ; barre du lecteur à 360 px.
- Rapport : tampons « Établi / Contredit » (le contenu ne porte pas la justesse par réponse).
- e2e : tuer les serveurs restés ouverts avant de relancer (`reuseExistingServer` reprend un build périmé).

- Tests sur appareils réels (Windows, macOS, Linux/Steam Deck, Android téléphone et tablette).
- Signature macOS (Developer ID) et Windows avant la vente ; keystore Android hors repo.
- Page itch.io et `itch.yml` (butler).
- Site en ligne (https://arbre.fs0ciety.org) : ajout aux catalogues mons-corp et occ-studios ; basculer
  l'app Coolify sur `main` après fusion (DEPLOYMENT §1).
- Affaires supplémentaires (contenu seul).
- Builds natifs Tauri (Windows, macOS, Linux, Android) : à lancer en CI (`tauri.yml`), jamais testés ici.
- Musique et ambiances (le moteur audio est prêt, `playMusic` ne joue rien).
- Tutoriel en bulles (le choix « J'ai déjà joué » est seulement mémorisé) ; tiroir à deux crans sur tablette portrait.
- `Dialog` : prop `initialFocus` (design-lead) pour retirer l'action `initial-focus.ts` du jeu.
- Contrat : remappage des touches dans `Settings`, emplacement dédié au mode chronométré, fractionnés sauvegardés.
- Points de scénario à valider par l'humain : `docs/scenario/07-coherence.md` §7 (visa de PB-04, mandats
  de 1953–1959, auteur de la note de PR-11, lettre lue à Firmin en 1883, « vers Brénica »).
- Illustrations : qualité inégale (pb-01, photos de groupe aux tenues répétées) ; vrais profils pour ph-16/17.
- Playtests : difficulté réelle des homonymes (Augustin, Firmin) et des cases à risque (C17, C21, C19, C25).

## Décisions

| Date | Décision | Raison |
|---|---|---|
| 13/10 | Nom : **L'Arbre aux absents**, repo `arbre-aux-absents` | Dit le genre (arbre généalogique) et le mystère (les absents). |
| 13/10 | **Monde entièrement imaginaire**, sans Mons (choix de l'utilisateur), avec carte illustrée façon carte.fs0ciety.org | Demande de l'utilisateur : « créer un monde ». |
| 13/10 | « Sans rail » lu comme « sans thème ferroviaire » ; le jeu est non linéaire par conception | Les deux lectures sont couvertes. |
| 13/10 | Tauri 2 + Svelte 5/Vite (jeu), SvelteKit static (site), npm workspaces, zod 4 | Jeu de lecture : texte, a11y et SVG natifs au web ; un shell pour 4 OS ; démo HTML5 identique. Godot et Electron/Capacitor écartés (ARCHITECTURE §2). |
| 13/10 | Markdown restreint + parseur maison, aucun `{@html}` | Confort d'écriture sans XSS. |
| 13/10 | Contenu compilé, réponses hachées, démo physiquement réduite | Pas de spoiler dans le bundle, pas de contenu payant dans la démo. |
| 13/10 | Validation **automatique** par défaut (manuelle en option), groupes définis dans `tree.json` (souvent une branche) | Fluidité ; liberté au level design. |
| 13/10 | Quatre champs par case (prénom, nom, portrait, métier), saisie par listes de candidats lus, texte libre en option | Jouable au doigt et à la manette, pas de clavier virtuel. |
| 13/10 | Garde-fou contre le balayage des listes conservé | Protège la déduction. |
| 13/10 | Manette : navigation par focus par défaut | Plus fiable qu'un curseur virtuel sur une interface de panneaux. |
| 13/10 | Démo itch.io : prologue + première branche | Montre la boucle complète sans divulguer l'intrigue. |
| 13/10 | Domaine par défaut du site : `arbre.fs0ciety.org`, rien en ligne sans feu vert | Instruction du projet. |
| 13/10 | DA « Le bureau sous la lampe » : thème sombre, documents sur papier, contraste élevé 7:1, pas de thème clair | Ambiance d'enquête nocturne ; le papier joue le rôle du clair. |
| 13/10 | Accent laiton pour l'action, « établi » marqué par un tampon violet | Le doré se lisait comme une récompense. |
| 13/10 | Polices OFL : Literata, Instrument Sans, Courier Prime, Caveat (désactivable), Atkinson Hyperlegible Next | Lecture, UI, documents tapés, manuscrit ; option lisibilité. |
| 13/10 | Carte : encre ferro-gallique bleu-noir et pigments propres au jeu, même procédé que carte.fs0ciety.org | Référence demandée, identité distincte. |
| 13/10 | Curseurs-verbes point & click via `data-verb`, toujours doublés d'un libellé | Références point & click sans dépendre du survol. |
| 13/10 | Logos de la maison : crédits, pied du site et écran de lancement uniquement | Demande : aucune autre référence. |
| 13/10 | Rapport final (Q1–Q6 + choix inscrire/taire) et fins à sections conditionnelles dans le contrat | Fins multiples sans multiplier les fichiers ; solveur par combinaisons de réponses. |
| 13/10 | Ids de portraits neutres (`portrait-xxxxxx`, table `art/tools/portraits/ids.json`) | Règle 11 : aucun nom de personne dans le compilé. |
| 13/10 | Couche `places` : ids `place-<placeId>` admis par la règle 8 | Contrat du renderer de carte et des styles d'art. |
| 13/10 | Art généré par scripts déterministes (`art/tools/**`, graine fixe) | Cohérence visages/photos, régénération après correction de la bible. |
| 13/10 | Site : CSS inline hachée en CSP, carte et portraits en SVG autonomes | LCP mobile 2,5 s → 1,3 s sans `'unsafe-inline'` pour `<style>`. |
| 13/10 | Jeu : splash HTML et chargement à la demande (affaire, illustrations, carte) | LCP Slow 4G 11,5 s → 0,7 s ; format de content-tools inchangé. |
| 13/10 | Site déployé depuis la branche de travail `claude/project-thread-kdwfab` (auto-deploy) tant que `main` n'est pas fusionnée | Mise en ligne demandée ; `main` ne contient que le commit initial et ne bouge pas sans accord. |
