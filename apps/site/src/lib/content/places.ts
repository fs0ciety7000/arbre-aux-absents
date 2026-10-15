/**
 * Lieux de la carte pour le site, dans une langue (prérendu seulement). Noms jamais traduits
 * (glossaire §3.1). Descriptions : texte propre au site (`placeNotes`, aucun indice sur l'affaire),
 * sinon la description du contenu, ou son calque (`content/world/locales/<loc>.json`) ; sans
 * calque, le français.
 */
import type { Locale, Place, WorldTranslation } from '@arbre/contract';
import { STRINGS } from '#lib/i18n/index';
import type { SitePlace } from './world';

const placeFiles = import.meta.glob('../../../../../content/world/places/*.json', {
  import: 'default',
  eager: true,
}) as Record<string, Place>;

const worldLocales = import.meta.glob('../../../../../content/world/locales/*.json', {
  import: 'default',
  eager: true,
}) as Record<string, Partial<WorldTranslation>>;

/** Calque du monde d'une langue (`null` pour le français ou s'il manque). */
export function worldTranslation(lang: Locale): Partial<WorldTranslation> | null {
  const entry = Object.entries(worldLocales).find(([p]) => p.endsWith(`/${lang}.json`));
  return entry?.[1] ?? null;
}

/** Lieux, de l'ouest à l'est puis du nord au sud (même ordre que le clavier de la carte). */
export function sitePlaces(lang: Locale): SitePlace[] {
  const t = STRINGS[lang];
  const layer = lang === 'fr' ? null : worldTranslation(lang);
  return Object.values(placeFiles)
    .map((p) => ({
      id: p.id,
      name: p.name,
      kind: p.kind,
      kindLabel: t.placeKinds[p.kind],
      position: p.position,
      description: t.placeNotes[p.id] ?? layer?.places?.[p.id]?.description ?? p.description ?? '',
      focusZoom: p.focusZoom,
      hitRadius: p.hitRadius,
    }))
    .sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
}

/** Titre de la carte dans une langue (calque, sinon celui du contenu). */
export function mapTitle(lang: Locale, fallback: string): string {
  return (lang === 'fr' ? null : worldTranslation(lang)?.map?.title) ?? fallback;
}
