import { describe, expect, it } from 'vitest';
import { DEFAULT_DIMS, layoutTree, neighbourSlot, type TreeNodeInput } from '../lib/tree-layout';

const nodes: TreeNodeInput[] = [
  { id: 'ivo', generation: 0, column: 0, parents: [], unions: ['elna'] },
  { id: 'elna', generation: 0, column: 1, parents: [], unions: ['ivo'] },
  { id: 'tam', generation: 1, column: 0, parents: ['ivo', 'elna'], unions: [] },
  { id: 'lisbe', generation: 1, column: 1, parents: ['ivo', 'elna'], unions: ['oren'] },
  { id: 'oren', generation: 1, column: 2, parents: [], unions: ['lisbe'] },
  { id: 'juno', generation: 2, column: 0, parents: ['tam'], unions: [] },
];

describe('tree-layout', () => {
  it('place les cases par génération et colonne', () => {
    const l = layoutTree(nodes);
    const { slotW, slotH, gapX, gapY, pad } = DEFAULT_DIMS;
    expect(l.slots.elna).toMatchObject({ x: pad + slotW + gapX, y: pad });
    expect(l.slots.juno).toMatchObject({ x: pad, y: pad + 2 * (slotH + gapY) });
    expect(l.generations).toEqual([0, 1, 2]);
    expect(l.width).toBe(pad * 2 + 3 * slotW + 2 * gapX);
  });

  it('dessine une union par couple et une descente par enfant', () => {
    const l = layoutTree(nodes);
    expect(l.links.filter((k) => k.kind === 'union')).toHaveLength(2);
    const desc = l.links.filter((k) => k.kind === 'descent');
    expect(desc.map((k) => k.to).sort()).toEqual(['juno', 'lisbe', 'tam']);
    expect(desc.find((k) => k.to === 'juno')!.from).toEqual(['tam']);
  });

  it('navigue au clavier selon les liens', () => {
    expect(neighbourSlot(nodes, 'tam', 'right')).toBe('lisbe');
    expect(neighbourSlot(nodes, 'tam', 'left')).toBeNull();
    expect(neighbourSlot(nodes, 'tam', 'up')).toBe('ivo');
    expect(neighbourSlot(nodes, 'tam', 'down')).toBe('juno');
    expect(neighbourSlot(nodes, 'oren', 'up')).toBe('elna');
    expect(neighbourSlot(nodes, 'juno', 'down')).toBeNull();
    expect(neighbourSlot(nodes, 'nope', 'down')).toBeNull();
  });

  it('case sans parents (affaire 3, Noël) : placée à sa colonne, aucun trait orphelin', () => {
    // Forme de l'affaire 3 (AFFAIRE-3 §4) : Siméon et Ursule (génération I) sans enfant visible ;
    // Noël (génération II, parents [null, null]) dans leur colonne, uni à Honorine.
    const shape: TreeNodeInput[] = [
      { id: 'gervais', generation: 0, column: 0, parents: [], unions: ['jeanne'] },
      { id: 'jeanne', generation: 0, column: 1, parents: [], unions: ['gervais'] },
      { id: 'simeon', generation: 0, column: 3, parents: [], unions: ['ursule'] },
      { id: 'ursule', generation: 0, column: 4, parents: [], unions: ['simeon'] },
      {
        id: 'honorine',
        generation: 1,
        column: 1,
        parents: ['gervais', 'jeanne'],
        unions: ['noel'],
      },
      { id: 'noel', generation: 1, column: 3, parents: [], unions: ['honorine'] },
    ];
    const l = layoutTree(shape);
    const { slotW, slotH, gapX, gapY, pad } = DEFAULT_DIMS;
    // Même colonne que Siméon, une génération plus bas : ni décalée, ni tassée.
    expect(l.slots.noel).toMatchObject({ x: l.slots.simeon!.x, y: pad + slotH + gapY });
    expect(l.slots.noel!.x).toBe(pad + 3 * (slotW + gapX));
    // Aucune descente vers Noël, aucune depuis Siméon ou Ursule : seulement celle d'Honorine.
    const desc = l.links.filter((k) => k.kind === 'descent');
    expect(desc.map((k) => k.to)).toEqual(['honorine']);
    expect(desc.flatMap((k) => k.from)).not.toContain('simeon');
    // Son union avec Honorine reste tracée.
    expect(l.links.filter((k) => k.kind === 'union').map((k) => k.to)).toContain('noel');
    // Clavier : depuis Noël, « haut » mène à la case la plus proche de la génération I.
    expect(neighbourSlot(shape, 'noel', 'up')).toBe('simeon');
  });
});
