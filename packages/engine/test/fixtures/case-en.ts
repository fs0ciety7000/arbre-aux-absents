/**
 * `fixtureCase` **compilée en anglais** (D4) : mêmes ids, même structure, même sel, mêmes
 * empreintes de réponses et même `contentHash` ; seuls `locale` et les champs traduisibles
 * changent (titres, libellés, termes de recherche, textes des documents). Les noms propres
 * (personnes, lieux, `candidates`) ne sont jamais traduits (D3). Sert à vérifier qu'une
 * sauvegarde se charge et se valide à l'identique d'une langue à l'autre.
 */
import type { Block, CompiledCase } from '@arbre/contract';
import { fixtureCase } from './case';

/** Libellés traduits (titres, métiers, groupes, mots-clés, rapport, succès…). */
const LABELS: Record<string, string> = {
  'Les Marrel de Port-Lanne': 'The Marrels of Port-Lanne',
  'Lettre de Maître Brévo': 'Letter from Maître Brévo',
  'Photographie de noces': 'Wedding photograph',
  'Registre des naissances, famille Marrel': 'Register of births, Marrel family',
  'Annuaire de Port-Lanne': 'Port-Lanne directory',
  'Deux enfants devant une école': 'Two children outside a school',
  'Lettre de Lisbeth': 'Letter from Lisbeth',
  'Carte postale de Tam': 'Postcard from Tam',
  'Registre des naissances, famille Dacque': 'Register of births, Dacque family',
  'Rapport sur le moulin': 'Report on the mill',
  'Un marin sur le quai': 'A sailor on the quay',
  Télégramme: 'Telegram',
  'Note sur Juno': 'Note on Juno',
  'La crue': 'The flood',
  'Acte de reconnaissance': 'Deed of acknowledgement',
  Épilogue: 'Epilogue',
  'École de Port-Lanne': 'Port-Lanne School',
  'Les aînés': 'The elders',
  'Les cadets': 'The younger ones',
  Horloger: 'Clockmaker',
  Tisserande: 'Weaver',
  Marin: 'Sailor',
  Institutrice: 'Schoolteacher',
  Meunier: 'Miller',
  'La fille de Tam': "Tam's daughter",
  "L'arbre établi": 'The tree established',
  'La vérité': 'The truth',
  'Le dossier remis': 'The file handed over',
  'Le dossier gardé': 'The file kept',
  'Qui a envoyé le télégramme ?': 'Who sent the telegram?',
  'À qui remettre le dossier ?': 'Who should receive the file?',
  'Le garder': 'Keep it',
  'Le remettre à Juno': 'Give it to Juno',
  'Première branche': 'First branch',
  'Toute la vérité': 'The whole truth',
  Éclair: 'Lightning',
  'Rien ne m’échappe': 'Nothing escapes me',
  'Les yeux fermés': 'Eyes closed',
  Curieux: 'Curious',
};

const tr = (v: string): string => LABELS[v] ?? `[en] ${v}`;

/** Traduit les nœuds de texte d'un bloc (structure, mots-clés liés et assets inchangés). */
function translateTree<T>(node: T): T {
  if (Array.isArray(node)) return node.map((n: unknown) => translateTree(n)) as T;
  if (node === null || typeof node !== 'object') return node;
  const rec = node as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rec)) {
    if ((k === 'v' && rec['t'] === 'text') || k === 'alt' || k === 'text') {
      out[k] = typeof v === 'string' ? tr(v) : v;
    } else out[k] = translateTree(v);
  }
  return out as T;
}

const fr: CompiledCase = JSON.parse(JSON.stringify(fixtureCase)) as CompiledCase;

export const fixtureCaseEn: CompiledCase = {
  ...fr,
  locale: 'en',
  meta: { ...fr.meta, title: tr(fr.meta.title) },
  documents: Object.fromEntries(
    Object.entries(fr.documents).map(([id, d]) => [
      id,
      {
        ...d,
        title: tr(d.title),
        ...(d.archive !== undefined ? { archive: `[en] ${d.archive}` } : {}),
        body: translateTree<Block[]>(d.body),
      },
    ]),
  ),
  // Termes anglais (normalisés) : les noms propres restent, « école » devient « school ».
  searchIndex: {
    marrel: 'kw-marrel',
    sorvo: 'kw-sorvo',
    'port lanne': 'kw-port-lanne',
    'port lanne school': 'kw-ecole',
    school: 'kw-ecole',
    dacque: 'kw-dacque',
    vessaut: 'kw-vessaut',
    cael: 'kw-cael',
    'cael dacque': 'kw-cael',
    'juno marrel': 'kw-juno',
  },
  keywords: Object.fromEntries(
    Object.entries(fr.keywords).map(([id, k]) => [id, { ...k, label: tr(k.label) }]),
  ),
  groups: fr.groups.map((g) => ({ ...g, label: tr(g.label) })),
  portraits: Object.fromEntries(
    Object.entries(fr.portraits).map(([id, x]) => [id, { ...x, alt: tr(x.alt) }]),
  ),
  occupations: Object.fromEntries(
    Object.entries(fr.occupations).map(([id, o]) => [id, { ...o, label: tr(o.label) }]),
  ),
  progression: {
    ...fr.progression,
    secrets: fr.progression.secrets.map((x) => ({ ...x, title: tr(x.title) })),
  },
  endings: Object.fromEntries(
    Object.entries(fr.endings).map(([id, e]) => [
      id,
      {
        ...e,
        title: tr(e.title),
        sections: e.sections.map((x) => ({
          ...x,
          title: x.title === null ? null : tr(x.title),
          body: translateTree<Block[]>(x.body),
        })),
      },
    ]),
  ),
  report: (fr.report ?? []).map((q) => ({
    ...q,
    prompt: tr(q.prompt),
    options: q.options.map((o) => ({ ...o, label: tr(o.label) })),
  })),
  hints: fr.hints.map((h) => ({ ...h, text: tr(h.text) })),
  achievements: fr.achievements.map((a) => ({
    ...a,
    title: tr(a.title),
    description: tr(a.description),
  })),
};
