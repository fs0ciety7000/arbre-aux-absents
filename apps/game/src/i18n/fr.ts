/**
 * Textes d'interface du jeu, en français : la **source** (`type Messages = typeof fr`).
 * `en.ts` doit la satisfaire (`satisfies Messages`). Lus à travers le Proxy réactif de
 * `index.svelte.ts` (`messages`, `pm`…) : jamais importés directement par un composant.
 * Vocabulaire et typographie : docs/i18n/en/GLOSSAIRE.md, DESIGN §4.4.
 */
import type { DocumentKind, KeywordKind, ReportCategory } from '@arbre/contract';
import type { Device } from '@arbre/ui';
import type { PanelId, SlotField } from '../lib/game/types';
import type { DeskMessages } from './fr-desk';

const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

/** Verbe d'action selon le périphérique actif (« Touchez une case », « Cliquez sur une case »…). */
const tap = (d: Device) =>
  d === 'touch' ? 'touchez' : d === 'mouse' ? 'cliquez sur' : 'sélectionnez';
const Tap = (d: Device) => {
  const v = tap(d);
  return v.charAt(0).toUpperCase() + v.slice(1);
};

/**
 * Retire le point final d'une valeur (texte de remplacement d'un portrait : « …trop grand. »)
 * avant d'y accoler une mention (« , déclaré. ») : pas de double ponctuation à l'écoute.
 */
export function withoutFinalPeriod(value: string): string {
  return value.replace(/\s*\.+\s*$/, '');
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export const fr = {
  /** Langue du catalogue (`<html lang>`) et étiquette BCP 47 pour `Intl`. */
  lang: 'fr',
  intl: 'fr-FR',

  title: "L'Arbre aux absents",
  tagline: 'Une enquête généalogique dans un monde imaginaire.',
  studio: 'CM Interactive',
  credits: 'CM Interactive · CM Creative Lab',
  /** « Étiquette : valeur » (espace avant les deux-points en français). */
  labelled: (label: string, value: string) => `${label} : ${value}`,
  skipToContent: 'Aller au contenu',
  loading: 'Chargement…',
  back: 'Retour',
  close: 'Fermer',
  cancel: 'Annuler',
  confirm: 'Confirmer',
  yes: 'Oui',
  no: 'Non',
  retry: 'Réessayer',

  launch: {
    skip: 'Passer',
    presents: 'présente',
    logoLabel: 'CM Interactive',
  },

  menu: {
    label: 'Menu principal',
    continue: 'Continuer',
    continueDetail: (caseTitle: string, when: string) => `${caseTitle} · ${when}`,
    newGame: 'Nouvelle partie',
    load: 'Charger',
    options: 'Options',
    achievements: 'Succès',
    stats: 'Statistiques',
    bonus: 'Bonus',
    credits: 'Crédits',
    quit: 'Quitter',
    quitConfirmTitle: 'Quitter le jeu ?',
    quitConfirmText: 'Votre progression est sauvegardée.',
    deskIllustration: 'Le bureau sous la lampe',
    version: (v: string) => `Version ${v}`,
    devBadge: 'Développement',
    kicker: 'Dossier O.R.C. 74',
    hook: 'Velmarche, automne 1974. Une famille entière à rendre à ses noms.',
    lastFiled: 'Dernier classement',
    lastFiledDetail: (pct: number, caseTitle: string) => `${caseTitle} · ${pct} % de l’arbre`,
  },

  slots: {
    title: 'Emplacements',
    kicker: 'Charger une partie',
    slotName: (slot: string) =>
      slot === 'auto' ? 'Secours automatique' : `Emplacement ${slot.replace('slot-', '')}`,
    /** Secours d'une affaire (un par affaire, AFFAIRE-2 §2.3). */
    backupName: (caseTitle: string) => `Secours · ${caseTitle}`,
    empty: 'Emplacement libre',
    progress: (pct: number) => `${pct} % de l'arbre`,
    playTime: (t: string) => `Temps de jeu : ${t}`,
    updated: (d: string) => `Dernière partie : ${d}`,
    modeTimed: 'Chronométré',
    modeStandard: 'Normal',
    load: 'Charger',
    remove: 'Effacer',
    exportFile: 'Exporter',
    importFile: 'Importer une sauvegarde',
    removeTitle: 'Effacer cet emplacement ?',
    removeText:
      'La partie sera supprimée définitivement. Exportez-la avant si vous voulez la garder.',
    removed: 'Emplacement effacé.',
    exported: 'Sauvegarde exportée.',
    imported: 'Sauvegarde importée.',
    importInvalid: "Ce fichier n'est pas une sauvegarde de L'Arbre aux absents.",
    importTarget: 'Importer dans',
    corrupt: 'Cet emplacement est illisible.',
    useBackup: "Utiliser l'emplacement de secours",
    newer: 'Cette sauvegarde vient d’une version plus récente du jeu. Mettez le jeu à jour.',
    unknownCase: "L'affaire de cette sauvegarde n'est pas disponible dans cette version.",
    none: 'Aucune partie sauvegardée pour l’instant.',
    listLabel: 'Emplacements de sauvegarde',
  },

  newGame: {
    title: 'Nouvelle partie',
    kicker: 'Ouvrir un dossier',
    caseLabel: 'Choisir une affaire',
    modeLabel: 'Mode',
    modeStandard: 'Normal',
    modeStandardHint: 'Sans limite de temps.',
    modeTimed: 'Chronométré',
    modeTimedHint: 'Débloqué après un premier dénouement. Aides limitées au niveau 1.',
    modeTimedLocked: 'Chronométré (après un premier dénouement)',
    hintsLabel: "Niveau d'aide",
    hintsHint: 'Modifiable à tout moment dans les options, sans pénalité.',
    tutorialLabel: 'Notes de service',
    tutorialModes: {
      full: 'Complètes',
      news: 'Nouveautés seulement',
      none: 'Aucune',
    } as Record<'full' | 'news' | 'none', string>,
    tutorialHints: {
      full: 'Une collègue vous guide pas à pas, du premier document au premier coup de tampon.',
      news: 'Seulement ce qui change dans cette affaire ; le reste est connu.',
      none: 'Aucune bulle ; tout reste expliqué dans Aide › Comment jouer.',
    } as Record<'full' | 'news' | 'none', string>,
    slotLabel: 'Emplacement',
    slotFree: (name: string) => `${name} (libre)`,
    slotUsed: (name: string, title: string) => `${name} (occupé : ${title})`,
    overwriteTitle: 'Remplacer la partie existante ?',
    overwriteText: 'La partie de cet emplacement sera remplacée.',
    start: 'Commencer',
    noCases: 'Aucune affaire n’est disponible.',
    noCasesHint: 'Le contenu n’a pas été compilé (npm run content:build).',
    devFixture: 'Affaire de test du moteur (développement)',
    devFixtureHint: 'Affichée seulement en développement, quand aucune affaire n’est compilée.',
    edition: (e: string): string => (e === 'demo' ? 'Démo' : 'Version complète'),
    statusNew: 'Non ouvert',
    statusOngoing: (pct: number) => `En cours, ${pct} %`,
    statusDone: (n: number, t: number) => `Rapport remis · fins vues ${n} / ${t}`,
  },

  hintPresets: {
    0: 'Archiviste : aucune aide',
    1: 'Enquêteur : pastilles et « Où chercher ? »',
    2: 'Assisté : compteur de groupe',
    3: 'Guidé : indices progressifs',
    custom: 'Personnalisé',
  } as Record<string, string>,

  options: {
    title: 'Options',
    tabsLabel: 'Catégories d’options',
    tabs: {
      game: 'Jeu',
      hints: 'Aides',
      display: 'Affichage',
      accessibility: 'Accessibilité',
      audio: 'Audio',
      controls: 'Contrôles',
      language: 'Langue',
      data: 'Données',
    },
    validation: 'Validation des cases',
    validationAuto: 'Automatique (par trois, après 800 ms)',
    validationManual: 'Bouton « Soumettre la branche »',
    showTimer: 'Afficher le temps de jeu',
    confirmClear: 'Confirmer avant d’effacer un champ',
    longPress: 'Durée de l’appui long',
    ms: (v: number) => `${v} ms`,
    hintPreset: 'Préréglage',
    unreadBadges: 'Pastilles « non lu »',
    exhaustedTerms: 'Termes épuisés grisés',
    placeCounters: 'Compteur de fiches par lieu',
    whereToLook: 'Bouton « Où chercher ? »',
    groupCounter: 'Compteur de groupe après une évaluation',
    progressiveHints: 'Indices progressifs par case',
    textScale: 'Taille du texte',
    readScale: 'Taille du texte des documents (Lecteur)',
    sideWidth: 'Largeur du volet des documents',
    sideWidthStandard: 'Standard',
    sideWidthWide: 'Large',
    sideWidthCustom: (px: number) => `Personnalisée (${px} px)`,
    readingFont: 'Police de lecture',
    readingFontDefault: 'Par défaut (Literata)',
    readingFontLegible: 'Lisibilité (Atkinson Hyperlegible)',
    readingFontDyslexic: 'Adaptée à la dyslexie',
    lineSpacing: 'Interlignage',
    lineSpacingDefault: 'Normal',
    lineSpacingWide: 'Large (1,5)',
    lineSpacingWider: 'Très large (1,8)',
    letterSpacing: 'Espacement des lettres augmenté',
    transcriptByDefault: 'Ouvrir les documents en transcription',
    replaceHandwriting: 'Remplacer l’écriture manuscrite',
    highContrast: 'Contraste élevé',
    reducePaperTexture: 'Réduire la texture du papier',
    colorVision: 'Palette des couleurs',
    colorVisionDefault: 'Standard',
    protanopia: 'Protanopie',
    deuteranopia: 'Deutéranopie',
    tritanopia: 'Tritanopie',
    motion: 'Animations',
    motionSystem: 'Comme le système',
    motionReduced: 'Réduites',
    motionFull: 'Complètes',
    volume: {
      master: 'Volume général',
      music: 'Musique',
      ambience: 'Ambiances',
      sfx: 'Effets',
      ui: 'Interface',
    } as Record<string, string>,
    noMusic: 'Musique composée en direct : elle ne se répète jamais.',
    mono: 'Son mono',
    muteInBackground: 'Couper le son en arrière-plan',
    haptics: 'Vibrations',
    inputGlyphs: 'Symboles des touches',
    glyphsAuto: 'Selon le dernier périphérique',
    glyphsKeyboard: 'Clavier',
    glyphsGamepad: 'Manette',
    shortcuts: 'Raccourcis clavier',
    rebind: 'Modifier',
    rebindFor: (action: string) => `Modifier le raccourci : ${action}`,
    pressKey: 'Appuyez sur une touche… (Échap pour annuler)',
    resetKeys: 'Rétablir les raccourcis',
    keysReset: 'Raccourcis rétablis.',
    keyConflict: (other: string) => `Touche déjà utilisée par « ${other} » : échangée.`,
    keyBound: (action: string, key: string) => `${action} : ${key}`,
    noKey: 'Aucune',
    gamepadTitle: 'Manette',
    gamepadNone: 'Aucune manette détectée. Branchez-en une et appuyez sur un bouton.',
    gamepadConnected: (name: string) => `Manette détectée : ${name}`,
    language: 'Langue',
    languageSystem: 'Langue du système',
    languageSystemDetail: (name: string) => `Langue du système (${name})`,
    languageHint: 'Votre partie, votre arbre et vos notes restent tels quels.',
    languageContentFallback:
      'Les pièces de l’affaire restent en français tant que leur traduction n’est pas prête.',
    resetSettings: 'Rétablir les réglages par défaut',
    resetDone: 'Réglages rétablis.',
    tutorialReplay: 'Revoir le tutoriel',
    tutorialReplayHint:
      'Les notes de service reviendront une à une, au fil de vos gestes, dès la reprise de la partie.',
    tutorialReplayDone: 'Le tutoriel reprendra au bureau.',
    storageNote:
      'Les parties sont enregistrées sur cet appareil. Exportez-les pour les transférer.',
    manageSaves: 'Gérer les emplacements',
    percent: (v: number) => `${Math.round(v * 100)} %`,
    textScaleValue: (v: number) => `${Math.round(v * 100)} %`,
  },

  achievements: {
    title: 'Succès',
    obtained: 'Obtenus',
    locked: 'À obtenir',
    hidden: '???',
    hiddenDesc: 'Succès caché',
    obtainedOn: (d: string) => `Obtenu le ${d}`,
    count: (n: number, t: number) => `${n} / ${t} obtenus`,
    none: 'Aucune affaire chargée : les succès apparaîtront ici.',
    noneForCase: 'Aucun succès pour cette affaire.',
    unlockedToast: 'Succès obtenu',
  },

  stats: {
    title: 'Statistiques',
    current: 'Partie en cours',
    global: 'Toutes parties',
    playTime: 'Temps de jeu',
    documents: 'Documents lus',
    keywords: 'Termes recherchés',
    queries: 'Requêtes',
    emptyQueries: 'dont sans résultat',
    places: 'Lieux ouverts',
    slots: 'Cases établies',
    secrets: 'Secrets',
    hints: 'Indices utilisés',
    endings: 'Fins vues',
    bestTime: 'Meilleur temps chronométré',
    achievements: 'Succès obtenus',
    noGame: 'Aucune partie en cours.',
    none: '—',
    of: (n: number, t: number) => `${n} / ${t}`,
  },

  bonus: {
    title: 'Bonus',
    locked: 'Terminez l’affaire pour débloquer les bonus.',
    endingsSeen: 'Fins vues',
    portraits: 'Galerie des portraits établis',
    map: 'Carte complète',
    mapLocked: 'Débloquée par l’épilogue à 100 %.',
    artbook: 'Artbook',
    artbookSoon: 'Les planches de l’artbook arriveront avec le contenu final.',
  },

  creditsScreen: {
    title: 'Crédits',
    designBy: 'Une conception de',
    designer: 'Nicolas Dessenius',
    edition: 'Édition et développement',
    writing: 'Écriture et illustration',
    publisher: 'Une production',
    fonts:
      'Polices : Fraunces, Literata, Instrument Sans, Oswald, Courier Prime, Caveat, Atkinson Hyperlegible Next (SIL OFL 1.1).',
    caseCredits: 'Affaire',
  },

  /**
   * Tutoriel en bulles (GAME_DESIGN §15) : notes d'une collègue de l'Office de réinscription
   * civile au nouveau rapporteur. ≤ 25 mots, une action attendue, rien au-delà de l'ouverture.
   */
  tutorial: {
    kicker: 'Note de service',
    ok: 'Compris',
    skip: 'Passer le tutoriel',
    skipped: 'Tutoriel passé. Tout reste expliqué dans Aide › Comment jouer.',
    restarted: 'Tutoriel relancé.',
    announce: (text: string) => `Note de service : ${text}`,
    steps: {
      welcome: (d: Device) =>
        `Bienvenue au bureau, rapporteur. Le dossier attend dans les Archives : ${tap(d)} une première pièce pour la lire.`,
      reader: (d: Device) =>
        `Lisez tout, marges comprises. Chaque mot souligné est une piste : ${tap(d)} l’un d’eux pour le noter ou le rechercher.`,
      catalogue: () =>
        'Un nom vous intrigue ? Saisissez-le au Catalogue : l’Office vous sort toutes les fiches qui le citent.',
      tree: (d: Device) =>
        `Vous tenez quelqu’un ? ${Tap(d)} une case de l’arbre : prénom, nom, visage et métier se choisissent parmi vos lectures.`,
      faces: (d: Device) =>
        `${Tap(d)} un visage pour le prendre, puis posez-le sur la bonne case de l’arbre.`,
      groups: (n: number) =>
        `Case remplie n’est pas case établie : l’Office confirme par groupe, quand les ${n} cases sont justes ensemble.`,
      established: () =>
        'Coup de tampon ! Ces cases sont établies, elles ne bougeront plus. Guettez les Archives : des pièces arrivent parfois avec.',
      notebook: () =>
        'Le Carnet garde chaque mot souligné, vos surlignages et vos notes. Ouvrez-le quand la mémoire flanche.',
      map: () =>
        'Les lieux cités se posent sur la Carte. Chacun a ses propres fonds d’archives : allez-y fouiller.',
      help: () =>
        'Un doute ? Aide › Comment jouer reprend tout, et « Où chercher ? » vous remet sur une piste. Bon courage !',
      // Cran « Nouveautés seulement » et nouveautés (AFFAIRE-2 §2.4), ≤ 25 mots chacune.
      returning: () =>
        'Content de vous revoir, rapporteur titulaire. Le dossier attend dans les Archives ; je ne vous signalerai que ce qui change.',
      claim: () =>
        'Le requérant a rempli cette case lui-même. Rien n’y est établi : retirez ou remplacez ce qui ne tient pas.',
      hearing: () =>
        'Un procès-verbal d’audition : ce qu’on déclare devant l’Office est une pièce comme une autre. Recoupez-la avec le dossier.',
      decision: () =>
        'Ce rapport se conclut par une décision de l’Office. Un tampon grisé signale une piste encore ouverte au dossier.',
    },
  },

  desk: {
    region: 'Bureau',
    headerLabel: 'En-tête du bureau',
    identified: (n: number, t: number) => `${n} / ${t} identifiés`,
    identifiedShort: (n: number, t: number) => `${n}/${t}`,
    identifiedLabel: (n: number, t: number) =>
      `${n} ${plural(n, 'personne identifiée', 'personnes identifiées')} sur ${t}`,
    secrets: (n: number) => `${n} / ? secrets`,
    secretsLabel: (n: number) => `${n} ${plural(n, 'secret découvert', 'secrets découverts')}`,
    timer: 'Chronomètre',
    unread: (n: number) => `${n} non ${plural(n, 'lu', 'lus')}`,
    help: 'Aide',
    /** Accès court au formulaire de signalement (DESIGN §13.8), en-tête du Bureau. */
    report: 'Signaler',
    pause: 'Pause',
    menu: 'Menu',
    back: 'Retour',
    railLabel: 'Panneaux du bureau',
    sideLabel: 'Volet latéral',
    tabsLabel: 'Onglets du bureau',
    sideResize: 'Largeur du volet latéral',
    sideResizeHint: 'Glisser pour élargir · double-clic : standard ou large',
    layoutLabel: 'Disposition du bureau',
    layouts: { investigate: 'Enquête', read: 'Lecture', tree: 'Arbre' },
    layoutHints: {
      investigate: 'Enquête : arbre et documents côte à côte',
      read: 'Lecture : documents en grand',
      tree: 'Arbre : arbre en grand, documents en fiche',
    },
    layoutChanged: (name: string) => `Disposition : ${name}`,
    cardLabel: 'Fiche des documents',
    cardMove: 'Déplacer la fiche',
    cardMoveHint: 'Glisser, ou flèches du clavier (Maj : plus loin)',
    cardCollapse: 'Replier la fiche',
    cardExpand: (name: string) => `Déplier la fiche : ${name}`,
    fullscreen: 'Plein écran',
    fullscreenLabel: 'Document en plein écran',
    fullscreenExit: 'Quitter le plein écran',
    fullscreenToCard: 'Revenir en fiche',
    fullscreenAway: 'Le document est affiché en plein écran.',
    fullscreenOn: 'Document en plein écran. Échap pour revenir.',
    sideCollapse: 'Replier le volet latéral',
    sideExpand: 'Déplier le volet latéral',
    moreTitle: 'Autres panneaux',
    miniReader: 'Document sous la main',
    miniReaderOpen: (t: string) => `Rouvrir : ${t}`,
    miniReaderHide: 'Ranger le document',
    drawerHandle: 'Agrandir ou réduire le tiroir',
    drawerTitle: 'Tiroir',
    drawerClose: 'Fermer le tiroir',
    validateBranch: 'Soumettre la branche',
    reopenReport: 'Remettre le rapport',
    saved: 'Partie sauvegardée.',
    gamepadLost: 'Manette déconnectée.',
    noDocument: 'Aucun document ouvert.',
    folder: (caseTitle: string) => `Dossier : ${caseTitle}`,
  },

  panels: {
    tree: 'Arbre',
    archives: 'Archives',
    reader: 'Lecteur',
    catalogue: 'Catalogue',
    notebook: 'Carnet',
    map: 'Carte',
    pinboard: 'Tableau d’épingles',
    journal: 'Journal',
    help: 'Aide',
    faces: 'Galerie des visages',
  } satisfies Record<PanelId, string>,
  placeholder: (name: string) => `Le panneau « ${name} » arrive bientôt.`,
  candidatePicker: 'Choisir un candidat',

  pause: {
    title: 'Pause',
    kicker: 'Le temps s’arrête',
    resume: 'Reprendre',
    options: 'Options',
    achievements: 'Succès',
    stats: 'Statistiques',
    saveQuit: 'Sauvegarder et quitter',
    quitConfirm: 'Revenir à l’écran titre ?',
    quitText: 'La partie est sauvegardée avant de quitter.',
  },

  reveal: {
    kicker: 'Révélation',
    groupDone: (label: string) => `Branche établie : ${label}`,
    generationDone: (n: number) => `Génération ${n} complète`,
    established: (names: string) => `Établis : ${names}.`,
    archived: 'Cette carte est archivée dans le Journal.',
    continue: 'Continuer',
  },

  secret: {
    kicker: 'Secret découvert',
    text: 'Ce que l’arbre ne dit pas : une vérité de plus s’ajoute au dossier.',
    archived: 'Retrouvez-le dans le Journal.',
    continue: 'Continuer',
  },

  ending: {
    kicker: 'Dénouement',
    continueInvestigation: 'Continuer l’enquête',
    toTitle: 'Revenir au titre',
    timedResults: 'Voir le temps',
    filed: 'Classé',
  },

  report: {
    kicker: 'Rapport final',
    title: 'Remettre le rapport',
    intro: 'L’arbre est complet. Avant de refermer le dossier, répondez à ces questions.',
    progress: (i: number, n: number) => `Question ${i} sur ${n}`,
    choiceKicker: 'Votre choix',
    questionKicker: 'Question',
    previous: 'Précédente',
    next: 'Suivante',
    submit: 'Remettre le rapport',
    later: 'Revenir au bureau',
    unanswered: 'Choisissez une réponse pour continuer.',
    summary: 'Vos réponses',
    change: 'Modifier',
    confirmTitle: 'Remettre le rapport ?',
    confirmText: 'Vos réponses ne pourront plus être modifiées et le dénouement s’affichera.',
    confirm: 'Remettre',
    cancel: 'Relire',
    noOption: 'Aucune réponse disponible',
    /** Décision (question `choice`) : tampon posé sur la fiche choisie. */
    decisionStamp: 'Visé',
    unavailable: 'Indisponible : ',
    backToFile: 'Revenir au dossier',
    confirmDecisionTitle: 'Apposer ce tampon ?',
    // AFFAIRE-2 §3.2 prévoit « Vous pourrez remettre un autre rapport après le dénouement. » :
    // à reprendre quand le moteur permettra un nouveau rapport après `finish` (pas encore le cas).
    confirmDecisionText:
      'Votre décision et vos réponses seront classées, puis le dénouement s’affichera.',
  },

  timed: {
    title: 'Résultats chronométrés',
    total: 'Temps total',
    splits: 'Fractionnés (verrouillages)',
    noSplits: 'Aucun fractionné enregistré pendant cette session.',
    best: 'Meilleur temps',
    newBest: 'Nouveau meilleur temps !',
    split: (i: number, n: number) => `Verrouillage ${i} : ${n} ${plural(n, 'case', 'cases')}`,
    toTitle: 'Revenir au titre',
  },

  announce: {
    documentsUnlocked: (n: number) =>
      `${n} ${plural(n, 'nouveau document', 'nouveaux documents')} dans vos archives.`,
    slotsRevealed: (n: number) =>
      `${n} ${plural(n, 'nouvelle case apparaît', 'nouvelles cases apparaissent')} dans l’arbre.`,
    slotsLocked: (n: number, names: string) =>
      `${n} ${plural(n, 'case établie', 'cases établies')} : ${names}.`,
    secretFound: (t: string) => `Secret découvert : ${t}.`,
    searchFound: (n: number) => `${n} ${plural(n, 'fiche trouvée', 'fiches trouvées')}.`,
    searchNone: 'Aucune fiche pour ce terme.',
    groupCounter: (n: number) =>
      `${n} ${plural(n, 'case correcte', 'cases correctes')} en jeu dans ce groupe.`,
    endingReached: 'L’arbre est complet.',
    unknownSlot: 'Case',
    // Case revendiquée (AFFAIRE-2 §1.8)
    claimOnOpen: (n: number) =>
      n > 1
        ? `${n} cases de l’arbre sont revendiquées : leur identité est déclarée, pas établie.`
        : 'Une case de l’arbre est revendiquée : son identité est déclarée, pas établie.',
    claimFieldRemoved: (field: string) =>
      `${field} déclaré retiré. Rétablir la déclaration : menu de la case.`,
    claimFieldReplaced: (field: string, value: string, n: number, t: number) =>
      `${field} : ${value}, posé. ${n} ${plural(n, 'champ déclaré', 'champs déclarés')} sur ${t}.`,
    claimRemoved: (n: number) =>
      `Déclaration retirée : ${n} ${plural(n, 'champ vidé', 'champs vidés')}.`,
    claimRestored: 'Déclaration rétablie.',
  },

  toasts: {
    newDocument: (t: string) => `Nouveau document : ${t}`,
    newDocuments: (n: number) => `${n} nouveaux documents`,
    open: 'Ouvrir',
    seeArchives: 'Voir les archives',
    pinsFull: 'Le tableau est plein.',
    pinsFullText: 'Retirez une épingle avant d’en ajouter une autre.',
    tooLong: 'Texte trop long.',
    groupCounterTitle: 'Compteur de groupe',
    saveFailed: 'Sauvegarde impossible (espace disque ?). Votre progression reste en mémoire.',
    exportNow: 'Exporter',
    storageBlocked:
      'Votre navigateur n’autorise pas la sauvegarde. Exportez votre partie avant de fermer.',
  },

  errors: {
    title: 'Une erreur est survenue',
    caseLoad: 'L’affaire n’a pas pu être chargée.',
    contentLoad: 'Les archives de l’affaire n’ont pas pu être chargées. Vérifiez votre connexion.',
    contentLoading: 'Ouverture des archives…',
    panelLoad: 'Ce panneau n’a pas pu être chargé. Vérifiez votre connexion.',
    code: (c: string) => `Code : ${c}`,
    copyLog: 'Copier le journal technique',
    copied: 'Journal copié.',
    toTitle: 'Revenir au titre',
    tooSmall: 'Agrandissez la fenêtre',
    tooSmallText: 'Le jeu a besoin d’au moins 360 pixels de large.',
  },

  /** Signaler un problème, Mes signalements (DESIGN §13.8, §13.9 ; ARCHITECTURE §8). */
  bugReport: {
    entry: 'Signaler un problème',
    entryError: 'Signaler ce problème',
    mine: 'Mes signalements',
    kicker: 'Formulaire de signalement',
    categoryLabel: 'Catégorie',
    categories: {
      bug: 'Quelque chose ne marche pas',
      blocked: 'Je suis bloqué dans l’enquête',
      text: 'Faute ou texte incorrect',
      display: 'Problème d’affichage',
      audio: 'Problème de son',
      controls: 'Commandes, clavier ou manette',
      performance: 'Lenteur ou plantage',
      other: 'Autre chose',
    } satisfies Record<ReportCategory, string>,
    descriptionLabel: 'Description',
    descriptionHint: 'Au moins 20 caractères. Ce que vous faisiez, ce que vous attendiez.',
    descriptionMissing: (n: number) =>
      `Encore ${n} ${plural(n, 'caractère', 'caractères')} avant de pouvoir envoyer.`,
    errorPrefill: (code: string, message: string) => `Erreur ${code} : ${message}\n\n`,
    contactLabel: 'Contact (facultatif)',
    contactHint: 'Jamais publié. Seulement pour vous répondre.',
    attachSave: 'Joindre ma sauvegarde anonymisée',
    attachSaveHint: 'Sans vos notes ni vos recherches.',
    attachSaveNone: 'Aucune partie à joindre.',
    saveStripped: (notes: number, queries: number) =>
      `Retirés de la sauvegarde : le texte de ${notes} ${plural(notes, 'note', 'notes')} et ${queries} ${plural(queries, 'recherche tapée', 'recherches tapées')}. L’arbre et la progression restent.`,
    saveTrimmed: 'Sauvegarde raccourcie pour tenir dans la limite (anciennes recherches).',
    saveTooLarge: 'Sauvegarde trop volumineuse : elle ne sera pas jointe.',
    saveDroppedForSize:
      'Sauvegarde retirée : avec elle, le signalement dépasserait la taille d’envoi permise (64 Ko). Le reste part tel quel.',
    honeypot: 'Site web (laisser vide)',
    previewSummary: 'Voir exactement ce qui sera envoyé',
    previewNote:
      'Rien d’autre : ni adresse IP, ni nom de joueur. elapsedMs est le temps passé sur ce formulaire (anti-robot) ; website doit rester vide.',
    platforms: { web: 'Navigateur', desktop: 'Ordinateur', android: 'Android' },
    submit: 'Envoyer le signalement',
    receipt: {
      stamp: 'Reçu',
      title: 'Signalement reçu',
      number: 'Numéro du signalement',
      keep: 'Gardez ce numéro : le suivi est aussi dans Mes signalements.',
      followLabel: 'Lien de suivi',
      open: 'Ouvrir le suivi sur le site',
      announce: (t: string) => `Signalement reçu, numéro ${t}.`,
    },
    failure: {
      toast: 'Signalement non envoyé',
      lead: 'Le service ne répond pas. Rien n’est perdu :',
      leadRefused: 'Le signalement n’a pas été accepté. Rien n’est perdu :',
      offline: 'Votre appareil semble hors ligne, ou le service est injoignable.',
      timeout: 'Pas de réponse au bout de 10 secondes.',
      unavailable: 'Le service de signalement est indisponible pour le moment.',
      disabled: 'Les signalements sont suspendus pour le moment.',
      rateLimited: (delay: string) =>
        `Trop de signalements envoyés depuis votre connexion. Réessayez dans ${delay}.`,
      rateLimitedLater: 'Trop de signalements envoyés depuis votre connexion. Réessayez plus tard.',
      invalid: 'Vérifiez la description (20 à 4 000 caractères) et le contact (200 au plus).',
      tooLarge: 'Le signalement est trop long.',
      help: 'Copiez le rapport pour le coller sur le forum (sans votre contact, le forum est public), ou réessayez plus tard.',
      copy: 'Copier le rapport',
      copied: 'Rapport copié',
      copyFailed: 'Copie impossible : sélectionnez le texte ci-dessous.',
      copyArea: 'Rapport à copier',
      forum: 'Forum itch.io',
    },
    text: {
      heading: 'Signalement · L’Arbre aux absents (jeu)',
      category: 'Catégorie :',
      description: 'Description :',
      diagnostics: 'Diagnostics :',
    },
    linkCopied: 'Le lien n’a pas pu s’ouvrir : il a été copié.',
    linkFailed: 'Le lien n’a pas pu s’ouvrir.',
    listLabel: 'Signalements envoyés depuis cet appareil',
    empty: 'Aucun signalement envoyé depuis cet appareil.',
    sentOn: (d: string) => `Envoyé le ${d}`,
    ticket: {
      kicker: 'Fiche de suivi',
      title: (t: string) => `Signalement ${t}`,
      loading: 'Lecture de la fiche…',
      updated: (d: string) => `Mis à jour le ${d}`,
      seen: (d: string) => `vu le ${d}`,
      replies: 'Réponses de l’équipe',
      replyDate: (d: string) => `Le ${d}`,
      noReplies: 'Pas encore de réponse de l’équipe.',
      unknown: 'Statut pas encore lu.',
      offline: 'Statut indisponible pour le moment (hors ligne ou service injoignable).',
      rateLimited: (delay: string) => `Trop de consultations. Réessayez dans ${delay}.`,
      notFound:
        'Ce suivi n’existe plus : le signalement a été supprimé, ou il est clos depuis plus de 12 mois.',
      openSite: 'Ouvrir sur le site',
      remove: 'Supprimer mon signalement',
      forget: 'Retirer de la liste',
      confirmTitle: 'Supprimer ce signalement ?',
      confirmText: 'Le ticket ne sera plus lisible.',
      keep: 'Garder',
      confirm: 'Supprimer',
      deleted: 'Signalement supprimé.',
      deleteFailed: 'Suppression impossible pour le moment. Réessayez plus tard.',
    },
  },

  /** Textes de la plateforme (avertissements de stockage, dialogues de fichier sous Tauri). */
  platform: {
    storageMemory:
      'Le stockage de ce navigateur est indisponible : votre partie sera perdue à la fermeture. Exportez-la pour la conserver.',
    storageTauri:
      'Le dossier des sauvegardes est inaccessible : votre partie sera perdue à la fermeture.',
    exportTitle: 'Exporter la partie',
    importTitle: 'Importer une partie',
    saveFilter: 'Sauvegarde',
  },

  commands: {
    back: 'Retour / fermer / pause',
    pause: 'Pause',
    'tab.tree': 'Onglet Arbre',
    'tab.archives': 'Onglet Archives',
    'tab.catalogue': 'Onglet Catalogue',
    'tab.notebook': 'Onglet Carnet',
    'tab.map': 'Onglet Carte',
    'tab.pinboard': 'Tableau d’épingles',
    'tab.journal': 'Journal',
    'tab.faces': 'Galerie des visages',
    help: 'Aide',
    search: 'Barre du Catalogue',
    'history.back': 'Historique : précédent',
    'history.forward': 'Historique : suivant',
    'side.narrower': 'Rétrécir le volet latéral',
    'side.wider': 'Élargir le volet latéral',
    fullscreen: 'Plein écran',
    save: 'Sauvegarde manuelle',
    'reader.transcript': 'Lecteur : original / transcription',
    'reader.flip': 'Lecteur : retourner',
    'reader.textUp': 'Lecteur : texte plus grand',
    'reader.textDown': 'Lecteur : texte plus petit',
    'reader.fullscreen': 'Lecteur : plein écran',
    'layout.investigate': 'Disposition Enquête',
    'layout.read': 'Disposition Lecture',
    'layout.tree': 'Disposition Arbre',
    'page.prev': 'Page précédente',
    'page.next': 'Page suivante',
    'zoom.in': 'Zoom avant',
    'zoom.out': 'Zoom arrière',
    'zoom.fit': 'Ajuster',
    pin: 'Épingler',
    highlight: 'Surligner',
    note: 'Note',
    use: 'Utiliser dans l’arbre',
    clear: 'Vider le champ',
    context: 'Menu contextuel',
  } as Record<string, string>,

  glyphs: {
    pause: 'Pause',
    back: 'Retour',
    select: 'Choisir',
    tabs: 'Onglets',
  },

  /** Durées lisibles (lib/game/format.ts). */
  format: {
    lessThanMinute: 'moins d’une minute',
    minutes: (m: number) => `${m} min`,
    hoursMinutes: (h: number, m: number) => `${h} h ${pad2(m)} min`,
  },

  /** Dates partielles du monde (« 1923 », « avril 1923 », « 17 avril 1923 »). */
  dates: {
    months: [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ],
    day: (day: number, month: string, year: string) =>
      `${day === 1 ? '1er' : day} ${month} ${year}`,
    month: (month: string, year: string) => `${month} ${year}`,
  },

  /** Noms des touches affichés (Options › Contrôles). */
  keys: {
    Escape: 'Échap',
    PageUp: 'PgPréc',
    PageDown: 'PgSuiv',
    Delete: 'Suppr',
    Shift: 'Maj',
    ContextMenu: 'Menu',
    ' ': 'Espace',
  } as Record<string, string>,

  /** Types de pièces (DocumentKind). */
  kindLabels: {
    letter: 'Lettre',
    newspaper: 'Coupure de presse',
    photo: 'Photographie',
    register: 'Registre',
    certificate: 'Acte',
    postcard: 'Carte postale',
    directory: 'Annuaire',
    telegram: 'Télégramme',
    catalog: 'Fiche de catalogue',
    note: 'Note',
    object: 'Objet',
    report: 'Rapport',
    advert: 'Réclame',
  } satisfies Record<DocumentKind, string>,

  fieldLabels: {
    given: 'Prénom',
    family: 'Nom',
    portrait: 'Portrait',
    occupation: 'Métier',
  } satisfies Record<SlotField, string>,

  /** « aucun prénom », « aucun nom »… pour les états vides du sélecteur. */
  fieldArticles: {
    given: 'aucun prénom',
    family: 'aucun nom',
    portrait: 'aucun visage',
    occupation: 'aucun métier',
  } satisfies Record<SlotField, string>,

  keywordRubrics: {
    person: 'Personnes',
    place: 'Lieux',
    organization: 'Organisations',
    event: 'Dates et événements',
    object: 'Objets',
    other: 'Divers',
  } satisfies Record<KeywordKind, string>,

  rubricEmpty: {
    person: 'Aucune personne notée pour l’instant.',
    place: 'Aucun lieu noté pour l’instant.',
    organization: 'Aucune organisation notée pour l’instant.',
    event: 'Aucun événement noté pour l’instant.',
    object: 'Aucun objet noté pour l’instant.',
    other: 'Rien de noté pour l’instant.',
  } satisfies Record<KeywordKind, string>,

  /** Couleurs de surlignage (1 à 5), chacune avec son motif. */
  hlLabels: ['Jaune, plein', 'Vert, hachuré', 'Bleu, pointillé', 'Rose, ondulé', 'Orange, encadré'],
};

/** Textes chargés au démarrage (tout sauf les sections différées, `./sections`). */
export type CoreMessages = typeof fr;
/** Catalogue complet, tel que le lit l’interface (sections différées comprises). */
export type Messages = CoreMessages & DeskMessages;
