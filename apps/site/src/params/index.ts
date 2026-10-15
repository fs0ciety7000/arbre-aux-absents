// Matchers de paramètres. SvelteKit 3 : un seul module `src/params` (`defineParams`), chargé tel
// quel par Node au build : aucun import relatif sans extension ici.
import { defineParams } from '@sveltejs/kit/params';

export const params = defineParams({
  /**
   * Préfixe de langue facultatif (`routes/[[lang=lang]]/…`, D8) : seul `en` est un préfixe. Le
   * français, langue source, reste à la racine (`/le-monde/`) ; `/fr/…` n'existe pas.
   */
  lang: (param: string): 'en' | undefined => (param === 'en' ? param : undefined),
});
