/**
 * Mise en page pure de l'arbre (P01) : positions des cases par génération et colonne, liens
 * d'union et de filiation, voisinage clavier (gauche/droite dans la génération, haut = parent,
 * bas = enfant). Les liens sont donnés dès le départ (la forme de l'arbre est connue).
 */
export interface TreeNodeInput {
  id: string;
  generation: number;
  column: number;
  parents: readonly string[];
  unions: readonly string[];
}

export interface TreeDims {
  slotW: number;
  slotH: number;
  gapX: number;
  gapY: number;
  pad: number;
}

export interface PlacedSlot {
  id: string;
  x: number;
  y: number;
  generation: number;
  column: number;
}

export interface TreeLink {
  kind: 'union' | 'descent';
  d: string;
  /** Cases reliées (pour l'accessibilité et les tests). */
  from: string[];
  to: string;
}

export interface TreeLayout {
  slots: Record<string, PlacedSlot>;
  links: TreeLink[];
  width: number;
  height: number;
  generations: number[];
}

export const DEFAULT_DIMS: TreeDims = { slotW: 144, slotH: 168, gapX: 40, gapY: 72, pad: 32 };

export function layoutTree(
  nodes: readonly TreeNodeInput[],
  dims: TreeDims = DEFAULT_DIMS,
): TreeLayout {
  const gens = [...new Set(nodes.map((n) => n.generation))].sort((a, b) => a - b);
  const minCol = Math.min(0, ...nodes.map((n) => n.column));
  const genRow = new Map(gens.map((g, i) => [g, i]));
  const slots: Record<string, PlacedSlot> = {};
  let maxCol = 0;
  for (const n of nodes) {
    const col = n.column - minCol;
    maxCol = Math.max(maxCol, col);
    slots[n.id] = {
      id: n.id,
      generation: n.generation,
      column: n.column,
      x: dims.pad + col * (dims.slotW + dims.gapX),
      y: dims.pad + (genRow.get(n.generation) ?? 0) * (dims.slotH + dims.gapY),
    };
  }
  const links: TreeLink[] = [];
  const seenUnion = new Set<string>();
  const midY = (s: PlacedSlot) => s.y + dims.slotH / 2;
  for (const n of nodes) {
    const a = slots[n.id]!;
    for (const u of n.unions) {
      const b = slots[u];
      if (!b) continue;
      const key = [n.id, u].sort().join('|');
      if (seenUnion.has(key)) continue;
      seenUnion.add(key);
      const [l, r] = a.x <= b.x ? [a, b] : [b, a];
      links.push({
        kind: 'union',
        d: `M${l.x + dims.slotW} ${midY(l)} H${r.x}`,
        from: [l.id],
        to: r.id,
      });
    }
  }
  for (const n of nodes) {
    const child = slots[n.id]!;
    const ps = n.parents.map((p) => slots[p]).filter((p): p is PlacedSlot => p !== undefined);
    if (ps.length === 0) continue;
    const top = child.y;
    const cx = child.x + dims.slotW / 2;
    let sx: number;
    let sy: number;
    if (ps.length >= 2) {
      const [l, r] = ps[0]!.x <= ps[1]!.x ? [ps[0]!, ps[1]!] : [ps[1]!, ps[0]!];
      sx = (l.x + dims.slotW + r.x) / 2;
      sy = midY(l);
    } else {
      sx = ps[0]!.x + dims.slotW / 2;
      sy = ps[0]!.y + dims.slotH;
    }
    const elbow = top - dims.gapY / 2;
    links.push({
      kind: 'descent',
      d: `M${sx} ${sy} V${elbow} H${cx} V${top}`,
      from: ps.map((p) => p.id),
      to: child.id,
    });
  }
  return {
    slots,
    links,
    width: dims.pad * 2 + (maxCol + 1) * dims.slotW + maxCol * dims.gapX,
    height: dims.pad * 2 + gens.length * dims.slotH + Math.max(0, gens.length - 1) * dims.gapY,
    generations: gens,
  };
}

export type TreeDirection = 'left' | 'right' | 'up' | 'down';

/** Case voisine pour la navigation au clavier, ou `null`. */
export function neighbourSlot(
  nodes: readonly TreeNodeInput[],
  from: string,
  dir: TreeDirection,
): string | null {
  const me = nodes.find((n) => n.id === from);
  if (!me) return null;
  if (dir === 'left' || dir === 'right') {
    const row = nodes
      .filter((n) => n.generation === me.generation)
      .sort((a, b) => a.column - b.column);
    const i = row.findIndex((n) => n.id === from);
    const next = row[dir === 'left' ? i - 1 : i + 1];
    return next?.id ?? null;
  }
  if (dir === 'up') {
    const parents = me.parents.filter((p) => nodes.some((n) => n.id === p));
    if (parents.length > 0) return parents[0]!;
    return nearestInGeneration(nodes, me, -1);
  }
  const children = nodes
    .filter((n) => n.parents.includes(from))
    .sort((a, b) => a.column - b.column);
  if (children.length > 0) return children[0]!.id;
  return nearestInGeneration(nodes, me, 1);
}

/** À défaut de lien, la case la plus proche en colonne dans la génération voisine. */
function nearestInGeneration(
  nodes: readonly TreeNodeInput[],
  me: TreeNodeInput,
  step: 1 | -1,
): string | null {
  const gens = [...new Set(nodes.map((n) => n.generation))].sort((a, b) => a - b);
  const g = gens[gens.indexOf(me.generation) + step];
  if (g === undefined) return null;
  const row = nodes.filter((n) => n.generation === g);
  row.sort(
    (a, b) =>
      Math.abs(a.column - me.column) - Math.abs(b.column - me.column) || a.column - b.column,
  );
  return row[0]?.id ?? null;
}
