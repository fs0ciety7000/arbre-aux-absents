import type {
  Achievement,
  CaseMeta,
  CompiledCase,
  DocumentFrontmatter,
  Family,
  Hint,
  Place,
  Profile,
  Progression,
  SaveState,
  TreeSpec,
  WorldMap,
} from '../src';
import { defaultProfile } from '../src';

export const caseMeta: CaseMeta = {
  id: 'maison-vellard',
  title: 'La maison Vellard',
  subtitle: 'Prologue',
  version: '1.0.0',
  intro: 'lettre-notaire',
  epilogue: 'epilogue',
  timedTargetsMs: [3_600_000, 7_200_000],
  credits: ['CM Creative Lab'],
};

export const family: Family = {
  persons: [
    {
      id: 'aldo-vellard',
      given: ['Aldo', 'Aldus'],
      family: ['Vellard'],
      occupation: 'horloger',
      portrait: 'aldo',
      born: '1871-03',
      died: '1932',
      parents: [null, null],
      unions: ['mira-ostel'],
      bibleNotes: 'Secret : il a deux familles.',
    },
    {
      id: 'mira-ostel',
      given: ['Mira'],
      family: ['Ostel', 'Vellard'],
      nicknames: ['Mimi'],
      occupation: 'horloger',
      portrait: 'mira',
      born: '1875-11-02',
    },
  ],
  occupations: [{ id: 'horloger', label: 'Horloger' }],
  portraits: [
    { id: 'aldo', file: 'portraits/aldo.svg', alt: 'Homme moustachu en redingote' },
    { id: 'mira', file: 'portraits/mira.svg', alt: 'Femme au chignon', caption: 'Vers 1900' },
  ],
};

export const tree: TreeSpec = {
  slots: [
    { id: 'g0-aldo', person: 'aldo-vellard', generation: 0, column: 0, prefilled: true },
    {
      id: 'g0-mira',
      person: 'mira-ostel',
      generation: 0,
      column: 1,
      revealedBy: { all: [{ read: 'lettre-notaire' }, { searched: 'ostel' }] },
    },
  ],
  groups: [{ id: 'branche-vellard', label: 'Branche Vellard', slots: ['g0-mira'], threshold: 3 }],
};

export const frontmatter: DocumentFrontmatter = {
  kind: 'letter',
  title: 'Lettre du notaire',
  date: '1932-04-17',
  author: 'Maître Quindal',
  place: 'port-asmer',
  archive: 'Fonds Quindal, cote Q-12',
  reveals: { portraits: ['aldo'], occupations: ['horloger'] },
  illustration: { file: 'illustrations/sceau.svg', alt: 'Sceau de cire' },
  optional: false,
};

export const progression: Progression = {
  start: ['lettre-notaire'],
  unlocks: { 'acte-naissance': { searched: 'ostel' } },
  keywords: [
    {
      id: 'ostel',
      label: 'Ostel',
      kind: 'person',
      terms: ['Ostel', 'famille Ostel'],
      autolink: true,
      results: [
        { documents: ['acte-naissance'] },
        { documents: ['photo-atelier'], requires: { visited: 'port-asmer' } },
      ],
    },
  ],
  places: [
    {
      place: 'port-asmer',
      revealedBy: { read: 'lettre-notaire' },
      documents: [{ id: 'photo-atelier', requires: { lockedCount: { gte: 2 } } }],
    },
  ],
  occupationsUnlock: { horloger: { read: 'photo-atelier' } },
  secrets: [
    {
      id: 'deux-familles',
      title: 'Deux familles',
      discoveredBy: { groupLocked: 'branche-vellard' },
    },
  ],
  endings: [
    {
      id: 'verite',
      file: 'endings/verite.md',
      when: { all: [{ secret: 'deux-familles' }, { not: { locked: 'g0-mira' } }] },
      priority: 2,
    },
    { id: 'silence', file: 'endings/silence.md', when: { lockedCount: { gte: 0 } }, priority: 1 },
  ],
  demo: { documents: ['lettre-notaire'], slots: ['g0-mira'], end: 'fin-demo' },
};

export const hints: Hint[] = [
  {
    id: 'mira-1',
    target: { slot: 'g0-mira' },
    level: 1,
    text: 'Cette personne apparaît dans un registre.',
    availableWhen: { unlocked: 'acte-naissance' },
  },
  {
    id: 'branche-1',
    target: { group: 'branche-vellard' },
    level: 3,
    text: 'Regardez la photo de l’atelier.',
    availableWhen: { any: [{ read: 'photo-atelier' }, { visited: 'port-asmer' }] },
  },
];

export const achievements: Achievement[] = [
  {
    id: 'verite-nue',
    title: 'La vérité nue',
    description: 'Atteindre la fin « vérité ».',
    hidden: false,
    when: { endingReached: 'verite' },
  },
  {
    id: 'eclair',
    title: 'Éclair',
    description: 'Finir en moins d’une heure, tous secrets trouvés.',
    hidden: true,
    when: {
      all: [
        { timedUnderMs: 3_600_000 },
        { allSecrets: true },
        { not: { secret: 'deux-familles' } },
      ],
    },
  },
];

export const worldMap: WorldMap = {
  aspect: 1.4,
  layers: ['base', 'relief', 'water', 'places', 'labels'],
  minZoom: 1,
  maxZoom: 8,
  title: 'Les Terres d’Asmer',
  attribution: 'CM Creative Lab',
};

export const place: Place = {
  id: 'port-asmer',
  name: 'Port-Asmer',
  kind: 'city',
  position: { x: 0.42, y: 0.61 },
  description: 'Ville portuaire.',
};

export const saveState: SaveState = {
  schemaVersion: 1,
  caseId: 'maison-vellard',
  contentHash: '0a1b2c3d',
  edition: 'full',
  slot: 'slot-1',
  mode: 'standard',
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_100_000,
  elapsedMs: 100_000,
  report: {},
  unlocked: { 'lettre-notaire': 1_700_000_000_000 },
  read: { 'lettre-notaire': 1_700_000_001_000 },
  searched: ['ostel'],
  searchLog: [
    { query: 'Ostel', keyword: 'ostel', at: 1_700_000_002_000 },
    { query: 'horloge', keyword: null, at: 1_700_000_003_000 },
  ],
  visited: ['port-asmer'],
  revealedSlots: ['g0-mira'],
  tree: { 'g0-mira': { given: 'Mira', family: 'Ostel', portrait: 'mira', occupation: null } },
  locked: {},
  secrets: {},
  hintsUsed: { 'mira-1': 1_700_000_004_000 },
  notebook: {
    pins: [{ kind: 'document', id: 'lettre-notaire' }],
    highlights: [{ doc: 'lettre-notaire', path: [0, 2], start: 4, end: 12, color: 3 }],
    notes: [
      {
        id: 'n1',
        target: { kind: 'slot', id: 'g0-mira' },
        text: 'Née Ostel ?',
        at: 1_700_000_005_000,
      },
    ],
  },
  ending: null,
};

export const profile: Profile = {
  ...defaultProfile(),
  achievements: { 'verite-nue': 1_700_000_200_000 },
  completed: { 'maison-vellard': { bestTimedMs: 3_000_000, endings: ['verite'] } },
};

/** Vérifie au typage que le contenu compilé s'assemble à partir des types source. */
export const compiledCase: CompiledCase = {
  format: 1,
  id: 'maison-vellard',
  edition: 'demo',
  contentHash: '0a1b2c3d',
  salt: 'sel',
  meta: caseMeta,
  documents: {
    'lettre-notaire': {
      ...frontmatter,
      id: 'lettre-notaire',
      keywords: ['ostel'],
      body: [
        { t: 'h', level: 2, c: [{ t: 'text', v: 'Objet' }] },
        {
          t: 'p',
          c: [
            { t: 'text', v: 'Madame ' },
            { t: 'ref', keyword: 'ostel', c: [{ t: 'text', v: 'Ostel' }] },
            { t: 'redacted', length: 6 },
          ],
        },
        { t: 'quote', c: [{ t: 'p', c: [{ t: 'hand', c: [{ t: 'text', v: 'à vous' }] }] }] },
        { t: 'list', ordered: false, items: [[{ t: 'text', v: 'un' }]] },
        { t: 'table', head: [[{ t: 'text', v: 'Nom' }]], rows: [[[{ t: 'text', v: 'Aldo' }]]] },
        {
          t: 'figure',
          asset: 'illustrations/sceau.svg',
          alt: 'Sceau',
          caption: [{ t: 'em', c: [{ t: 'text', v: 'cire' }] }],
        },
        { t: 'stamp', text: 'ARCHIVÉ' },
        { t: 'hr' },
        { t: 'signature', c: [{ t: 'text', v: 'Quindal' }] },
      ],
    },
  },
  searchIndex: { ostel: 'ostel', 'famille ostel': 'ostel' },
  keywords: {
    ostel: {
      id: 'ostel',
      label: 'Ostel',
      kind: 'person',
      results: [{ documents: ['acte-naissance'] }],
    },
  },
  slots: {
    'g0-mira': {
      id: 'g0-mira',
      generation: 0,
      column: 1,
      answer: { given: ['h1'], family: ['h2', 'h3'], portrait: ['h4'], occupation: 'h5' },
      parents: [],
      unions: ['g0-aldo'],
    },
    'g0-aldo': {
      id: 'g0-aldo',
      generation: 0,
      column: 0,
      prefilled: true,
      prefilledGuess: {
        given: 'Aldo',
        family: 'Vellard',
        portrait: 'aldo',
        occupation: 'horloger',
      },
      answer: { given: ['h6'], family: ['h7'], portrait: ['h8'], occupation: 'h9' },
      parents: [],
      unions: ['g0-mira'],
    },
  },
  groups: tree.groups,
  portraits: { aldo: { id: 'aldo', file: 'portraits/aldo.svg', alt: 'Homme', svg: '<svg/>' } },
  occupations: { horloger: { id: 'horloger', label: 'Horloger' } },
  places: { 'port-asmer': { ...place, documents: [{ id: 'photo-atelier' }] } },
  progression: {
    start: progression.start,
    unlocks: progression.unlocks,
    secrets: progression.secrets,
  },
  endings: {
    silence: {
      when: { lockedCount: { gte: 0 } },
      priority: 1,
      title: 'Le silence',
      sections: [{ label: null, title: null, body: [] }],
    },
  },
  hints,
  achievements,
  report: [],
  candidates: { given: ['Aldo', 'Mira'], family: ['Vellard', 'Ostel'] },
};

/** Copie profonde modifiable d'une fixture. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}
