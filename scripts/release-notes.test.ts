import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { notesFor } from '../apps/game/src/platform/update';
import { releaseNotes } from './release-notes.mjs';

const changelog = [
  {
    version: '1.4.0',
    date: '2026-10-20',
    title: { fr: 'Mises à jour', en: 'Updates' },
    items: [
      { kind: 'new', text: { fr: 'Le jeu se met à jour <seul>.', en: 'The game updates itself.' } },
      { kind: 'fixed', text: { fr: 'Une correction.', en: 'A fix.' } },
    ],
  },
];

describe('releaseNotes', () => {
  it('deux sections balisées, lues par le jeu dans sa langue', () => {
    const body = releaseNotes(changelog, 'v1.4.0');
    expect(body).toBe(
      '<!-- fr -->\nMises à jour\n- Nouveauté : Le jeu se met à jour seul.\n- Correction : Une correction.\n\n' +
        '<!-- en -->\nUpdates\n- New: The game updates itself.\n- Fixed: A fix.\n',
    );
    expect(notesFor(body, 'fr')).toBe(
      'Mises à jour\n- Nouveauté : Le jeu se met à jour seul.\n- Correction : Une correction.',
    );
    expect(notesFor(body, 'en')).toBe('Updates\n- New: The game updates itself.\n- Fixed: A fix.');
  });

  it('version absente ou journal illisible : erreur', () => {
    expect(() => releaseNotes(changelog, '9.9.9')).toThrow(/absente/);
    expect(() => releaseNotes({}, '1.4.0')).toThrow(/illisible/);
  });

  it('la version courante du jeu a ses notes', () => {
    const version = (
      JSON.parse(readFileSync('apps/game/package.json', 'utf8')) as { version: string }
    ).version;
    const log: unknown = JSON.parse(readFileSync('content/changelog.json', 'utf8'));
    expect(releaseNotes(log, version)).toContain('<!-- en -->');
  });
});
