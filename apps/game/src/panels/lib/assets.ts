/**
 * Données compilées hors `CompiledCase` : illustrations des documents et carte du monde
 * (`src/generated/`, écrit par `content:build`). Seul point d'accès des panneaux à ces fichiers.
 */
import type { MapLayer, Place, WorldMap } from '@arbre/contract';
import { illustrations } from '../../generated/cases';
import { world } from '../../generated/world';

/** SVG d'une illustration (`illustrations/<nom>.svg`) d'une affaire, ou `null`. */
export function illustration(caseId: string, asset: string): string | null {
  const byCase = Object.hasOwn(illustrations, caseId) ? illustrations[caseId] : undefined;
  if (!byCase) return null;
  return Object.hasOwn(byCase, asset) ? (byCase[asset] ?? null) : null;
}

export const worldMap: WorldMap | null = world.map;
export const worldLayers: Partial<Record<MapLayer, string>> = world.layers;
export const worldPlaces: Record<string, Place> = world.places;
