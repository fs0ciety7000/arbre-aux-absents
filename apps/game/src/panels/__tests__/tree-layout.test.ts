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
});
