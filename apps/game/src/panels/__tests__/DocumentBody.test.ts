import type { Block } from '@arbre/contract';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import type { BodyOptions } from '../doc/context';
import DocumentBody from '../doc/DocumentBody.svelte';

const opts = (over: Partial<BodyOptions> = {}): BodyOptions => ({
  mode: 'original',
  decorative: false,
  kwState: (kw) => (kw === 'kw-a' ? 'searched' : 'new'),
  ...over,
});

const html = (blocks: Block[], o: Partial<BodyOptions> = {}, extra: Record<string, unknown> = {}) =>
  render(DocumentBody, { props: { blocks, opts: opts(o), ...extra } })
    .body.replace(/<!--[^]*?-->/g, '')
    .replace(/ svelte-[a-z0-9]+/g, '');

const t = (v: string) => ({ t: 'text' as const, v });

describe('DocumentBody', () => {
  it('rend chaque type de bloc', () => {
    const out = html([
      { t: 'p', c: [t('para')] },
      { t: 'signature', c: [t('signé')] },
      { t: 'h', level: 2, c: [t('Titre')] },
      { t: 'h', level: 3, c: [t('Sous-titre')] },
      { t: 'quote', c: [{ t: 'p', c: [t('citation')] }] },
      { t: 'list', ordered: true, items: [[t('un')], [t('deux')]] },
      { t: 'list', ordered: false, items: [[t('puce')]] },
      { t: 'table', head: [[t('Nom')]], rows: [[[t('Marrel')]]] },
      { t: 'figure', asset: 'illustrations/a.svg', alt: 'Un quai', caption: [t('légende')] },
      { t: 'stamp', text: 'Copie conforme' },
      { t: 'hr' },
    ]);
    expect(out).toMatch(/<p data-path="0">.*para/s);
    expect(out).toMatch(/class="signature".*ink-hand.*signé/s);
    expect(out).toMatch(/<h3[^>]*>.*Titre/s);
    expect(out).toMatch(/<h4[^>]*>.*Sous-titre/s);
    expect(out).toMatch(/<blockquote[^>]*>.*data-path="4\.0".*citation/s);
    expect(out).toMatch(/<ol[^>]*>.*data-path="5\.0".*un.*data-path="5\.1".*deux/s);
    expect(out).toMatch(/<ul[^>]*>.*puce/s);
    expect(out).toMatch(
      /<th scope="col" data-path="7\.0\.0".*Nom.*<td data-path="7\.1\.0".*Marrel/s,
    );
    expect(out).toMatch(/<figure.*Un quai.*<figcaption data-path="8".*légende/s);
    expect(out).toContain('Copie conforme');
    expect(out).toContain('<hr');
  });

  it('rend chaque type d’inline', () => {
    const out = html([
      {
        t: 'p',
        c: [
          { t: 'em', c: [t('pench')] },
          { t: 'strong', c: [t('gras')] },
          { t: 'strike', c: [t('barré')] },
          { t: 'hand', c: [t('plume')] },
          { t: 'redacted', length: 4 },
          { t: 'ref', keyword: 'kw-a', c: [t('Marrel')] },
          { t: 'ref', keyword: 'kw-b', c: [t('Sorvo')] },
        ],
      },
    ]);
    expect(out).toMatch(/<em>.*pench.*<\/em>/s);
    expect(out).toMatch(/<strong>.*gras.*<\/strong>/s);
    expect(out).toMatch(/<s[ >].*barré.*<\/s>/s);
    expect(out).toMatch(/class="ink-hand".*plume/s);
    expect(out).toMatch(/role="img" aria-label="passage caviardé".*████/s);
    expect(out).toMatch(
      /class="kw" data-state="searched" data-keyword="kw-a"[^>]*role="button"[^>]*tabindex="0"/s,
    );
    expect(out).toMatch(/data-state="new" data-keyword="kw-b"/);
  });

  it('état des mots-clés exposé aux lecteurs d’écran (description, nom inchangé)', () => {
    const blocks: Block[] = [
      {
        t: 'p',
        c: [
          { t: 'ref', keyword: 'kw-a', c: [t('Marrel')] },
          { t: 'ref', keyword: 'kw-b', c: [t('Sorvo')] },
        ],
      },
    ];
    const out = html(blocks);
    const ids = (state: string) =>
      new RegExp(`data-keyword="${state}"[^>]*aria-describedby="([^"]+)"`).exec(out)?.[1];
    const searched = ids('kw-a');
    const fresh = ids('kw-b');
    expect(searched).toMatch(/-kw-searched$/);
    expect(fresh).toMatch(/-kw-new$/);
    expect(out).toContain(`<span id="${searched}" hidden="">déjà consulté au Catalogue</span>`);
    expect(out).toContain(`<span id="${fresh}" hidden="">nouveau mot-clé</span>`);
    // Copie décorative (loupe) : rien d'annoncé.
    expect(html(blocks, { decorative: true })).not.toContain('aria-describedby');
  });

  it('figure : chargement en cours, puis SVG, sinon erreur', () => {
    const fig: Block[] = [{ t: 'figure', asset: 'illustrations/a.svg', alt: 'Un quai' }];
    expect(html(fig, {}, { figure: () => undefined })).toMatch(
      /class="art-box loading".*role="status"/s,
    );
    expect(html(fig, {}, { figure: () => null })).toContain('L’image n’a pas pu être chargée.');
  });

  it('transcription : manuscrit, caviardage, tampon et figure en texte', () => {
    const out = html(
      [
        {
          t: 'p',
          c: [
            { t: 'hand', c: [t('plume')] },
            { t: 'redacted', length: 3 },
          ],
        },
        { t: 'stamp', text: 'Vu' },
        { t: 'figure', asset: 'x', alt: 'Une photo' },
      ],
      { mode: 'transcript' },
    );
    expect(out).not.toContain('ink-hand');
    expect(out).toContain('[passage caviardé]');
    expect(out).toContain('[Tampon : Vu]');
    expect(out).toContain('Une photo');
  });

  it('n’injecte jamais de HTML venu du contenu', () => {
    const evil = '<img src=x onerror=alert(1)><script>alert(2)</script>';
    const out = html(
      [
        { t: 'p', c: [t(evil)] },
        { t: 'stamp', text: evil },
        { t: 'figure', asset: 'x', alt: evil, caption: [t(evil)] },
        { t: 'table', head: [[t(evil)]], rows: [] },
        { t: 'ref' as never },
      ].slice(0, 4) as Block[],
    );
    expect(out).not.toMatch(/<img|<script/i);
    expect(out).toContain('&lt;img');
  });

  it('applique les surlignages avec leur motif', () => {
    const out = html(
      [{ t: 'p', c: [t('abcdef')] }],
      {},
      {
        highlights: new Map([['0', [{ start: 1, end: 3, color: 4, index: 0 }]]]),
      },
    );
    expect(out).toMatch(
      /<span data-o="0">a<\/span><mark class="hl-4" data-o="1" data-hl="0">bc<\/mark><span data-o="3">def<\/span>/,
    );
  });

  it('copie décorative (loupe) : aucun mot-clé focalisable', () => {
    const out = html([{ t: 'p', c: [{ t: 'ref', keyword: 'kw-b', c: [t('X')] }] }], {
      decorative: true,
    });
    expect(out).not.toContain('tabindex');
    expect(out).toContain('class="kw"');
  });

  it('n’affiche que les blocs demandés (recto / verso)', () => {
    const out = html(
      [
        { t: 'p', c: [t('un')] },
        { t: 'p', c: [t('deux')] },
      ],
      {},
      { only: [1] },
    );
    expect(out).not.toContain('un<');
    expect(out).toContain('deux');
  });
});
