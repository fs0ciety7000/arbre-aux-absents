/**
 * Couches de la carte pour la carte interactive (client) : chargées à la demande, une par fichier,
 * après l'hydratation de la page « Le monde ». Ce sont les SVG du cartographe (`art/map/`), déjà
 * contrôlés par `content:check` (règle 8) ; `MapView` les analyse en XML, sans injection HTML.
 */
import type { MapLayer } from '@arbre/contract';

const loaders = import.meta.glob('../../../../../art/map/*.svg', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

export async function loadMapLayers(): Promise<Partial<Record<MapLayer, string>>> {
  const entries = await Promise.all(
    Object.entries(loaders).map(async ([path, load]) => {
      const name = path.slice(path.lastIndexOf('/') + 1, -'.svg'.length) as MapLayer;
      return [name, await load()] as const;
    }),
  );
  return Object.fromEntries(entries);
}
