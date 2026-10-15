/**
 * SVG des illustrations et des portraits, chargés à la demande (un module par SVG au build,
 * voir vite/lazy-content.ts) et mis en cache. Seul point d'accès des panneaux à ces SVG.
 * Les accesseurs sont réactifs : `undefined` pendant le chargement, puis la chaîne SVG,
 * ou `null` si l'asset est introuvable ou n'a pas pu être chargé.
 */
import type { CompiledCase, Locale, PortraitId } from '@arbre/contract';
import { DEFAULT_LOCALE } from '@arbre/contract';
import { SvelteMap } from 'svelte/reactivity';
import { loadAsset, PORTRAIT_KEY } from '../../lib/game/cases';

/** Affaire affichée : son id et la langue de son texte (surcharges d'illustrations). */
type CaseRef = Pick<CompiledCase, 'id' | 'locale'>;

type Entry = { svg: string } | { svg: null };

const cache = new SvelteMap<string, Entry>();
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- non réactif par conception
const started = new Set<string>();

function load(id: string, locale: Locale, caseId: string, key: string): void {
  if (started.has(id)) return;
  started.add(id);
  loadAsset(locale, caseId, key).then(
    (svg) => cache.set(id, { svg }),
    (err: unknown) => {
      console.warn('[assets]', key, err);
      cache.set(id, { svg: null });
    },
  );
}

function read(c: CaseRef, key: string): string | null | undefined {
  const locale = c.locale ?? DEFAULT_LOCALE;
  const id = `${locale}\u0000${c.id}\u0000${key}`;
  const hit = cache.get(id);
  if (hit) return hit.svg;
  // Rendu serveur (tests) : rien à charger.
  if (typeof window === 'undefined') return undefined;
  // Pas d'écriture d'état pendant un rendu : le chargement part au prochain micro-tâche.
  queueMicrotask(() => load(id, locale, c.id, key));
  return undefined;
}

/** SVG d'une illustration (`illustrations/<nom>.svg`) d'une affaire, dans la langue de son texte. */
export function illustration(c: CaseRef, asset: string): string | null | undefined {
  return read(c, asset);
}

/** SVG d'un portrait (en ligne dans l'affaire sans le plugin, sinon chargé à la demande). */
export function portraitSvg(c: CompiledCase, id: PortraitId): string | null | undefined {
  const p = Object.hasOwn(c.portraits, id) ? c.portraits[id] : undefined;
  if (!p) return null;
  if (p.svg) return p.svg;
  return read(c, PORTRAIT_KEY + id);
}
