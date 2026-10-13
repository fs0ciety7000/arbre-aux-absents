/**
 * SVG des illustrations et des portraits, chargés à la demande (un module par SVG au build,
 * voir vite/lazy-content.ts) et mis en cache. Seul point d'accès des panneaux à ces SVG.
 * Les accesseurs sont réactifs : `undefined` pendant le chargement, puis la chaîne SVG,
 * ou `null` si l'asset est introuvable ou n'a pas pu être chargé.
 */
import type { CompiledCase, PortraitId } from '@arbre/contract';
import { SvelteMap } from 'svelte/reactivity';
import { loadContent, PORTRAIT_KEY } from '../../lib/game/cases';

type Entry = { svg: string } | { svg: null };

const cache = new SvelteMap<string, Entry>();
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- non réactif par conception
const started = new Set<string>();

async function fetchSvg(caseId: string, key: string): Promise<string | null> {
  const { assets } = await loadContent();
  const byCase = Object.hasOwn(assets, caseId) ? assets[caseId] : undefined;
  const src = byCase && Object.hasOwn(byCase, key) ? byCase[key] : undefined;
  if (src === undefined) return null;
  return typeof src === 'string' ? src : await src();
}

function load(id: string, caseId: string, key: string): void {
  if (started.has(id)) return;
  started.add(id);
  fetchSvg(caseId, key).then(
    (svg) => cache.set(id, { svg }),
    (err: unknown) => {
      console.warn('[assets]', key, err);
      cache.set(id, { svg: null });
    },
  );
}

function read(caseId: string, key: string): string | null | undefined {
  const id = `${caseId}\u0000${key}`;
  const hit = cache.get(id);
  if (hit) return hit.svg;
  // Rendu serveur (tests) : rien à charger.
  if (typeof window === 'undefined') return undefined;
  // Pas d'écriture d'état pendant un rendu : le chargement part au prochain micro-tâche.
  queueMicrotask(() => load(id, caseId, key));
  return undefined;
}

/** SVG d'une illustration (`illustrations/<nom>.svg`) d'une affaire. */
export function illustration(caseId: string, asset: string): string | null | undefined {
  return read(caseId, asset);
}

/** SVG d'un portrait (en ligne dans l'affaire sans le plugin, sinon chargé à la demande). */
export function portraitSvg(c: CompiledCase, id: PortraitId): string | null | undefined {
  const p = Object.hasOwn(c.portraits, id) ? c.portraits[id] : undefined;
  if (!p) return null;
  if (p.svg) return p.svg;
  return read(c.id, PORTRAIT_KEY + id);
}
