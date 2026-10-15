import { describe, expect, it } from 'vitest';
import {
  codeBlock,
  fenceFor,
  formatBytes,
  issueLabels,
  neutralizeMarkdown,
  quoteBlock,
  renderEnvironment,
  renderIssue,
  renderRedacted,
} from '../src/render';
import { API, submission } from './helpers';

const ZW = '\u200B';

describe('neutralisation Markdown', () => {
  it('clôture plus longue que toute suite d’accents graves', () => {
    expect(fenceFor('rien')).toBe('```');
    expect(fenceFor('a ``` b')).toBe('````');
    expect(fenceFor('``````')).toBe('```````');
  });

  it('description en Markdown cité : mentions, références, images, HTML et entités neutralisés', () => {
    const description = [
      '**Gras** et _italique_, `code`, [lien](https://example.org)',
      '@fs0ciety7000 regarde ça, cc @org/equipe',
      'voir #12, o/r#34, GH-56 et https://github.com/o/r/issues/78',
      '![pixel](https://evil.example/p.png) ![ref][x]',
      '<img src=x onerror=alert(1)> </details> <!-- c -->',
      '&#64;fs0ciety7000 &commat;moi &#x40;toi',
      'écrire à joueuse@example.org',
      '```',
      '# Titre injecté',
      '- liste',
    ].join('\n');
    const { body, title, labels } = renderIssue('AA-0042', submission({ description }));
    const quote = quoteBlock(description);
    expect(body).toContain(`### Description\n\n${quote}\n\n### Environnement`);
    // Chaque ligne du joueur est dans la citation : un bloc de code non fermé n'en sort pas.
    for (const line of quote.split('\n')) expect(line.startsWith('>')).toBe(true);
    expect(quote).toContain('> **Gras** et _italique_, `code`, [lien](https://example.org)');
    expect(quote).toContain('> - liste');
    // Plus aucune mention, référence, image, balise ou entité active.
    expect(quote).not.toMatch(/(^|[^A-Za-z0-9])@[A-Za-z0-9]/m);
    expect(quote).not.toMatch(/#\d/);
    expect(quote).not.toMatch(/GH-\d/);
    expect(quote).not.toMatch(/!\[/);
    expect(quote).not.toMatch(/<[A-Za-z/!?]/);
    expect(quote).not.toMatch(/&(#|[A-Za-z]+;)/);
    expect(quote).not.toContain('github.com/o/r/issues');
    // Le texte reste lisible : seuls des espaces sans chasse ont été insérés.
    expect(quote.replaceAll(ZW, '')).toBe(
      description
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n'),
    );
    // Adresse électronique intacte (pas une mention).
    expect(quote).toContain('joueuse@example.org');
    expect(title).toBe('AA-0042 · bug (jeu)');
    expect(labels).toEqual(['signalement', 'source:jeu', 'cat:bug']);
  });

  it('caractères de contrôle et de direction retirés, lignes vides en citation', () => {
    expect(quoteBlock('a\u0000b‮c\r\n\r\nd')).toBe('> abc\n>\n> d');
    expect(neutralizeMarkdown('ok')).toBe('ok');
  });

  it('jamais de contact ni de jeton ; diagnostics en JSON dans <details>', () => {
    const { body } = renderIssue('AA-0001', submission({ contact: 'secret@example.org' }));
    expect(body).not.toContain('secret@example.org');
    expect(body).toMatch(/<details><summary>Diagnostics<\/summary>\n\n```json\n\{/);
    expect(body).toContain('"appVersion": "1.2.0"');
  });

  it('étiquette langue:en et source:site', () => {
    expect(issueLabels({ source: 'site', category: 'text', locale: 'en' })).toEqual([
      'signalement',
      'source:site',
      'cat:text',
      'langue:en',
    ]);
  });

  it('sauvegarde jointe trop volumineuse : omise du corps', () => {
    const save = { blob: 'x'.repeat(47_000), more: 'y'.repeat(14_000) };
    const s = submission();
    s.diagnostics.save = save;
    const { body } = renderIssue('AA-0003', s);
    expect(body.length).toBeLessThan(65_536);
    expect(body).toContain('Sauvegarde omise');
  });

  it('caractères de contrôle retirés', () => {
    expect(codeBlock('a\u0000b\u001bc\r\nd')).toBe('```text\nabc\nd\n```');
  });

  it('corps de remplacement', () => {
    expect(renderRedacted('AA-0042')).toContain('supprimé');
  });
});

describe('section Environnement', () => {
  it('tableau lisible : version, édition, plateforme, OS, navigateur, langue, affaire, fenêtre', () => {
    const s = submission();
    s.diagnostics = {
      ...s.diagnostics,
      browser: 'Firefox 131',
      caseId: 'succession-varenque',
      contentHash: '0a1b2c3d',
      viewport: { w: 1280, h: 800, dpr: 1.5 },
    };
    const env = renderEnvironment(s.diagnostics);
    expect(env.split('\n')).toEqual([
      '| | |',
      '|---|---|',
      '| Version | `1.2.0` · complète |',
      '| Plateforme | Web (navigateur) |',
      '| Système | `Linux` |',
      '| Navigateur | `Firefox 131` |',
      '| Langue | `fr` |',
      '| Affaire | `succession-varenque` (`0a1b2c3d`) |',
      '| Fenêtre | 1280 × 800 @1.5x |',
    ]);
    const { body } = renderIssue('AA-0001', s);
    expect(body).toContain(`### Environnement\n\n${env}\n`);
    // Le JSON complet reste disponible.
    expect(body).toContain('"browser": "Firefox 131"');
  });

  it('signalement du site : version et plateforme du jeu déclarées', () => {
    const env = renderEnvironment({
      appVersion: '1.3.1',
      edition: 'full',
      platform: 'site',
      gameVersion: '1.3.0',
      gamePlatform: 'android',
      locale: 'en',
      viewport: { w: 390, h: 844, dpr: 3 },
    });
    expect(env).toContain('| Plateforme | Site |');
    expect(env).toContain('| Jeu (déclaré) | `1.3.0` · Android |');
    expect(env).toContain('| Système | — |');
    expect(env).toContain('| Navigateur | — |');
    expect(env).not.toContain('Affaire');
  });

  it('valeurs libres échappées : ni barre, ni accent grave, ni saut de ligne', () => {
    const env = renderEnvironment({
      appVersion: '1.0`|x\n# t',
      edition: 'demo',
      platform: 'desktop',
      os: '@moi | <b>',
      locale: 'fr',
      viewport: { w: 1, h: 1, dpr: 1 },
    });
    expect(env).toContain('| Version | `1.0 \\|x # t` · démo |');
    expect(env).toContain('| Système | `@moi \\| <b>` |');
    // Une ligne par champ, deux colonnes exactement.
    for (const line of env.split('\n').slice(2)) {
      expect(line.replace(/\\\|/g, '').split('|')).toHaveLength(4);
    }
  });
});

describe('captures d’écran dans le ticket', () => {
  it('images Markdown avec les URL signées, dans l’ordre', () => {
    const url = (id: string) => `${API}/v1/attachments/${id}?sig=${'s'.repeat(43)}`;
    const { body } = renderIssue('AA-0007', submission(), [
      { url: url('a'.repeat(22)), type: 'image/png', width: 1280, height: 720, bytes: 34_816 },
      { url: url('b'.repeat(22)), type: 'image/jpeg', width: 390, height: 844, bytes: 1_572_864 },
    ]);
    expect(body).toContain(
      `### Captures d’écran\n\n![Capture 1 · PNG 1280 × 720, 34 Ko](${url('a'.repeat(22))})\n\n` +
        `![Capture 2 · JPEG 390 × 844, 1,5 Mo](${url('b'.repeat(22))})`,
    );
    expect(body.indexOf('### Captures')).toBeLessThan(body.indexOf('<details>'));
    expect(renderIssue('AA-0008', submission()).body).not.toContain('Captures');
    expect(formatBytes(512)).toBe('512 o');
  });
});
