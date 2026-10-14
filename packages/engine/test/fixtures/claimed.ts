/**
 * Variante de `fixtureCase` avec une **case revendiquée** (AFFAIRE-2 §1) : la case de Tam
 * arrive remplie par une déclaration fausse sur le visage (celui de Juno, jamais révélé
 * autrement que par le télégramme). Tam a aussi un visage d'un autre âge (`p-tam-vieux`,
 * révélé par la photo de la fratrie), accepté comme juste. Le groupe des aînés compte ici
 * 4 cases (seuil 3) pour vérifier qu'une revendication fausse ne bloque pas le seuil.
 * `fixtureCase` reste intact (`playthrough.test.ts`).
 */
import type { CompiledCase, SlotGuess } from '@arbre/contract';
import { hashAnswer } from '../../src';
import { fixtureCase, SALT, SOLUTION } from './case';

const base: CompiledCase = JSON.parse(JSON.stringify(fixtureCase)) as CompiledCase;

/** Déclaration : nom, prénom et métier justes, visage faux. */
export const CLAIM: SlotGuess = {
  given: 'Tam',
  family: 'Marrel',
  portrait: 'p-juno',
  occupation: 'marin',
};

export const CLAIMED_SLOT = 'g1-tam';

/** Visage de Tam âgé : juste au même titre que `p-tam`. */
export const ALT_PORTRAIT = 'p-tam-vieux';

const tam = base.slots[CLAIMED_SLOT]!;
const photoFratrie = base.documents['photo-fratrie']!;

export const claimedCase: CompiledCase = {
  ...base,
  id: 'affaire-revendiquee',
  meta: { ...base.meta, id: 'affaire-revendiquee' },
  documents: {
    ...base.documents,
    'photo-fratrie': {
      ...photoFratrie,
      reveals: { portraits: [...(photoFratrie.reveals?.portraits ?? []), ALT_PORTRAIT] },
    },
  },
  slots: {
    ...base.slots,
    [CLAIMED_SLOT]: {
      ...tam,
      claimedGuess: { ...CLAIM },
      answer: {
        ...tam.answer,
        portrait: [
          hashAnswer(SALT, CLAIMED_SLOT, 'portrait', SOLUTION[CLAIMED_SLOT]!.portrait!),
          hashAnswer(SALT, CLAIMED_SLOT, 'portrait', ALT_PORTRAIT),
        ],
      },
    },
  },
  groups: [
    {
      id: 'grp-aines',
      label: 'Les aînés',
      slots: ['g0-elna', 'g1-tam', 'g1-lisbe', 'g1-oren'],
      threshold: 3,
    },
    {
      id: 'grp-cadets',
      label: 'Les cadets',
      slots: ['g2-cael', 'g2-mira', 'g2-juno'],
      threshold: 3,
    },
  ],
  portraits: {
    ...base.portraits,
    [ALT_PORTRAIT]: {
      id: ALT_PORTRAIT,
      file: `portraits/${ALT_PORTRAIT}.svg`,
      alt: 'Vieil homme en vareuse',
      svg: '<svg viewBox="0 0 10 10"></svg>',
    },
  },
};
