import { describe, expect, it } from 'vitest';
import { codeBlock, fenceFor, issueLabels, renderIssue, renderRedacted } from '../src/render';
import { submission } from './helpers';

/** Contenu d'un bloc de code délimité par `fence` : le texte entre la première et la dernière clôture. */
function insideFences(body: string, fence: string): string[] {
  const parts = body.split('\n');
  const out: string[] = [];
  let inside = false;
  for (const line of parts) {
    if (!inside && line.startsWith(fence) && !line.startsWith(fence + '`')) inside = true;
    else if (inside && line === fence) inside = false;
    else if (inside) out.push(line);
  }
  return out;
}

describe('neutralisation Markdown', () => {
  it('clôture plus longue que toute suite d’accents graves', () => {
    expect(fenceFor('rien')).toBe('```');
    expect(fenceFor('a ``` b')).toBe('````');
    expect(fenceFor('``````')).toBe('```````');
  });

  it('mentions, images, liens, HTML et fausses clôtures restent dans le bloc', () => {
    const description = [
      '@fs0ciety7000 regarde ça',
      '![pixel](https://evil.example/p.png)',
      '[clique](javascript:alert(1)) <img src=x onerror=alert(1)>',
      '```',
      '# Titre injecté',
      '````',
      '</details>',
    ].join('\n');
    const { body, title, labels } = renderIssue('AA-0042', submission({ description }));
    const fence = fenceFor(description);
    expect(fence).toBe('`````');
    const block = codeBlock(description);
    expect(body).toContain(block);
    // Tout le texte du joueur est à l'intérieur du bloc, ligne à ligne.
    expect(insideFences(block, fence)).toEqual(description.split('\n'));
    // Rien du texte du joueur n'est hors d'un bloc de code.
    const outside = body.replace(block, '');
    expect(outside).not.toContain('@fs0ciety7000');
    expect(outside).not.toContain('evil.example');
    expect(title).toBe('AA-0042 · bug (jeu)');
    expect(labels).toEqual(['signalement', 'source:jeu', 'cat:bug']);
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
