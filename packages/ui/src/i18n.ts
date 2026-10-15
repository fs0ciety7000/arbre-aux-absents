import { getContext, setContext } from 'svelte';

/**
 * Textes par défaut des primitives (DESIGN.md §4.4 et §9.35). Les primitives ne portent plus de
 * français en dur : elles lisent ces catalogues dans le contexte Svelte. Une prop explicite
 * (`closeLabel`, `label`…) l'emporte toujours ; sans contexte, c'est le français.
 *
 * Les unions ci-dessous recopient `@arbre/contract` (`Locale`, `TicketStatus`,
 * `TicketClosedReason`) : `@arbre/ui` ne dépend d'aucun paquet du dépôt. Un type du contrat se
 * passe tel quel (mêmes chaînes).
 */
export type UiLocale = 'fr' | 'en';
export type UiTicketStatus = 'received' | 'confirmed' | 'in-progress' | 'fixed' | 'closed';
export type UiTicketClosedReason = 'resolved' | 'duplicate' | 'not-planned';

/** Nom de chaque langue **dans sa propre langue** (jamais traduit), avec son code court. */
export const LANGUAGE_NAMES: Record<UiLocale, { name: string; short: string }> = {
  fr: { name: 'Français', short: 'FR' },
  en: { name: 'English', short: 'EN' },
};

export interface UiStrings {
  locale: UiLocale;
  dialog: { close: string };
  panel: { close: string };
  toast: { close: string; region: string };
  combobox: {
    placeholder: string;
    empty: string;
    listLabel: string;
    count: (n: number) => string;
  };
  claimTag: { label: string };
  decision: { stamp: string; unavailable: string };
  caseFolder: { lastDecision: string };
  loader: { label: string };
  skipLink: { label: string };
  card: { pinned: string };
  stamp: { established: string };
  toggle: { on: string; off: string };
  textField: { characters: string };
  markdown: {
    /** Nom accessible de la barre d'outils. */
    toolbar: string;
    format: Record<
      'bold' | 'italic' | 'code' | 'codeBlock' | 'bulletList' | 'numberedList' | 'quote' | 'link',
      string
    >;
    /** Bascule de l'aperçu. */
    preview: string;
    /** Nom de la zone d'aperçu. */
    previewRegion: string;
    previewEmpty: string;
    /** Textes insérés quand rien n'est sélectionné. */
    placeholder: { text: string; code: string; url: string };
    /** Mention du raccourci dans l'info-bulle : « Ctrl+B ». */
    shortcut: (key: string, mac: boolean) => string;
  };
  attachments: {
    label: string;
    hint: (max: number) => string;
    add: string;
    /** Bouton de retrait, nom accessible : « Retirer la capture 2 (photo.png) ». */
    remove: (n: number, name: string) => string;
    retry: string;
    /** Texte alternatif de la vignette. */
    alt: (n: number) => string;
    status: { preparing: string; uploading: string; ready: string };
    errors: Record<
      | 'type'
      | 'decode'
      | 'tooLarge'
      | 'rateLimited'
      | 'disabled'
      | 'offline'
      | 'timeout'
      | 'unavailable'
      | 'invalid',
      string
    >;
    /** Images au-delà du maximum, ignorées. */
    ignored: (n: number, max: number) => string;
    full: (max: number) => string;
    drop: string;
    /** Annonce polie : « 2 captures sur 3 ». */
    count: (n: number, max: number) => string;
  };
  gallery: {
    label: string;
    open: (n: number) => string;
    alt: (n: number) => string;
    broken: string;
  };
  keyHint: {
    /** Nom accessible d'un glyphe de manette : « Bouton A » / “A button”. */
    button: (name: string) => string;
    playstation: { south: string; east: string; west: string; north: string };
    xbox: { start: string; select: string };
    playstationMenu: { start: string; select: string };
    dpad: string;
    lstick: string;
    rstick: string;
    /** Lettre du stick gauche / droit sur le glyphe. */
    stickLetter: { left: string; right: string };
  };
  language: {
    /** Légende du sélecteur (lue, masquée par défaut). */
    label: string;
  };
  ticket: {
    /** Nom accessible de la frise. */
    label: string;
    status: Record<UiTicketStatus, string>;
    /** Libellé du tampon « Corrigé » avec sa version. */
    fixedIn: (version: string) => string;
    closedReason: Record<UiTicketClosedReason, string>;
    /** Dernière étape tant que le ticket n'est ni corrigé ni classé. */
    outcome: string;
    state: { done: string; current: string; upcoming: string; skipped: string };
  };
}

export const uiFr: UiStrings = {
  locale: 'fr',
  dialog: { close: 'Fermer' },
  panel: { close: 'Fermer le panneau' },
  toast: { close: 'Fermer la notification', region: 'Notifications' },
  combobox: {
    placeholder: 'Filtrer…',
    empty: 'Aucun candidat ne correspond.',
    listLabel: 'Candidats',
    count: (n) => `${n} ${n > 1 ? 'candidats' : 'candidat'}`,
  },
  claimTag: { label: 'Déclaré' },
  decision: { stamp: 'Visé', unavailable: 'Indisponible : ' },
  caseFolder: { lastDecision: 'Dernière décision : ' },
  loader: { label: 'Chargement…' },
  skipLink: { label: 'Aller au contenu' },
  card: { pinned: 'Épinglé' },
  stamp: { established: 'Établi' },
  toggle: { on: 'Activé', off: 'Désactivé' },
  textField: { characters: 'Caractères : ' },
  markdown: {
    toolbar: 'Mise en forme',
    format: {
      bold: 'Gras',
      italic: 'Italique',
      code: 'Code',
      codeBlock: 'Bloc de code',
      bulletList: 'Liste à puces',
      numberedList: 'Liste numérotée',
      quote: 'Citation',
      link: 'Lien',
    },
    preview: 'Aperçu',
    previewRegion: 'Aperçu de la description',
    previewEmpty: 'Rien à afficher pour l’instant.',
    placeholder: { text: 'texte', code: 'code', url: 'https://' },
    shortcut: (key, mac) => (mac ? `⌘${key}` : `Ctrl+${key}`),
  },
  attachments: {
    label: 'Captures d’écran (facultatif)',
    hint: (max) =>
      `PNG, JPEG ou WebP, ${max} au plus. Vous pouvez aussi coller (Ctrl+V) ou déposer une image ici. Les images trop grandes sont réduites.`,
    add: 'Ajouter une capture',
    remove: (n, name) => `Retirer la capture ${n} (${name})`,
    retry: 'Réessayer',
    alt: (n) => `Capture ${n}`,
    status: { preparing: 'Préparation…', uploading: 'Envoi…', ready: 'Jointe' },
    errors: {
      type: 'Format refusé : PNG, JPEG ou WebP.',
      decode: 'Image illisible.',
      tooLarge: 'Image trop lourde, même réduite.',
      rateLimited: 'Trop d’images envoyées : réessayez plus tard.',
      disabled: 'Envois suspendus pour le moment.',
      offline: 'Hors ligne : image non envoyée.',
      timeout: 'Envoi trop long, interrompu.',
      unavailable: 'Service indisponible : image non envoyée.',
      invalid: 'Image refusée par le service.',
    },
    ignored: (n, max) =>
      `${n} ${n > 1 ? 'images ignorées' : 'image ignorée'} : ${max} captures au plus.`,
    full: (max) => `${max} captures au plus : retirez-en une pour en ajouter.`,
    drop: 'Déposez l’image pour la joindre',
    count: (n, max) => `${n} ${n > 1 ? 'captures' : 'capture'} sur ${max}`,
  },
  gallery: {
    label: 'Captures jointes',
    open: (n) => `Agrandir la capture ${n}`,
    alt: (n) => `Capture ${n} jointe au signalement`,
    broken: 'Image indisponible',
  },
  keyHint: {
    button: (name) => `Bouton ${name}`,
    playstation: { south: 'Croix', east: 'Rond', west: 'Carré', north: 'Triangle' },
    xbox: { start: 'Menu', select: 'Vue' },
    playstationMenu: { start: 'Options', select: 'Créer' },
    dpad: 'Croix directionnelle',
    lstick: 'Stick gauche',
    rstick: 'Stick droit',
    stickLetter: { left: 'G', right: 'D' },
  },
  language: { label: 'Langue' },
  ticket: {
    label: 'Suivi du signalement',
    status: {
      received: 'Reçu',
      confirmed: 'Confirmé',
      'in-progress': 'En cours',
      fixed: 'Corrigé',
      closed: 'Classé',
    },
    fixedIn: (v) => `Corrigé ${v}`,
    closedReason: { resolved: 'Résolu', duplicate: 'Doublon', 'not-planned': 'Non retenu' },
    outcome: 'Corrigé ou classé',
    state: {
      done: 'étape franchie',
      current: 'étape actuelle',
      upcoming: 'à venir',
      skipped: 'sans objet',
    },
  },
};

/** Anglais britannique (docs/i18n/en/GLOSSAIRE.md fait foi pour le vocabulaire du jeu). */
export const uiEn = {
  locale: 'en',
  dialog: { close: 'Close' },
  panel: { close: 'Close panel' },
  toast: { close: 'Dismiss notification', region: 'Notifications' },
  combobox: {
    placeholder: 'Filter…',
    empty: 'No candidate matches.',
    listLabel: 'Candidates',
    count: (n) => `${n} ${n === 1 ? 'candidate' : 'candidates'}`,
  },
  claimTag: { label: 'Declared' },
  decision: { stamp: 'Endorsed', unavailable: 'Unavailable: ' },
  caseFolder: { lastDecision: 'Last decision: ' },
  loader: { label: 'Loading…' },
  skipLink: { label: 'Skip to content' },
  card: { pinned: 'Pinned' },
  stamp: { established: 'Established' },
  toggle: { on: 'On', off: 'Off' },
  textField: { characters: 'Characters: ' },
  markdown: {
    toolbar: 'Formatting',
    format: {
      bold: 'Bold',
      italic: 'Italic',
      code: 'Code',
      codeBlock: 'Code block',
      bulletList: 'Bulleted list',
      numberedList: 'Numbered list',
      quote: 'Quote',
      link: 'Link',
    },
    preview: 'Preview',
    previewRegion: 'Description preview',
    previewEmpty: 'Nothing to preview yet.',
    placeholder: { text: 'text', code: 'code', url: 'https://' },
    shortcut: (key, mac) => (mac ? `⌘${key}` : `Ctrl+${key}`),
  },
  attachments: {
    label: 'Screenshots (optional)',
    hint: (max) =>
      `PNG, JPEG or WebP, up to ${max}. You can also paste (Ctrl+V) or drop an image here. Large images are scaled down.`,
    add: 'Add a screenshot',
    remove: (n, name) => `Remove screenshot ${n} (${name})`,
    retry: 'Try again',
    alt: (n) => `Screenshot ${n}`,
    status: { preparing: 'Preparing…', uploading: 'Uploading…', ready: 'Attached' },
    errors: {
      type: 'Format not accepted: PNG, JPEG or WebP.',
      decode: 'Unreadable image.',
      tooLarge: 'Image too heavy, even scaled down.',
      rateLimited: 'Too many images sent: try again later.',
      disabled: 'Uploads are paused for now.',
      offline: 'Offline: image not sent.',
      timeout: 'Upload took too long and was stopped.',
      unavailable: 'Service unavailable: image not sent.',
      invalid: 'Image rejected by the service.',
    },
    ignored: (n, max) =>
      `${n} ${n === 1 ? 'image' : 'images'} ignored: ${max} screenshots at most.`,
    full: (max) => `${max} screenshots at most: remove one to add another.`,
    drop: 'Drop the image to attach it',
    count: (n, max) => `${n} of ${max} ${max === 1 ? 'screenshot' : 'screenshots'}`,
  },
  gallery: {
    label: 'Attached screenshots',
    open: (n) => `Enlarge screenshot ${n}`,
    alt: (n) => `Screenshot ${n} attached to the report`,
    broken: 'Image unavailable',
  },
  keyHint: {
    button: (name) => `${name} button`,
    playstation: { south: 'Cross', east: 'Circle', west: 'Square', north: 'Triangle' },
    xbox: { start: 'Menu', select: 'View' },
    playstationMenu: { start: 'Options', select: 'Create' },
    dpad: 'D-pad',
    lstick: 'Left stick',
    rstick: 'Right stick',
    stickLetter: { left: 'L', right: 'R' },
  },
  language: { label: 'Language' },
  ticket: {
    label: 'Report progress',
    status: {
      received: 'Received',
      confirmed: 'Confirmed',
      'in-progress': 'In progress',
      fixed: 'Fixed',
      closed: 'Closed',
    },
    fixedIn: (v) => `Fixed in ${v}`,
    closedReason: { resolved: 'Resolved', duplicate: 'Duplicate', 'not-planned': 'Not planned' },
    outcome: 'Fixed or closed',
    state: {
      done: 'step completed',
      current: 'current step',
      upcoming: 'upcoming',
      skipped: 'n/a',
    },
  },
} satisfies UiStrings;

export const UI_STRINGS: Record<UiLocale, UiStrings> = { fr: uiFr, en: uiEn };

const KEY = Symbol('arbre-ui-strings');

type Source = UiStrings | (() => UiStrings);

/**
 * Pose les textes des primitives pour tout le sous-arbre (à appeler à l'initialisation d'un
 * composant racine). Passer une **fonction** qui lit un état réactif (`() => UI_STRINGS[lang]`)
 * pour que le changement de langue en cours de partie se propage sans remonter les composants.
 */
export function setUiStrings(source: Source): void {
  setContext(KEY, typeof source === 'function' ? source : () => source);
}

/**
 * Textes courants. L'objet rendu relit la source à chaque accès : lu dans un gabarit ou un
 * `$derived`, il suit la langue. Sans `setUiStrings` au-dessus : français.
 */
export function getUiStrings(): UiStrings {
  const read = getContext<(() => UiStrings) | undefined>(KEY);
  if (!read) return uiFr;
  return new Proxy({} as UiStrings, {
    get: (_, key) => read()[key as keyof UiStrings],
    has: (_, key) => key in read(),
    ownKeys: () => Reflect.ownKeys(read()),
    getOwnPropertyDescriptor: (_, key) => Reflect.getOwnPropertyDescriptor(read(), key),
  });
}
