/**
 * Règle (docs/i18n/PLAN.md, lot B1) : aucun texte de l'interface n'est **capturé** au niveau
 * d'un module (ni au niveau d'une instance de composant hors `$derived`) : la langue change en
 * cours de partie, une constante figée garderait l'ancienne langue.
 *
 * Analyse statique (TypeScript) de `src/**`: modules `.ts` / `.svelte.ts`, blocs
 * `<script module>` et `<script>` d'instance des composants. Une instruction de premier niveau
 * ne doit pas lire `messages.*` (ou `pm`, `KIND_LABELS`…) hors d'une fonction. Exceptions :
 * - un alias vers un **sous-objet** du catalogue (`const m = messages.menu`) : c'est un Proxy
 *   qui relit la langue courante (l'alias est alors suivi comme `messages`) ;
 * - dans un composant, `$derived(…)` / `$derived.by(…)` (réévalué au changement de langue).
 */
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { fr } from '../fr';

/** Sources du jeu (texte brut), hors tests, contenu généré et catalogues eux-mêmes. */
const SOURCES = import.meta.glob<string>(
  [
    '../../**/*.ts',
    '../../**/*.svelte',
    '!../../**/__tests__/**',
    '!../../generated/**',
    '!../**',
    '!../../**/*.d.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
);

/** Racines réactives et sous-objet du catalogue qu'elles désignent. */
const ROOTS: Record<string, string[]> = {
  messages: [],
  pm: ['pm'],
  KIND_LABELS: ['kindLabels'],
  FIELD_LABELS: ['fieldLabels'],
  FIELD_ARTICLES: ['fieldArticles'],
  KEYWORD_RUBRICS: ['keywordRubrics'],
  RUBRIC_EMPTY: ['rubricEmpty'],
  HL_LABELS: ['hlLabels'],
};

interface Script {
  code: string;
  instance: boolean;
}

function scripts(path: string, text: string): Script[] {
  if (!path.endsWith('.svelte')) return [{ code: text, instance: false }];
  const out: Script[] = [];
  for (const m of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    out.push({ code: m[2]!, instance: !/\bmodule\b/.test(m[1]!) });
  }
  return out;
}

/** Chemin `messages.a.b` d'une chaîne d'accès (`null` si ce n'en est pas une). */
function accessPath(node: ts.Node, aliases: Map<string, string[]>): string[] | null {
  if (ts.isIdentifier(node)) return aliases.get(node.text) ?? null;
  if (ts.isPropertyAccessExpression(node)) {
    const base = accessPath(node.expression, aliases);
    return base ? [...base, node.name.text] : null;
  }
  return null;
}

function resolves(path: string[]): unknown {
  let v: unknown = fr;
  for (const k of path) v = (v as Record<string, unknown> | undefined)?.[k];
  return v;
}

const isFunction = (n: ts.Node) =>
  ts.isArrowFunction(n) ||
  ts.isFunctionExpression(n) ||
  ts.isFunctionDeclaration(n) ||
  ts.isMethodDeclaration(n) ||
  ts.isGetAccessor(n) ||
  ts.isSetAccessor(n) ||
  ts.isConstructorDeclaration(n) ||
  ts.isClassDeclaration(n) ||
  ts.isClassExpression(n);

const isDerived = (n: ts.Node) =>
  ts.isCallExpression(n) &&
  (n.expression.getText() === '$derived' || n.expression.getText() === '$derived.by');

/** Lectures du catalogue hors fonction (et hors `$derived` dans une instance). */
function captures(root: ts.Node, aliases: Map<string, string[]>, instance: boolean): ts.Node[] {
  const found: ts.Node[] = [];
  const visit = (n: ts.Node) => {
    if (isFunction(n) || (instance && isDerived(n))) return;
    if (ts.isIdentifier(n) && aliases.has(n.text)) {
      // Seule une déclaration d'import ou de type peut nommer la racine sans la lire.
      const p = n.parent;
      if (!ts.isImportSpecifier(p) && !ts.isTypeQueryNode(p) && !ts.isQualifiedName(p)) {
        found.push(n);
      }
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(root);
  return found;
}

function violations(): string[] {
  const out: string[] = [];
  const paths = Object.keys(SOURCES);
  expect(paths.length).toBeGreaterThan(50);
  for (const path of paths) {
    for (const { code, instance } of scripts(path, SOURCES[path]!)) {
      if (!Object.keys(ROOTS).some((r) => code.includes(r))) continue;
      const sf = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      const aliases = new Map(Object.entries(ROOTS));
      for (const stmt of sf.statements) {
        if (ts.isImportDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt)) continue;
        if (ts.isInterfaceDeclaration(stmt) || isFunction(stmt)) continue;
        if (ts.isExportDeclaration(stmt)) continue;
        if (ts.isVariableStatement(stmt)) {
          for (const d of stmt.declarationList.declarations) {
            const init = d.initializer;
            if (!init) continue;
            const p = accessPath(init, aliases);
            const v = p && resolves(p);
            if (
              p &&
              ts.isIdentifier(d.name) &&
              v !== null &&
              typeof v === 'object' &&
              !Array.isArray(v)
            ) {
              aliases.set(d.name.text, p); // alias vers un sous-objet : Proxy réactif
              continue;
            }
            for (const n of captures(init, aliases, instance)) {
              const { line } = sf.getLineAndCharacterOfPosition(n.getStart());
              out.push(`${path}:${line + 1} ${d.name.getText()}`);
            }
          }
          continue;
        }
        for (const n of captures(stmt, aliases, instance)) {
          const { line } = sf.getLineAndCharacterOfPosition(n.getStart());
          out.push(`${path}:${line + 1}`);
        }
      }
    }
  }
  return out;
}

describe('textes de l’interface', () => {
  it('aucune capture de messages.* au niveau d’un module ou d’une instance', () => {
    expect(violations()).toEqual([]);
  });

  it('détecte une capture (garde-fou de l’analyse)', () => {
    const sf = ts.createSourceFile(
      'x.ts',
      'const a = messages.menu;\nconst b = a.continue;\nconst c = () => messages.title;\nconst d = $derived(pm.common.close);',
      ts.ScriptTarget.Latest,
      true,
    );
    const aliases = new Map(Object.entries(ROOTS));
    const caught: string[] = [];
    for (const stmt of sf.statements) {
      if (!ts.isVariableStatement(stmt)) continue;
      const d = stmt.declarationList.declarations[0]!;
      const p = accessPath(d.initializer!, aliases);
      const v = p && resolves(p);
      if (p && v !== null && typeof v === 'object') {
        aliases.set(d.name.getText(), p);
        continue;
      }
      if (captures(d.initializer!, aliases, true).length > 0) caught.push(d.name.getText());
    }
    expect(caught).toEqual(['b']);
  });
});
