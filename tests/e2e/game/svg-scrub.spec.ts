/**
 * Défense en profondeur des SVG de contenu (`packages/map/src/svelte/svg.ts`) : analysés en XML
 * puis nettoyés dans un vrai navigateur (le module n'a pas de dépendance ; transpilé à la volée).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { expect, test, type Page } from '@playwright/test';

const source = readFileSync(
  fileURLToPath(new URL('../../../packages/map/src/svelte/svg.ts', import.meta.url)),
  'utf8',
);
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

declare global {
  interface Window {
    svgModule: { parseSvg(markup: string): SVGSVGElement | null };
  }
}

test.beforeEach(async ({ page }) => {
  await page.setContent('<!doctype html><title>svg</title><div id="host"></div>');
  const url = `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`;
  await page.evaluate(async (u) => {
    window.svgModule = await import(u);
  }, url);
});

const scrubbed = (page: Page, markup: string) =>
  page.evaluate((m) => window.svgModule.parseSvg(m)?.outerHTML ?? null, markup);

test('retire un href XLink déclaré sous un autre préfixe que « xlink »', async ({ page }) => {
  const out = await scrubbed(
    page,
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:x="http://www.w3.org/1999/xlink" viewBox="0 0 1 1"><a x:href="javascript:alert(1)"><rect width="1" height="1"/></a></svg>',
  );
  expect(out).not.toBeNull();
  expect(out).not.toContain('javascript:');
});

test('retire les animations SMIL qui réécriraient un lien', async ({ page }) => {
  const out = await scrubbed(
    page,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><a href="#a"><set attributeName="href" to="javascript:alert(1)"/><animate attributeName="href" values="javascript:alert(1)"/><rect id="a" width="1" height="1"/></a></svg>',
  );
  expect(out).not.toContain('<set');
  expect(out).not.toContain('<animate');
  expect(out).toContain('href="#a"');
});

test('garde le reste : script, on*, style et href externes retirés', async ({ page }) => {
  const out = await scrubbed(
    page,
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1 1" onload="x()"><script>x()</script><use xlink:href="https://evil/x.svg#a" style="fill:red"/><use href="#b"/><g id="b"/></svg>',
  );
  expect(out).not.toMatch(/onload|<script|https:|style=/);
  expect(out).toContain('href="#b"');
});
