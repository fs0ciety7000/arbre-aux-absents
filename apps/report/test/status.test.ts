import { describe, expect, it } from 'vitest';
import type { IssueFacts } from '../src/status';
import { mapStatus, parseMarker, publicReplies, titleEn, upsertMarker } from '../src/status';

const open = (over: Partial<IssueFacts> = {}): IssueFacts => ({
  state: 'open',
  labels: [],
  assigned: false,
  ...over,
});

describe('mapStatus (table ARCHITECTURE §8)', () => {
  it.each<[string, IssueFacts, ReturnType<typeof mapStatus>]>([
    ['ouvert sans étiquette', open(), { status: 'received' }],
    ['statut:confirmé', open({ labels: ['statut:confirmé'] }), { status: 'confirmed' }],
    // Forme décomposée (NFD) et casse différente : même étiquette.
    ['statut:confirmé NFD', open({ labels: ['Statut:Confirmé'] }), { status: 'confirmed' }],
    ['statut:en-cours', open({ labels: ['statut:en-cours'] }), { status: 'in-progress' }],
    ['assigné', open({ assigned: true }), { status: 'in-progress' }],
    [
      'confirmé et en cours',
      open({ labels: ['statut:confirmé', 'statut:en-cours'] }),
      { status: 'in-progress' },
    ],
    [
      'fermé completed avec jalon',
      {
        state: 'closed',
        stateReason: 'completed',
        labels: [],
        assigned: false,
        milestone: 'v1.2.3',
      },
      { status: 'fixed', fixedIn: 'v1.2.3' },
    ],
    [
      'fermé completed, jalon non versionné',
      {
        state: 'closed',
        stateReason: 'completed',
        labels: [],
        assigned: false,
        milestone: 'Plus tard',
      },
      { status: 'closed', closedReason: 'resolved' },
    ],
    [
      'fermé not_planned',
      {
        state: 'closed',
        stateReason: 'not_planned',
        labels: [],
        assigned: false,
        milestone: 'v1.0.0',
      },
      { status: 'closed', closedReason: 'not-planned' },
    ],
    [
      'doublon (ouvert ou fermé)',
      open({ labels: ['doublon', 'statut:en-cours'] }),
      { status: 'closed', closedReason: 'duplicate' },
    ],
    [
      'fermé sans jalon',
      { state: 'closed', stateReason: 'completed', labels: [], assigned: false, milestone: null },
      { status: 'closed', closedReason: 'resolved' },
    ],
  ])('%s', (_name, facts, expected) => {
    expect(mapStatus(facts)).toEqual(expected);
  });
});

describe('marqueurs de mainteneurs', () => {
  const c = (body: string, authorAssociation = 'OWNER', id = 1) => ({
    id,
    body,
    authorAssociation,
    createdAt: 1000 + id,
  });

  it('accepte /public des seuls OWNER, MEMBER et COLLABORATOR', () => {
    for (const a of ['OWNER', 'MEMBER', 'COLLABORATOR']) {
      expect(parseMarker(c('/public\nCorrigé dans la prochaine version.', a))?.text).toBe(
        'Corrigé dans la prochaine version.',
      );
    }
    for (const a of ['CONTRIBUTOR', 'NONE', 'FIRST_TIME_CONTRIBUTOR', 'MANNEQUIN', '']) {
      expect(parseMarker(c('/public\nFaux message officiel', a))).toBeUndefined();
    }
  });

  it('ignore un commentaire sans marqueur en première ligne', () => {
    expect(parseMarker(c('Merci !\n/public\nnon'))).toBeUndefined();
    expect(parseMarker(c('/publicité'))).toBeUndefined();
    expect(parseMarker(c('/public'))).toBeUndefined(); // vide
  });

  it('rend du texte brut borné à 2000 caractères, sans caractères de contrôle', () => {
    const m = parseMarker(c(`/public\r\n<b>gras</b>‮\u0007 ${'x'.repeat(3000)}`))!;
    expect(m.text.startsWith('<b>gras</b> ')).toBe(true);
    expect(m.text.length).toBeLessThanOrEqual(2000);
    for (const ch of ['\u202E', '\u0007', '\r']) expect(m.text).not.toContain(ch);
  });

  it('titre anglais par /public-title-en', () => {
    const m = parseMarker(c('/public-title-en Map does not zoom on Android', 'MEMBER', 2));
    expect(m).toMatchObject({ kind: 'title-en', text: 'Map does not zoom on Android' });
    expect(parseMarker(c('/public-title-en Spoofed', 'NONE'))).toBeUndefined();
  });

  it('upsert, suppression et tri', () => {
    const a = parseMarker(c('/public\nA', 'OWNER', 2))!;
    const b = parseMarker(c('/public\nB', 'OWNER', 1))!;
    const t = parseMarker(c('/public-title-en T', 'OWNER', 3))!;
    let ms = upsertMarker([], 2, a);
    ms = upsertMarker(ms, 1, b);
    ms = upsertMarker(ms, 3, t);
    expect(publicReplies(ms).map((r) => r.text)).toEqual(['B', 'A']);
    expect(titleEn(ms)).toBe('T');
    ms = upsertMarker(ms, 2, undefined);
    expect(publicReplies(ms).map((r) => r.text)).toEqual(['B']);
  });
});
