/**
 * Carte du monde compilée (`src/generated/world.ts`, écrit par `content:build`). Importée
 * seulement par le panneau Carte, chargé à la demande : la carte est un fichier JS à part.
 */
import type { MapLayer, Place, WorldMap } from '@arbre/contract';
import { world } from '../../generated/world';

export const worldMap: WorldMap | null = world.map;
export const worldLayers: Partial<Record<MapLayer, string>> = world.layers;
export const worldPlaces: Record<string, Place> = world.places;
