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
