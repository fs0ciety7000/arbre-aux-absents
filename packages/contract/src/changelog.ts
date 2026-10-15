import { z } from 'zod';
import { SEMVER } from './ids';

/*
 * Notes de version (« Nouveautés ») : `content/changelog.json`, lu par le jeu (écran Nouveautés) et
 * le site (`/nouveautes/`). Une entrée par version publiée sur itch.io, jamais une par commit : la
 * publication est le regroupement (ARCHITECTURE §3.8). Les plus récentes d'abord.
 */

/** Nature d'un point : nouveauté, amélioration, correction (ordre d'affichage). */
export const CHANGE_KINDS = ['new', 'improved', 'fixed'] as const;
export type ChangeKind = (typeof CHANGE_KINDS)[number];

/** Texte dans les deux langues de l'interface (le français fait foi). */
export interface ChangelogText {
  fr: string;
  en: string;
}

export interface ChangelogItem {
  kind: ChangeKind;
  text: ChangelogText;
}

export interface ChangelogRelease {
  /** semver, unique dans le journal. */
  version: string;
  /** Date de publication, AAAA-MM-JJ. */
  date: string;
  title: ChangelogText;
  /** 1 à 8 points, écrits pour les joueurs (aucun détail interne, aucune solution d'affaire). */
  items: ChangelogItem[];
}

/** Le journal entier : les versions de la plus récente à la plus ancienne. */
export type Changelog = ChangelogRelease[];

export const CHANGELOG_LIMITS = { items: 8, title: 120, text: 400 } as const;

const ISO_DAY = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

const text = (max: number) =>
  z.strictObject({
    fr: z.string().trim().min(1).max(max),
    en: z.string().trim().min(1).max(max),
  });

export const ChangelogItemSchema = z.strictObject({
  kind: z.enum(CHANGE_KINDS),
  text: text(CHANGELOG_LIMITS.text),
});

export const ChangelogReleaseSchema = z.strictObject({
  version: z.string().regex(SEMVER, { error: 'Version semver attendue (ex. 1.4.0)' }),
  date: z.string().regex(ISO_DAY, { error: 'Date attendue : AAAA-MM-JJ' }),
  title: text(CHANGELOG_LIMITS.title),
  items: z.array(ChangelogItemSchema).min(1).max(CHANGELOG_LIMITS.items),
});

/**
 * Compare deux versions semver (majeure, mineure, correctif ; une pré-version passe avant sa
 * version). Négatif si `a` < `b`.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [core = '', pre] = v.split('+')[0]!.split(/-(.*)/s);
    return { nums: core.split('.').map(Number), pre: pre ?? null };
  };
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) {
    const d = (x.nums[i] ?? 0) - (y.nums[i] ?? 0);
    if (d !== 0) return d;
  }
  if (x.pre === y.pre) return 0;
  if (x.pre === null) return 1;
  if (y.pre === null) return -1;
  return x.pre < y.pre ? -1 : 1;
}

export const ChangelogSchema = z
  .array(ChangelogReleaseSchema)
  .min(1)
  .superRefine((releases, ctx) => {
    const seen = new Set<string>();
    releases.forEach((r, i) => {
      if (seen.has(r.version)) {
        ctx.addIssue({
          code: 'custom',
          path: [i, 'version'],
          message: `Version ${r.version} en double`,
        });
      }
      seen.add(r.version);
      const prev = releases[i - 1];
      if (!prev) return;
      if (compareVersions(prev.version, r.version) <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: [i, 'version'],
          message: `Ordre : ${r.version} doit venir avant ${prev.version} (la plus récente d'abord)`,
        });
      }
      if (prev.date < r.date) {
        ctx.addIssue({
          code: 'custom',
          path: [i, 'date'],
          message: `Date : ${r.version} (${r.date}) est plus récente que ${prev.version} (${prev.date})`,
        });
      }
    });
  });

/**
 * Erreurs de cohérence entre le journal et la version publiée du jeu (`apps/game/package.json`) :
 * la plus récente entrée doit porter exactement cette version. Vide si tout va bien.
 */
export function changelogVersionIssues(changelog: Changelog, appVersion: string): string[] {
  const latest = changelog[0]?.version;
  if (latest === appVersion) return [];
  return [
    `La dernière entrée du journal (${latest ?? 'aucune'}) ne correspond pas à la version du jeu (${appVersion}) : ajoutez l'entrée ${appVersion}, condensée depuis les commits de la version précédente.`,
  ];
}
