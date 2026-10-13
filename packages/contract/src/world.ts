import { z } from 'zod';
import type { NormPoint, PlaceId } from './ids';
import { IdSchema, NormPointSchema, TextSchema } from './ids';

export const PLACE_KINDS = [
  'region',
  'city',
  'village',
  'building',
  'landmark',
  'sea',
  'mountain',
  'river',
] as const;
export type PlaceKind = (typeof PLACE_KINDS)[number];

export const MAP_LAYERS = ['base', 'relief', 'water', 'places', 'labels'] as const;
export type MapLayer = (typeof MAP_LAYERS)[number];

/** `content/world/places/<placeId>.json` (cartographe). */
export interface Place {
  id: PlaceId;
  name: string;
  kind: PlaceKind;
  position: NormPoint;
  description?: string;
}

/** `content/world/map.json` (cartographe). */
export interface WorldMap {
  aspect: number;
  layers: MapLayer[];
  minZoom: number;
  maxZoom: number;
  title: string;
  attribution?: string;
}

export const PlaceSchema = z.strictObject({
  id: IdSchema,
  name: TextSchema,
  kind: z.enum(PLACE_KINDS),
  position: NormPointSchema,
  description: TextSchema.optional(),
});

export const WorldMapSchema = z
  .strictObject({
    aspect: z.number().positive(),
    layers: z
      .array(z.enum(MAP_LAYERS))
      .min(1)
      .refine((l) => new Set(l).size === l.length, { error: 'Couches en double' }),
    minZoom: z.number().positive(),
    maxZoom: z.number().positive(),
    title: TextSchema,
    attribution: TextSchema.optional(),
  })
  .refine((m) => m.minZoom <= m.maxZoom, {
    error: 'minZoom doit être ≤ maxZoom',
    path: ['maxZoom'],
  });
