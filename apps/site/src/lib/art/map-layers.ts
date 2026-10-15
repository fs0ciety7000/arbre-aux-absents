/**
 * Couches de la carte pour la carte interactive (client) : chargées à la demande, une par fichier,
 * après l'hydratation de la page « Le monde ». Ce sont les SVG du cartographe (`art/map/`), déjà
 * contrôlés par `content:check` (règle 8) ; `MapView` les analyse en XML, sans injection HTML.
 * Une langue peut surcharger une couche (`art/map/locales/<loc>/labels.svg`, lot T2) : seule la
 * couche de sa langue est chargée.
 */
import type { Locale, MapLayer } from '@arbre/contract';

const loaders = import.meta.glob('../../../../../art/map/*.svg', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

const localeLoaders = import.meta.glob('../../../../../art/map/locales/*/*.svg', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

const layerName = (path: string) =>
  path.slice(path.lastIndexOf('/') + 1, -'.svg'.length) as MapLayer;

export async function loadMapLayers(lang: Locale = 'fr'): Promise<Partial<Record<MapLayer, string>>> {
  const chosen = new Map(Object.entries(loaders).map(([p, load]) => [layerName(p), load]));
  for (const [p, load] of Object.entries(localeLoaders)) {
    if (p.includes(`/locales/${lang}/`)) chosen.set(layerName(p), load);
  }
  const entries = await Promise.all(
    [...chosen].map(async ([name, load]) => [name, await load()] as const),
  );
  return Object.fromEntries(entries);
}
