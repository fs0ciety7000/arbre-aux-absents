import { describe, expect, it } from 'vitest';
import {
  ChangelogSchema,
  ProfileSchema,
  changelogEditionLeaks,
  changelogForEdition,
  changelogVersionIssues,
  compareVersions,
  defaultProfile,
  type ChangelogRelease,
} from '../src';

const release = (version: string, date: string): ChangelogRelease => ({
  version,
  date,
  title: { fr: `Version ${version}`, en: `Version ${version}` },
  items: [{ kind: 'fixed', text: { fr: 'Une correction.', en: 'A fix.' } }],
});

describe('journal des versions (Nouveautés)', () => {
  it('compare les versions semver', () => {
    expect(compareVersions('1.10.0', '1.9.3')).toBeGreaterThan(0);
    expect(compareVersions('1.2.0', '1.2.0')).toBe(0);
    expect(compareVersions('1.2.0-beta.1', '1.2.0')).toBeLessThan(0);
    expect(compareVersions('2.0.0', '10.0.0')).toBeLessThan(0);
  });

  it('accepte un journal trié, le plus récent d’abord', () => {
    const ok = [
      release('1.3.0', '2026-10-15'),
      release('1.2.1', '2026-10-15'),
      release('1.0.0', '2026-10-01'),
    ];
    expect(ChangelogSchema.safeParse(ok).success).toBe(true);
  });

  it('refuse le désordre, les doublons et les dates qui reculent', () => {
    expect(
      ChangelogSchema.safeParse([release('1.0.0', '2026-10-01'), release('1.1.0', '2026-10-02')])
        .success,
    ).toBe(false);
    expect(
      ChangelogSchema.safeParse([release('1.1.0', '2026-10-02'), release('1.1.0', '2026-10-02')])
        .success,
    ).toBe(false);
    expect(
      ChangelogSchema.safeParse([release('1.1.0', '2026-10-01'), release('1.0.0', '2026-10-02')])
        .success,
    ).toBe(false);
  });

  it('refuse un journal vide, une version non semver, une date incomplète, un point sans texte anglais', () => {
    expect(ChangelogSchema.safeParse([]).success).toBe(false);
    expect(ChangelogSchema.safeParse([release('1.3', '2026-10-15')]).success).toBe(false);
    expect(ChangelogSchema.safeParse([release('1.3.0', '2026-10')]).success).toBe(false);
    const bad = {
      ...release('1.3.0', '2026-10-15'),
      items: [{ kind: 'new', text: { fr: 'Nouveau.' } }],
    };
    expect(ChangelogSchema.safeParse([bad]).success).toBe(false);
    const kind = {
      ...release('1.3.0', '2026-10-15'),
      items: [{ kind: 'chore', text: { fr: 'x', en: 'x' } }],
    };
    expect(ChangelogSchema.safeParse([kind]).success).toBe(false);
  });

  it('exige que la dernière entrée porte la version du jeu', () => {
    const log = [release('1.3.1', '2026-10-15'), release('1.3.0', '2026-10-15')];
    expect(changelogVersionIssues(log, '1.3.1')).toEqual([]);
    expect(changelogVersionIssues(log, '1.4.0')).toHaveLength(1);
  });

  it('notes par édition : la démo perd les points de l’édition complète et prend demoTitle', () => {
    const full: ChangelogRelease = {
      ...release('1.1.0', '2026-10-10'),
      title: { fr: 'Le Revenant', en: 'The Revenant' },
      demoTitle: { fr: 'Tampons', en: 'Stamps' },
      items: [
        { kind: 'new', text: { fr: 'Le Revenant.', en: 'The Revenant.' }, edition: 'full' },
        { kind: 'new', text: { fr: 'Tampons.', en: 'Stamps.' } },
      ],
    };
    const onlyFull: ChangelogRelease = {
      ...release('1.0.1', '2026-10-01'),
      items: [{ kind: 'new', text: { fr: 'Le Revenant.', en: 'The Revenant.' }, edition: 'full' }],
    };
    const log = [release('1.2.0', '2026-10-15'), full, onlyFull];
    expect(ChangelogSchema.safeParse(log).success).toBe(true);

    expect(changelogForEdition(log, 'full').map((r) => r.items.length)).toEqual([1, 2, 1]);
    expect(changelogForEdition(log, 'full')[1]!.title.fr).toBe('Le Revenant');
    const demo = changelogForEdition(log, 'demo');
    expect(demo.map((r) => r.version)).toEqual(['1.2.0', '1.1.0']);
    expect(demo[1]).toEqual({
      version: '1.1.0',
      date: '2026-10-10',
      title: { fr: 'Tampons', en: 'Stamps' },
      items: [{ kind: 'new', text: { fr: 'Tampons.', en: 'Stamps.' } }],
    });
    // Les champs d'édition ne partent pas dans le jeu.
    expect(JSON.stringify(changelogForEdition(log, 'full'))).not.toMatch(/demoTitle|edition/);
    expect(ChangelogSchema.safeParse(demo).success).toBe(true);

    expect(changelogEditionLeaks(log, ['The Revenant', 'Le Revenant'])).toEqual([]);
    const leaky = [
      release('1.2.0', '2026-10-15'),
      { ...release('1.1.0', '2026-10-10'), title: full.title, items: full.items },
    ];
    expect(changelogEditionLeaks(leaky, ['The Revenant', 'Le Revenant'])).toHaveLength(2);
    expect(
      ChangelogSchema.safeParse([{ ...full, items: [{ ...full.items[0], edition: 'demo' }] }])
        .success,
    ).toBe(false);
  });

  it('profil : changelogSeen facultatif, semver', () => {
    const p = defaultProfile();
    expect(ProfileSchema.safeParse(p).success).toBe(true);
    expect(ProfileSchema.safeParse({ ...p, changelogSeen: '1.3.1' }).success).toBe(true);
    expect(ProfileSchema.safeParse({ ...p, changelogSeen: 'récent' }).success).toBe(false);
  });
});
