import { describe, expect, it } from 'vitest';
import {
  ITCH_PAGE,
  MAX_NOTES_CHARS,
  canSelfUpdate,
  compareVersions,
  displayVersion,
  isNewer,
  isUpdateDownloadUrl,
  notesFor,
  offerFromGithubRelease,
  parseVersion,
  signedApkName,
} from '../update';

const APK =
  'https://github.com/fs0ciety7000/arbre-aux-absents/releases/download/v1.4.0/arbre-aux-absents-1.4.0.apk';

describe('versions', () => {
  it('compare selon semver (préfixe v toléré)', () => {
    expect(compareVersions('1.4.0', '1.3.1')).toBe(1);
    expect(compareVersions('v1.3.1', '1.3.1')).toBe(0);
    expect(compareVersions('1.3.1', '1.10.0')).toBe(-1);
    expect(compareVersions('2.0.0', '1.99.99')).toBe(1);
    expect(compareVersions('1.4.0', '1.4.0-rc.1')).toBe(1);
    expect(compareVersions('1.4.0-rc.2', '1.4.0-rc.10')).toBe(-1);
    expect(compareVersions('1.4.0-alpha', '1.4.0-1')).toBe(1);
    expect(compareVersions('1.4.0+build.7', '1.4.0')).toBe(0);
  });

  it('refuse les versions illisibles', () => {
    expect(parseVersion('1.4')).toBeNull();
    expect(parseVersion('01.4.0')).toBeNull();
    expect(parseVersion(42)).toBeNull();
    expect(compareVersions('latest', '1.0.0')).toBeNull();
    expect(isNewer('latest', '1.0.0')).toBe(false);
  });

  it('isNewer : strictement plus récente seulement', () => {
    expect(isNewer('1.3.2', '1.3.1')).toBe(true);
    expect(isNewer('1.3.1', '1.3.1')).toBe(false);
    expect(isNewer('1.3.0', '1.3.1')).toBe(false);
    expect(displayVersion('v1.4.0')).toBe('1.4.0');
  });
});

describe('notesFor', () => {
  const body = '<!-- fr -->\nNouveautés\n- Point FR\n<!-- en -->\nWhat’s new\n- EN item\n';

  it('choisit la section de la langue, sinon l’autre, sinon le texte entier', () => {
    expect(notesFor(body, 'fr')).toBe('Nouveautés\n- Point FR');
    expect(notesFor(body, 'en')).toBe('What’s new\n- EN item');
    expect(notesFor('<!-- fr -->\nSeulement FR', 'en')).toBe('Seulement FR');
    expect(notesFor('Texte simple <!-- note -->', 'en')).toBe('Texte simple');
  });

  it('vide ou absent → null ; coupe les notes trop longues', () => {
    expect(notesFor(undefined, 'fr')).toBeNull();
    expect(notesFor('  <!-- fr -->  ', 'fr')).toBeNull();
    const long = notesFor('x'.repeat(MAX_NOTES_CHARS + 50), 'fr')!;
    expect(long.length).toBe(MAX_NOTES_CHARS);
    expect(long.endsWith('…')).toBe(true);
  });
});

describe('isUpdateDownloadUrl', () => {
  it('APK des releases du dépôt et page itch.io seulement', () => {
    expect(isUpdateDownloadUrl(APK)).toBe(true);
    expect(isUpdateDownloadUrl(ITCH_PAGE)).toBe(true);
    expect(isUpdateDownloadUrl('https://github.com/autre/depot/releases/download/v1/x.apk')).toBe(
      false,
    );
    expect(isUpdateDownloadUrl(APK.replace('.apk', '.exe'))).toBe(false);
    expect(isUpdateDownloadUrl(APK.replace('https:', 'http:'))).toBe(false);
    expect(isUpdateDownloadUrl('https://cardorinteractive.itch.io/autre-jeu')).toBe(false);
    expect(isUpdateDownloadUrl('javascript:alert(1)')).toBe(false);
    expect(isUpdateDownloadUrl(null)).toBe(false);
  });
});

describe('offerFromGithubRelease (Android)', () => {
  const release = (over: Record<string, unknown> = {}) => ({
    tag_name: 'v1.4.0',
    draft: false,
    prerelease: false,
    body: '<!-- fr -->\nNotes',
    assets: [
      { name: 'arbre-aux-absents-1.4.0.aab', browser_download_url: APK.replace('.apk', '.aab') },
      { name: signedApkName('v1.4.0'), browser_download_url: APK },
    ],
    ...over,
  });

  it('propose l’APK signé d’une version plus récente', () => {
    expect(offerFromGithubRelease(release(), '1.3.1')).toEqual({
      version: '1.4.0',
      notes: '<!-- fr -->\nNotes',
      action: 'download',
      url: APK,
    });
  });

  it('rien si à jour, brouillon, pré-version ou réponse illisible', () => {
    expect(offerFromGithubRelease(release(), '1.4.0')).toBeNull();
    expect(offerFromGithubRelease(release(), '1.5.0')).toBeNull();
    expect(offerFromGithubRelease(release({ draft: true }), '1.3.1')).toBeNull();
    expect(offerFromGithubRelease(release({ prerelease: true }), '1.3.1')).toBeNull();
    expect(offerFromGithubRelease(release({ tag_name: 'nightly' }), '1.3.1')).toBeNull();
    expect(offerFromGithubRelease(null, '1.3.1')).toBeNull();
    expect(offerFromGithubRelease([], '1.3.1')).toBeNull();
  });

  it('APK absent ou hors du dépôt → page itch.io', () => {
    expect(offerFromGithubRelease(release({ assets: [] }), '1.3.1')?.url).toBe(ITCH_PAGE);
    const evil = release({
      assets: [
        { name: 'arbre-aux-absents-1.4.0.apk', browser_download_url: 'https://evil.example/x.apk' },
      ],
    });
    expect(offerFromGithubRelease(evil, '1.3.1')?.url).toBe(ITCH_PAGE);
  });
});

describe('canSelfUpdate', () => {
  it('NSIS, app macOS et AppImage seulement', () => {
    expect(['nsis', 'app', 'appimage'].map(canSelfUpdate)).toEqual([true, true, true]);
    expect(['deb', 'rpm', 'msi', '', null, undefined].map(canSelfUpdate)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});
