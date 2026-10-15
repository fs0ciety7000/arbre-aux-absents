#!/usr/bin/env node
// Notes d'une version publiée (D18), tirées de content/changelog.json : corps de la release GitHub
// et champ `notes` de latest.json (lu par l'updater desktop et, via l'API, par Android). Deux
// sections balisées `<!-- fr -->` / `<!-- en -->` (invisibles sur la page GitHub) : le jeu affiche
// celle de sa langue (`notesFor`, apps/game/src/platform/update.ts). Texte brut, aucune balise.
//
//   node scripts/release-notes.mjs <version> [content/changelog.json]
//
// Sans dépendance (lancé en CI avant `npm ci`). Sort en erreur si la version manque au journal.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const KIND_LABELS = {
  fr: { new: 'Nouveauté', improved: 'Amélioration', fixed: 'Correction' },
  en: { new: 'New', improved: 'Improved', fixed: 'Fixed' },
};

/**
 * @param {unknown} changelog contenu de content/changelog.json
 * @param {string} version version publiée (préfixe `v` toléré)
 * @returns {string}
 */
export function releaseNotes(changelog, version) {
  const wanted = String(version).replace(/^v/, '');
  if (!Array.isArray(changelog)) throw new Error('journal illisible (tableau attendu)');
  const entry = changelog.find((e) => e && e.version === wanted);
  if (!entry) throw new Error(`version ${wanted} absente de content/changelog.json`);
  const section = (/** @type {'fr' | 'en'} */ lang) => {
    const lines = [`<!-- ${lang} -->`, clean(entry.title?.[lang])];
    for (const item of entry.items ?? []) {
      const label = KIND_LABELS[lang][item.kind] ?? item.kind;
      lines.push(`- ${label}${lang === 'fr' ? ' : ' : ': '}${clean(item.text?.[lang])}`);
    }
    return lines.join('\n');
  };
  return `${section('fr')}\n\n${section('en')}\n`;
}

/** Texte sur une ligne, sans chevrons (aucun commentaire ni balise ne peut s'y glisser). */
function clean(/** @type {unknown} */ text) {
  return String(text ?? '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [version, file = 'content/changelog.json'] = process.argv.slice(2);
  if (!version) {
    console.error('usage : node scripts/release-notes.mjs <version> [changelog.json]');
    process.exit(2);
  }
  try {
    process.stdout.write(releaseNotes(JSON.parse(readFileSync(file, 'utf8')), version));
  } catch (err) {
    console.error(`release-notes : ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
