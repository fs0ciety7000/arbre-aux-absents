import { PORTRAIT_PLATES } from '#lib/content/portraits';
import { portraitImage, worldMap } from '#lib/prerender/art';
import { flourishImage, keyArtFullImages, spotImage, type SpotName } from '#lib/prerender/keyart';
import type { PageServerLoad } from './$types';

/** Vignettes d'aquarelle de l'artbook, avec leur légende (aucun indice sur l'affaire). */
const SPOTS: { name: SpotName; title: string }[] = [
  { name: 'tree', title: 'L’arbre aux médaillons' },
  { name: 'archives', title: 'Le carton d’archives' },
  { name: 'lighthouse', title: 'Le phare de Tennok' },
  { name: 'catalogue', title: 'Le meuble à fiches' },
  { name: 'letter', title: 'La lettre à la fougère' },
  { name: 'stamp', title: 'Le tampon de bois' },
  { name: 'magnifier', title: 'La loupe' },
  { name: 'register', title: 'Le registre cadenassé' },
  { name: 'map-pin', title: 'La carte épinglée' },
  { name: 'fern', title: 'La fougère d’herbier' },
];

// Prérendu seulement (csr = false) : l'art est lu au build et n'entre jamais dans le JS client.
export const load: PageServerLoad = () => ({
  keyart: keyArtFullImages(),
  spots: SPOTS.map((s) => ({ ...s, image: spotImage(s.name) })),
  seal: flourishImage('seal'),
  map: worldMap(),
  // L'id de personne reste au prérendu : la page ne reçoit que la planche et l'URL du dessin.
  plates: PORTRAIT_PLATES.map(({ person, ...p }) => ({ ...p, image: portraitImage(person) })),
});
