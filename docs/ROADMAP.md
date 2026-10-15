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

## Session 0 quinquies — 13 oct. 2026 (builds jouables)

- [x] Bug : la touche pressée juste après le logo était avalée (CI rouge depuis le design v2) ; test ajouté
- [x] Builds natifs verts en CI sans secrets : Linux (AppImage, deb, rpm), Windows (exe, msi),
      macOS universel (dmg), Android (APK debug) — commit « [tauri] » sur la branche de travail
- [x] Page itch.io prête (`docs/ITCH.md`) et script butler (`scripts/itch-push.sh`) ; rien publié

## Session 0 sexies — 13 oct. 2026 (publication itch.io)

- [x] Clé Android `arbre-upload-v2` (hors repo, dossier partagé du projet) ; APK signé en CI (4 secrets)
- [x] Jeu web jouable sur `/jouer/` du site
- [x] Page itch.io publiée, gratuite : web, Windows, macOS, Linux, Android en 1.0.1
- [x] Envoi automatique : tag `v*` ou commit `[itch]` → builds natifs → butler (`tauri.yml`, job `itch`)
- [x] Dépôt passé en public (Actions gratuites) ; kit de publication retiré du dépôt

## Session 0 septies — 14 oct. 2026 (musique, tutoriel)

- [x] Musique générative (Web Audio, aucun fichier) : humeurs Titre, Bureau (s'étoffe avec l'arbre),
      Dénouement ; ambiance pluie, horloge, papier ; voir `docs/game/AUDIO.md`
- [x] Tutoriel en bulles « Note de service » (10 étapes, déclenchées par les actions, ne bloque
      jamais) ; progression dans `Profile.tutorial` ; « Revoir le tutoriel » dans Aide et Options
- [x] Écran fixe sur téléphone (plus de zoom ni de glissement), portrait sur téléphone Android
- [x] Kit presse sur `/presse/` (logos, 3 affiches A3, 8 bannières, artbook 19 p., fiche presse, ZIP),
      généré par `npm run presskit` ; images du thème itch.io dans `static/itch/`
- [x] Couverture du roman (CM Publishing), direction A « Fenêtre » validée ; copie aussi dans le dossier partagé
      `arbre-aux-absents/roman/` ; ISBN et largeur de tranche à venir
- [x] Dans le dépôt : couvertures du roman et leurs sources dans `assets/roman/` (hors image Docker) ; tous les
      visuels itch.io (couvertures, captures 1440/1920, GIF/WebM, promo, thème) dans `apps/site/static/itch/`

## Session 0 octies — 14 oct. 2026 (correctifs téléphone et finitions)

- [x] Carte sur téléphone : la carte et la fiche du lieu ont chacune leur zone (plus de chevauchement),
      côte à côte en paysage ; test `map-layout.spec.ts` sur 6 formats
- [x] Tiroir à deux crans (40 % / 90 %) sur tablette portrait
- [x] Métiers coupés au milieu d'un mot ; illustrations d'en-tête enfin affichées dans le Lecteur ;
      numéro de génération décalé d'un cran ; groupes établis tout seuls au rechargement
- [x] Icône de l'appli = sceau du kit presse (desktop, Android adaptative, favicon du jeu) ; image de
      partage du site = bannière « bureau »

## Session 1 — 14 oct. 2026 (affaire 2.0 « Le Revenant de Hautcorvin », branche `claude/affaire-2`)

- [x] Spécification `docs/game/AFFAIRE-2.md` : case revendiquée (déclaration fausse à contester), visages à
      plusieurs âges, décision finale à tampons, choix de l'affaire (écran E04), notes de tutoriel à trois crans
- [x] Contrat : `TreeSlot.claim`, `CompiledSlot.claimedGuess`, `Person.altPortraits`, `CaseMeta.order`,
      `ReportOption.unavailableReason` ; moteur (`slotStatus`, `claimedFields`) ; content-tools (règles et
      solveur de la case revendiquée, `checkAcrossCases`)
- [x] UI : `ClaimTag`, `CaseFolder(Group)`, `DecisionCard(Group)`, encre `--claim-ink-desk`, journal
      « Déclaration contestée », son `unstaple`, projet e2e `game-cases`
- [x] Contenu : bible `docs/scenario/hautcorvin/`, level design `docs/level/hautcorvin.md`, 28 cases en
      8 groupes, 98 documents, 4 fins, 36 portraits, 53 illustrations, Vernezac, Pas de l'Ourse et Dalvezac
      sur la carte ; durée estimée 4 h 50 à 7 h 25 ; `content:check` vert (2 affaires)
- [x] QA : les 4 fins jouées dans le build web ; démo itch sans trace de l'affaire 2 ; LCP 124 ms / 680 ms
- [x] Correctifs QA : étiquette Dalvezac sous les contrôles de la carte du site (axe `target-size`), focus de
      la confirmation « Rétablir la déclaration », portrait déclaré lisible dans la fiche, secours par affaire

## Session 2 — 15 oct. 2026 (traduction anglaise et signalement de problèmes, branche `claude/i18n-en`)

Plan approuvé : `docs/i18n/PLAN.md` (lots, portes G0 à G6, risques).

- [x] Vague 0 (orchestrateur) : contrat `packages/contract/src/{i18n,report,report-ref}.ts`, champs
      `hearing`, `Highlight.lang`, `SaveSlotSummary.caseId`, `Settings.language`, `Profile.reports`,
      `ParseSaveErrorCode`, `systemLocales`/`openExternal` ; schémas JSON régénérés ; ARCHITECTURE §1–§6
      et nouveau §8 ; WORKFLOW (périmètres, agent `traducteur`) ; `content/locales.json` (fr source,
      en draft) ; scripts `content:i18n` (emplacement réservé) et `dev:report` ; `.env.example`.
      Transition : `CompiledCase.locale`, `ParseSaveResult.code` et `Platform.systemLocales` restent
      facultatifs dans le type jusqu'à A2/C1 pour garder `check` vert.
- [ ] A1 · backend · i18n du contenu (calques, compilation par langue, sel structurel, règle 12, `content:i18n`)
- [ ] A2 · backend · moteur et plateforme (`code` de `parseSave`, `lang`, `caseId`, `systemLocales`, `openExternal`)
- [ ] A3 · design-lead · `UiStrings`, `LanguageSwitch`, `TicketStatus`, sections DESIGN
- [ ] A4 · backend · service de signalement `apps/report`
- [ ] A5 · devops · Docker du service, CSP, nginx `/en/`, Tauri opener, CI
- [ ] T0 · scenariste · glossaire `docs/i18n/en/GLOSSAIRE.md`, `content/world/locales/en.json`
- [ ] T0-V, T0-H · scenariste · terminologie par affaire (progression, family, tree)
- [ ] B1 · frontend-jeu · i18n de l'UI
- [ ] B3 · frontend-site · i18n du site (`/en/`, `hreflang`)
- [ ] T1 · traducteur · documents, fins, aides, succès (lots V1–V6, H1–H5)
- [ ] T2 · cartographe · surcharges SVG anglaises
- [ ] B2 · frontend-jeu · écrans de signalement
- [ ] B4 · frontend-site · pages de signalement, suivi, problèmes connus, confidentialité
- [ ] C1 · orchestrateur + backend · `en: ready`, retrait de l'ancien format généré, budgets
- [ ] C2 · level-designer · relecture de la déduction en anglais
- [ ] C3 · qa-reviewer · e2e `en-GB`, signalement simulé
- [ ] C4 · devops · déploiement `arbre-api.cardormedia.com`, webhook, étiquettes, dépôt de signalements

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
- Signature macOS (Developer ID) et Windows : seulement si le jeu devient payant.
- itch.io : l'APK passé par butler est livré dans un .zip (envoi manuel de l'APK pour un téléchargement direct).
- Site en ligne (https://arbre.fs0ciety.org) : ajout au catalogue occ-studios (mons-corp fait : PR #8) ; basculer
  l'app Coolify sur `main` après fusion (DEPLOYMENT §1).
- Affaires supplémentaires (contenu seul).
- Affaire 2 (écarts à `AFFAIRE-2.md`) : `reopenReport` (refaire le rapport après le dénouement) ; durée,
      cote, mention « Se joue seule » et tampon de la dernière décision sur les chemises E04 ; sélection par
      défaut « l'affaire jamais commencée la plus ancienne » ; mention marginale et entrée de journal
      « Décision » après la fin ; journal sauvegardé ; déclencheur `hearing` sans dépendre du titre
      « audition » ; démo des tampons sur `/design` ; fiche d'aide « Cases revendiquées ».
- Emplacements manuels 1 à 3 par affaire (aujourd'hui partagés, E04 prévient) ; vue « comparer » et action
      « Déplacer vers… ».
- Perf L9 : découper le chunk de contenu par affaire avant l'affaire 3 (E04 ≈ 2,9 s en Slow 4G CPU ×4
      avec deux affaires).
- Test fragile sous charge : `content.test.ts` « budgets : portrait trop lourd » (délai 5 s).
- Retour Android : fermer le tiroir tablette avant de revenir à l'Arbre ou d'ouvrir Pause. Mettre à jour `docs/game/GAME_DESIGN.md` §15 et `ECRANS.md` §5 (tutoriel) ; montrer `Coachmark` sur `/design`.
- `Dialog` : prop `initialFocus` (design-lead) pour retirer l'action `initial-focus.ts` du jeu.
- Contrat : remappage des touches dans `Settings`, emplacement dédié au mode chronométré, fractionnés sauvegardés.
- Illustrations : qualité inégale (pb-01, photos de groupe aux tenues répétées) ; vrais profils pour ph-16/17.
- Playtests : difficulté réelle des homonymes (Augustin, Firmin) et des cases à risque (C17, C21, C19, C25).

## Décisions

| Date | Décision | Raison |
|---|---|---|
| 13/10 | itch.io : **jeu payant + page démo gratuite séparée**, compte `cardorinteractive` | Choix du propriétaire ; la démo (prologue + Atelier) ne dévoile aucun secret. |
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
| 14/10 | Affaire 2 : **« Le Revenant de Hautcorvin »** (choix C), livrée en PR depuis `claude/affaire-2` | Choix du propriétaire sur la carte de décision ; fusion quand il le voudra. |
| 14/10 | La case revendiquée a deux champs faux (visage, métier) et un nom juste | Le joueur conteste sans tout jeter ; une déclaration juste sur 4 champs est une erreur de contenu. |
| 14/10 | Option de décision indisponible affichée grisée avec sa raison (`unavailableReason`) | Le joueur voit ce qu'il lui manque au lieu d'une option qui disparaît. |
| 14/10 | La démo n'inclut pas l'affaire 2 ; emplacements manuels partagés, secours par affaire | Démo inchangée ; une partie d'une affaire n'écrase jamais le secours de l'autre. |
| 15/10 | D1 · i18n : le FR reste la **source de vérité** ; traductions dans des dossiers `content/cases/<id>/locales/<loc>/` | Aucun fichier FR déplacé, périmètres disjoints ; ajouter une langue = ajouter un dossier. |
| 15/10 | D2 · Traductions JSON en **calques** (champs traduisibles seuls, indexés par id FR), tout le reste hérité | Dérive structurelle impossible par construction. |
| 15/10 | D3 · Noms propres jamais traduits ; institutions et événements tranchés dans le glossaire ; **anglais britannique** ; titre du jeu inchangé, titres d'affaires traduits | Cohérence avec le DEVLOG ; marque conservée. |
| 15/10 | D4 · Sel et `contentHash` calculés sur la **structure** (sources FR hors `locales/`), identiques entre langues | Sauvegardes et changement de langue en cours de partie sans migration. |
| 15/10 | D5 · `Highlight.lang` : surlignage affiché seulement dans sa langue, conservé dans l'autre | Les positions dépendent du texte. |
| 15/10 | D6 · Langue `system` : `fr-*` → français, toute autre → anglais ; `?lang=en` sur `/jouer/` comme indice (à valider par le propriétaire) | Un germanophone lit plus probablement l'anglais. |
| 15/10 | D7 · Écran d'attente HTML neutre, message sans JS bilingue, aucun script en ligne | CSP ; titre identique dans les deux langues. |
| 15/10 | D8 · Site : préfixe `/en/` avec les mêmes slugs, `hreflang` (fr, en, x-default → fr), aucune redirection automatique | Site statique, nginx sans logique, référencement propre. |
| 15/10 | D9 · Service de signalement : app Coolify `arbre-api.cardormedia.com`, Node 22, `node:http` + `node:sqlite`, zod embarqué, volume `/data` | CORS nécessaire de toute façon ; certificat Cloudflare ; pas de proxy fragile. |
| 15/10 | D10 · Numéro de ticket propre au service (`AA-0042`), lien de suivi `…/suivi/#<jeton>`, jeton 128 bits stocké haché | Ni GitHub ni l'URL du ticket exposés ; jeton absent des journaux et du Referer. |
| 15/10 | D11 · `@tauri-apps/plugin-opener` limité à `arbre.cardormedia.com` et `cardorinteractive.itch.io` | Plugin officiel léger ; seule manière propre d'ouvrir un lien externe sous Tauri. |
| 15/10 | D12 · Signalements dans un dépôt GitHub **privé** dédié `fs0ciety7000/arbre-aux-absents-signalements` (`GITHUB_REPO`) ; le contact n'est jamais envoyé à GitHub | Décision du propriétaire : la description libre peut contenir des données personnelles, le dépôt du jeu est public. |
| 15/10 | D13 · Conservation : contact effacé 30 j après clôture, ticket supprimé 12 mois après clôture, suppression immédiate à la demande ; aucune IP stockée ni journalisée | Minimisation (RGPD). |
