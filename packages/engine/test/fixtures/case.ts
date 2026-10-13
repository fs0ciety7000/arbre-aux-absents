/**
 * Petite affaire **compilée à la main**, conforme à `CompiledCase` : 8 cases sur
 * 3 générations (dont une pré-remplie et une cachée), 2 groupes, 15 documents,
 * 8 mots-clés (dont un terme caché), 2 lieux, 1 secret, 2 fins, indices et succès.
 * Les réponses sont hachées par `hashAnswer` (valeurs figées : tout changement de la
 * fonction de hachage casse `test/normalize.test.ts`, et donc la compatibilité avec
 * `content-tools`). Monde imaginaire, aucun nom réel.
 */
import type {
  Block,
  CompiledCase,
  CompiledDocument,
  CompiledPortrait,
  Inline,
  SlotGuess,
} from '@arbre/contract';

const txt = (v: string): Inline => ({ t: 'text', v });
const ref = (keyword: string, v: string): Inline => ({ t: 'ref', keyword, c: [txt(v)] });
const p = (...c: (Inline | string)[]): Block => ({
  t: 'p',
  c: c.map((x) => (typeof x === 'string' ? txt(x) : x)),
});

function doc(id: string, d: Omit<CompiledDocument, 'id'>): CompiledDocument {
  return { id, ...d };
}

function portrait(id: string, alt: string): CompiledPortrait {
  return { id, file: `portraits/${id}.svg`, alt, svg: '<svg viewBox="0 0 10 10"></svg>' };
}

export const SALT = 'sel-fixture';

/** Solution en clair (tests uniquement : n'existe jamais dans un contenu compilé). */
export const SOLUTION: Record<string, SlotGuess> = {
  'g0-ivo': { given: 'Ivo', family: 'Marrel', portrait: 'p-ivo', occupation: 'horloger' },
  'g0-elna': { given: 'Elna', family: 'Sorvo', portrait: 'p-elna', occupation: 'tisserande' },
  'g1-tam': { given: 'Tam', family: 'Marrel', portrait: 'p-tam', occupation: 'marin' },
  'g1-lisbe': { given: 'Lisbé', family: 'Marrel', portrait: 'p-lisbe', occupation: 'institutrice' },
  'g1-oren': { given: 'Oren', family: 'Dacque', portrait: 'p-oren', occupation: 'meunier' },
  'g2-cael': { given: 'Caël', family: 'Dacque', portrait: 'p-cael', occupation: 'marin' },
  'g2-mira': { given: 'Mira', family: 'Dacque', portrait: 'p-mira', occupation: 'tisserande' },
  'g2-juno': { given: 'Juno', family: 'Marrel', portrait: 'p-juno', occupation: 'horloger' },
};

const documents: Record<string, CompiledDocument> = {
  'lettre-notaire': doc('lettre-notaire', {
    kind: 'letter',
    title: 'Lettre de Maître Brévo',
    date: '1931-02-11',
    author: 'Anselme Brévo',
    place: 'port-lanne',
    archive: 'Fonds Brévo, cote B-3',
    reveals: { portraits: ['p-ivo'], occupations: ['horloger'] },
    keywords: ['kw-marrel', 'kw-port-lanne', 'kw-sorvo'],
    body: [
      p(
        "Madame, j'ai le regret de vous annoncer le décès d'Ivo ",
        ref('kw-marrel', 'Marrel'),
        ', horloger à ',
        ref('kw-port-lanne', 'Port-Lanne'),
        '.',
      ),
      p('Il laisse une veuve, Elna ', ref('kw-sorvo', 'Sorvo'), ', et des enfants.'),
      { t: 'signature', c: [txt('Anselme Brévo, notaire')] },
    ],
  }),
  'photo-noces': doc('photo-noces', {
    kind: 'photo',
    title: 'Photographie de noces',
    date: '1899',
    reveals: { portraits: ['p-elna'] },
    keywords: ['kw-port-lanne'],
    body: [
      { t: 'figure', asset: 'illustrations/noces.svg', alt: 'Un couple pose devant une horloge.' },
      p("Au dos : « Noces d'Ivo et d'Elna, ", ref('kw-port-lanne', 'Port-Lanne'), '. »'),
    ],
  }),
  'registre-marrel': doc('registre-marrel', {
    kind: 'register',
    title: 'Registre des naissances, famille Marrel',
    keywords: ['kw-sorvo'],
    body: [
      {
        t: 'table',
        head: [[txt('Nom')], [txt('Prénom')], [txt('Naissance')]],
        rows: [
          [[txt('Marrel')], [txt('Tamas (dit Tam)')], [txt('1901')]],
          [[txt('Marrel')], [txt('Lisbé')], [txt('1904')]],
        ],
      },
      p('Parents : Ivo Marrel et Elna ', ref('kw-sorvo', 'Sorvo'), '.'),
      { t: 'stamp', text: 'Copie conforme' },
    ],
  }),
  'annuaire-lanne': doc('annuaire-lanne', {
    kind: 'directory',
    title: 'Annuaire de Port-Lanne',
    place: 'port-lanne',
    reveals: { occupations: ['marin', 'tisserande', 'meunier'] },
    keywords: ['kw-dacque', 'kw-vessaut'],
    body: [
      { t: 'h', level: 2, c: [txt('Habitants')] },
      {
        t: 'list',
        ordered: false,
        items: [
          [txt('Marrel, Tam : marin')],
          [txt('Sorvo, Elna : tisserande')],
          [
            ref('kw-dacque', 'Dacque'),
            txt(', Oren : meunier au moulin de '),
            ref('kw-vessaut', 'Vessaut'),
          ],
          [txt('Quist, Berthe : tisserande')],
        ],
      },
      { t: 'hr' },
    ],
  }),
  'photo-fratrie': doc('photo-fratrie', {
    kind: 'photo',
    title: 'Deux enfants devant une école',
    reveals: { portraits: ['p-tam', 'p-lisbe', 'p-figurant'] },
    keywords: ['kw-ecole'],
    body: [p("Tam et Lisbé devant l'", ref('kw-ecole', 'école de Port-Lanne'), '.')],
  }),
  'lettre-lisbe': doc('lettre-lisbe', {
    kind: 'letter',
    title: 'Lettre de Lisbeth',
    author: 'Lisbeth Marrel',
    reveals: { occupations: ['institutrice'], portraits: ['p-oren'] },
    keywords: ['kw-dacque'],
    body: [
      p(
        "Chère maman, l'école m'a nommée institutrice. Oren ",
        ref('kw-dacque', 'Dacque'),
        ' m’a demandée en mariage ; je joins son portrait.',
      ),
      {
        t: 'quote',
        c: [p({ t: 'hand', c: [txt('Tendrement')] }, ' ', { t: 'redacted', length: 6 })],
      },
    ],
  }),
  'carte-tam': doc('carte-tam', {
    kind: 'postcard',
    title: 'Carte postale de Tam',
    keywords: ['kw-cael'],
    body: [p('Embrasse pour moi ', ref('kw-cael', 'Caël'), ', mon neveu, et la petite Juno.')],
  }),
  'registre-dacque': doc('registre-dacque', {
    kind: 'register',
    title: 'Registre des naissances, famille Dacque',
    keywords: ['kw-vessaut'],
    body: [
      {
        t: 'table',
        head: [[txt('Nom')], [txt('Prénom')]],
        rows: [
          [[txt('Dacque')], [txt('Caël')]],
          [[txt('Dacque')], [txt('Mira')]],
        ],
      },
      p(
        'Parents : Oren Dacque, meunier, et Lisbé Marrel. Fait à ',
        ref('kw-vessaut', 'Vessaut'),
        '.',
      ),
    ],
  }),
  'moulin-vessaut': doc('moulin-vessaut', {
    kind: 'report',
    title: 'Rapport sur le moulin',
    place: 'vessaut',
    reveals: { portraits: ['p-mira'], occupations: ['tisserande'] },
    keywords: [],
    body: [p('Au moulin vivent Oren Dacque et sa fille Mira, tisserande.')],
  }),
  'photo-quai': doc('photo-quai', {
    kind: 'photo',
    title: 'Un marin sur le quai',
    reveals: { portraits: ['p-cael'] },
    keywords: [],
    body: [
      {
        t: 'figure',
        asset: 'illustrations/quai.svg',
        alt: 'Un jeune marin.',
        caption: [txt('Caël Dacque, marin.')],
      },
    ],
  }),
  'telegramme-juno': doc('telegramme-juno', {
    kind: 'telegram',
    title: 'Télégramme',
    reveals: { portraits: ['p-juno'] },
    keywords: [],
    body: [p('JUNO MARREL HORLOGÈRE ARRIVÉE STOP FILLE DE TAM STOP')],
  }),
  'note-juno': doc('note-juno', {
    kind: 'note',
    title: 'Note sur Juno',
    keywords: [],
    body: [p("Juno n'a jamais connu sa mère.")],
  }),
  'journal-crue': doc('journal-crue', {
    kind: 'newspaper',
    title: 'La crue',
    optional: true,
    keywords: ['kw-vessaut'],
    body: [p('La crue emporte le moulin de ', ref('kw-vessaut', 'Vessaut'), '.')],
  }),
  'acte-secret': doc('acte-secret', {
    kind: 'certificate',
    title: 'Acte de reconnaissance',
    keywords: [],
    body: [p('Tam Marrel reconnaît Juno pour sa fille.')],
  }),
  epilogue: doc('epilogue', {
    kind: 'note',
    title: 'Épilogue',
    keywords: [],
    body: [p("Tout l'arbre est établi.")],
  }),
};

const ANSWERS = {
  'g0-ivo': {
    given: ['101e0d4fc76c26'],
    family: ['1eb6b736be4a87'],
    portrait: '0d4436cf64ed07',
    occupation: '12e100a4a36ed8',
  },
  'g0-elna': {
    given: ['0d97737dc39218'],
    family: ['107cb922fb93bd', '15b081d48741ce'],
    portrait: '132d68d32acaaf',
    occupation: '1e70fceef88a76',
  },
  'g1-tam': {
    given: ['00e554573cb3ee', '0132ce259e5fae'],
    family: ['08c45a922017e0'],
    portrait: '1fa1e99c5c33a6',
    occupation: '1b9a38b505bfff',
  },
  'g1-lisbe': {
    given: ['17f465848aae71', '1e4643fb5f7432'],
    family: ['0f3af6108ac95f', '0775e3d42af2fa'],
    portrait: '1cf9abf6d611c1',
    occupation: '087238e227cf0a',
  },
  'g1-oren': {
    given: ['0f5ac5fe2bcbd6'],
    family: ['1ae0d95ac3946c'],
    portrait: '00f4aab43edd71',
    occupation: '08288ac7c8c50a',
  },
  'g2-cael': {
    given: ['15be675108be55'],
    family: ['0f73a504f9bbfe'],
    portrait: '0bfbb0a1f42d2a',
    occupation: '0bd700019494ca',
  },
  'g2-mira': {
    given: ['1bae08e6e1a18f'],
    family: ['03bc933d29e881'],
    portrait: '14542f10b7c5da',
    occupation: '1d90fa9dc6ee6a',
  },
  'g2-juno': {
    given: ['03e8bfaea410c6'],
    family: ['19476029d6df67'],
    portrait: '148c9d5a50b2e2',
    occupation: '1ff1610b1f04c7',
  },
};

/** Variantes acceptées (pour vérifier les empreintes figées). */
export const ANSWER_VARIANTS: Record<string, { given: string[]; family: string[] }> = {
  'g0-ivo': { given: ['Ivo'], family: ['Marrel'] },
  'g0-elna': { given: ['Elna'], family: ['Sorvo', 'Marrel'] },
  'g1-tam': { given: ['Tam', 'Tamas'], family: ['Marrel'] },
  'g1-lisbe': { given: ['Lisbé', 'Lisbeth'], family: ['Marrel', 'Dacque'] },
  'g1-oren': { given: ['Oren'], family: ['Dacque'] },
  'g2-cael': { given: ['Caël'], family: ['Dacque'] },
  'g2-mira': { given: ['Mira'], family: ['Dacque'] },
  'g2-juno': { given: ['Juno'], family: ['Marrel'] },
};

export const ANSWERS_BY_SLOT: Record<string, CompiledCase['slots'][string]['answer']> = ANSWERS;

export const fixtureCase: CompiledCase = {
  format: 1,
  id: 'affaire-test',
  edition: 'full',
  contentHash: 'a1b2c3d4',
  salt: SALT,
  meta: {
    id: 'affaire-test',
    title: 'Les Marrel de Port-Lanne',
    version: '1.0.0',
    intro: 'lettre-notaire',
    epilogue: 'epilogue',
    timedTargetsMs: [3_600_000],
  },
  documents,
  searchIndex: {
    marrel: 'kw-marrel',
    sorvo: 'kw-sorvo',
    'port lanne': 'kw-port-lanne',
    'ecole de port lanne': 'kw-ecole',
    ecole: 'kw-ecole',
    dacque: 'kw-dacque',
    vessaut: 'kw-vessaut',
    cael: 'kw-cael',
    'cael dacque': 'kw-cael',
    'juno marrel': 'kw-juno',
  },
  keywords: {
    'kw-marrel': {
      id: 'kw-marrel',
      label: 'Marrel',
      kind: 'person',
      results: [{ documents: ['registre-marrel'] }],
    },
    'kw-sorvo': {
      id: 'kw-sorvo',
      label: 'Sorvo',
      kind: 'person',
      results: [{ documents: ['photo-fratrie'] }],
    },
    'kw-port-lanne': {
      id: 'kw-port-lanne',
      label: 'Port-Lanne',
      kind: 'place',
      results: [{ documents: ['annuaire-lanne'] }],
    },
    'kw-ecole': {
      id: 'kw-ecole',
      label: 'École de Port-Lanne',
      kind: 'organization',
      results: [{ documents: ['lettre-lisbe'] }],
    },
    'kw-dacque': {
      id: 'kw-dacque',
      label: 'Dacque',
      kind: 'person',
      results: [{ documents: ['registre-dacque'] }],
    },
    'kw-vessaut': {
      id: 'kw-vessaut',
      label: 'Vessaut',
      kind: 'place',
      results: [{ documents: ['journal-crue'] }],
    },
    'kw-cael': {
      id: 'kw-cael',
      label: 'Caël',
      kind: 'person',
      results: [{ documents: ['photo-quai'], requires: { lockedCount: { gte: 4 } } }],
    },
    'kw-juno': {
      id: 'kw-juno',
      label: 'Juno Marrel',
      kind: 'person',
      hiddenTerm: true,
      results: [{ documents: ['telegramme-juno'] }],
    },
  },
  slots: {
    'g0-ivo': {
      id: 'g0-ivo',
      generation: 0,
      column: 0,
      prefilled: true,
      prefilledGuess: { ...(SOLUTION['g0-ivo'] as SlotGuess) },
      answer: ANSWERS['g0-ivo'],
      parents: [],
      unions: ['g0-elna'],
    },
    'g0-elna': {
      id: 'g0-elna',
      generation: 0,
      column: 1,
      answer: ANSWERS['g0-elna'],
      parents: [],
      unions: ['g0-ivo'],
    },
    'g1-tam': {
      id: 'g1-tam',
      generation: 1,
      column: 0,
      answer: ANSWERS['g1-tam'],
      parents: ['g0-ivo', 'g0-elna'],
      unions: [],
    },
    'g1-lisbe': {
      id: 'g1-lisbe',
      generation: 1,
      column: 1,
      answer: ANSWERS['g1-lisbe'],
      parents: ['g0-ivo', 'g0-elna'],
      unions: ['g1-oren'],
    },
    'g1-oren': {
      id: 'g1-oren',
      generation: 1,
      column: 2,
      answer: ANSWERS['g1-oren'],
      parents: [],
      unions: ['g1-lisbe'],
    },
    'g2-cael': {
      id: 'g2-cael',
      generation: 2,
      column: 1,
      answer: ANSWERS['g2-cael'],
      parents: ['g1-oren', 'g1-lisbe'],
      unions: [],
    },
    'g2-mira': {
      id: 'g2-mira',
      generation: 2,
      column: 2,
      answer: ANSWERS['g2-mira'],
      parents: ['g1-oren', 'g1-lisbe'],
      unions: [],
    },
    'g2-juno': {
      id: 'g2-juno',
      generation: 2,
      column: 0,
      revealedBy: { read: 'telegramme-juno' },
      answer: ANSWERS['g2-juno'],
      parents: ['g1-tam'],
      unions: [],
    },
  },
  groups: [
    { id: 'grp-aines', label: 'Les aînés', slots: ['g0-elna', 'g1-tam', 'g1-lisbe'], threshold: 3 },
    {
      id: 'grp-cadets',
      label: 'Les cadets',
      slots: ['g1-oren', 'g2-cael', 'g2-mira', 'g2-juno'],
      threshold: 3,
    },
  ],
  portraits: {
    'p-ivo': portrait('p-ivo', 'Homme moustachu, loupe d’horloger à l’œil'),
    'p-elna': portrait('p-elna', 'Femme au métier à tisser'),
    'p-tam': portrait('p-tam', 'Garçon en vareuse'),
    'p-lisbe': portrait('p-lisbe', 'Fillette aux nattes'),
    'p-oren': portrait('p-oren', 'Homme enfariné'),
    'p-cael': portrait('p-cael', 'Jeune marin'),
    'p-mira': portrait('p-mira', 'Jeune femme au fuseau'),
    'p-juno': portrait('p-juno', 'Jeune femme aux lunettes rondes'),
    'p-figurant': portrait('p-figurant', 'Écolier inconnu'),
  },
  occupations: {
    horloger: { id: 'horloger', label: 'Horloger' },
    tisserande: { id: 'tisserande', label: 'Tisserande' },
    marin: { id: 'marin', label: 'Marin' },
    institutrice: { id: 'institutrice', label: 'Institutrice' },
    meunier: { id: 'meunier', label: 'Meunier' },
  },
  places: {
    'port-lanne': {
      id: 'port-lanne',
      name: 'Port-Lanne',
      kind: 'city',
      position: { x: 0.3, y: 0.6 },
      documents: [{ id: 'annuaire-lanne' }],
    },
    vessaut: {
      id: 'vessaut',
      name: 'Vessaut',
      kind: 'village',
      position: { x: 0.7, y: 0.2 },
      revealedBy: { read: 'annuaire-lanne' },
      documents: [
        { id: 'moulin-vessaut' },
        { id: 'journal-crue', requires: { searched: 'kw-vessaut' } },
      ],
    },
  },
  progression: {
    start: ['lettre-notaire', 'photo-noces'],
    unlocks: {
      'carte-tam': { groupLocked: 'grp-aines' },
      'note-juno': { read: 'telegramme-juno' },
      'acte-secret': { all: [{ read: 'note-juno' }, { searched: 'kw-vessaut' }] },
      epilogue: { lockedCount: { gte: 8 } },
    },
    occupationsUnlock: { horloger: { read: 'telegramme-juno' } },
    secrets: [
      { id: 'sec-double-vie', title: 'La fille de Tam', discoveredBy: { read: 'acte-secret' } },
    ],
  },
  endings: {
    'fin-arbre': {
      when: { lockedCount: { gte: 8 } },
      priority: 1,
      title: "L'arbre établi",
      body: [p('Les Marrel sont tous à leur place.')],
    },
    'fin-verite': {
      when: { all: [{ lockedCount: { gte: 8 } }, { secret: 'sec-double-vie' }] },
      priority: 2,
      title: 'La vérité',
      body: [p('Et Juno retrouve son père.')],
    },
  },
  hints: [
    {
      id: 'h-tam-2',
      target: { slot: 'g1-tam' },
      level: 2,
      text: 'Voyez le registre des Marrel.',
      availableWhen: { searched: 'kw-marrel' },
    },
    {
      id: 'h-tam-1',
      target: { slot: 'g1-tam' },
      level: 1,
      text: 'Cette personne apparaît dans un registre.',
      availableWhen: { read: 'lettre-notaire' },
    },
    {
      id: 'h-tam-3',
      target: { slot: 'g1-tam' },
      level: 3,
      text: 'La ligne « Tamas (dit Tam) ».',
      availableWhen: { read: 'registre-marrel' },
    },
    {
      id: 'h-cadets-1',
      target: { group: 'grp-cadets' },
      level: 1,
      text: 'Cherchez du côté du moulin.',
      availableWhen: { visited: 'port-lanne' },
    },
  ],
  achievements: [
    {
      id: 'ach-premier-groupe',
      title: 'Première branche',
      description: 'Établir un groupe entier.',
      hidden: false,
      when: { groupLocked: 'grp-aines' },
    },
    {
      id: 'ach-verite',
      title: 'Toute la vérité',
      description: 'Atteindre la fin « La vérité ».',
      hidden: true,
      when: { endingReached: 'fin-verite' },
    },
    {
      id: 'ach-eclair',
      title: 'Éclair',
      description: 'Finir en moins d’une heure en mode chronométré.',
      hidden: false,
      when: { timedUnderMs: 3_600_000 },
    },
    {
      id: 'ach-tous-secrets',
      title: 'Rien ne m’échappe',
      description: 'Découvrir tous les secrets.',
      hidden: false,
      when: { allSecrets: true },
    },
    {
      id: 'ach-sans-secret',
      title: 'Les yeux fermés',
      description: 'Finir sans découvrir de secret.',
      hidden: true,
      when: { all: [{ endingReached: 'fin-arbre' }, { not: { allSecrets: true } }] },
    },
    {
      id: 'ach-curieux',
      title: 'Curieux',
      description: 'Ouvrir le télégramme ou visiter Vessaut.',
      hidden: false,
      when: { any: [{ read: 'telegramme-juno' }, { visited: 'vessaut' }] },
    },
  ],
  candidates: {
    given: [
      'Ivo',
      'Elna',
      'Tam',
      'Tamas',
      'Lisbé',
      'Lisbeth',
      'Oren',
      'Caël',
      'Mira',
      'Juno',
      'Anselme',
      'Berthe',
    ],
    family: ['Marrel', 'Sorvo', 'Dacque', 'Brévo', 'Quist'],
  },
};
