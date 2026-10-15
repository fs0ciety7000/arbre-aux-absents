<!--
  DocumentBody : rendu de l'AST `Block[]` d'un document (ARCHITECTURE §3.2), sans `{@html}`.
  Chaque conteneur de texte porte `data-path` et chaque morceau de texte `data-o` (décalage) :
  le Lecteur en déduit les surlignages à partir d'une sélection (voir doc-layout.ts).
-->
<script lang="ts">
  import type { Block } from '@arbre/contract';
  import { Stamp } from '@arbre/ui';
  import { layoutInlines, pathKey, type HighlightRange } from '../lib/doc-layout';
  import { messages } from '../messages';
  import { BODY_LABELS, type BodyOptions, type KeywordState } from './context';
  import Figure from './Figure.svelte';
  import Inlines from './Inlines.svelte';
  import Self from './DocumentBody.svelte';

  interface Props {
    blocks: Block[];
    opts: BodyOptions;
    /** Surlignages par conteneur (`pathKey`). */
    highlights?: Map<string, HighlightRange[]>;
    /** SVG d'une figure (`illustrations/<nom>.svg`) ; `undefined` pendant le chargement, `null` si indisponible. */
    figure?: (asset: string) => string | null | undefined;
    /** Blocs à rendre (indices), tous par défaut (recto / verso). */
    only?: number[] | null;
    /** Chemin du bloc parent (citations). */
    prefix?: number[];
  }

  let {
    blocks,
    opts: given,
    highlights = new Map(),
    figure = () => null,
    only = null,
    prefix = [],
  }: Props = $props();

  const inl = (path: number[], c: Parameters<typeof layoutInlines>[0]) =>
    layoutInlines(c, highlights.get(pathKey(path)) ?? []);
  const visible = (i: number) => only === null || only.includes(i);

  // État des mots-clés pour les lecteurs d'écran : descriptions cachées, une fois par document
  // (racine), référencées par `aria-describedby` (le nom accessible reste le mot lui-même).
  const uid = $props.id();
  const root = $derived(prefix.length === 0 && !given.decorative && !given.kwDescription);
  const opts: BodyOptions = $derived(
    root ? { ...given, kwDescription: (st: KeywordState) => `${uid}-kw-${st}` } : given,
  );
</script>

{#each blocks as b, i (i)}
  {#if visible(i)}
    {@const path = [...prefix, i]}
    {#if b.t === 'p'}
      <p data-path={pathKey(path)}><Inlines nodes={inl(path, b.c)} {opts} /></p>
    {:else if b.t === 'signature'}
      <p class="signature" data-path={pathKey(path)}>
        <span class={opts.mode === 'original' ? 'ink-hand' : ''}
          ><Inlines nodes={inl(path, b.c)} {opts} /></span
        >
      </p>
    {:else if b.t === 'h'}
      {#if b.level === 2}
        <h3 class="doc-h" data-path={pathKey(path)}><Inlines nodes={inl(path, b.c)} {opts} /></h3>
      {:else}
        <h4 class="doc-h" data-path={pathKey(path)}><Inlines nodes={inl(path, b.c)} {opts} /></h4>
      {/if}
    {:else if b.t === 'quote'}
      <blockquote>
        <Self blocks={b.c} {opts} {highlights} {figure} prefix={path} />
      </blockquote>
    {:else if b.t === 'list'}
      {#if b.ordered}
        <ol>
          {#each b.items as item, j (j)}
            <li data-path={pathKey([...path, j])}>
              <Inlines nodes={inl([...path, j], item)} {opts} />
            </li>
          {/each}
        </ol>
      {:else}
        <ul>
          {#each b.items as item, j (j)}
            <li data-path={pathKey([...path, j])}>
              <Inlines nodes={inl([...path, j], item)} {opts} />
            </li>
          {/each}
        </ul>
      {/if}
    {:else if b.t === 'table'}
      <div class="table-wrap">
        <table>
          {#if b.head.length > 0}
            <thead>
              <tr>
                {#each b.head as cell, c (c)}
                  <th scope="col" data-path={pathKey([...path, 0, c])}
                    ><Inlines nodes={inl([...path, 0, c], cell)} {opts} /></th
                  >
                {/each}
              </tr>
            </thead>
          {/if}
          <tbody>
            {#each b.rows as row, r (r)}
              <tr>
                {#each row as cell, c (c)}
                  <td data-path={pathKey([...path, r + 1, c])}
                    ><Inlines nodes={inl([...path, r + 1, c], cell)} {opts} /></td
                  >
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if b.t === 'figure'}
      {#if b.caption}
        {@const cap = b.caption}
        <Figure
          asset={b.asset}
          alt={b.alt}
          mode={opts.mode}
          load={figure}
          eager={opts.decorative}
          captionPath={pathKey(path)}
        >
          {#snippet caption()}<Inlines nodes={inl(path, cap)} {opts} />{/snippet}
        </Figure>
      {:else}
        <Figure
          asset={b.asset}
          alt={b.alt}
          mode={opts.mode}
          load={figure}
          eager={opts.decorative}
        />
      {/if}
    {:else if b.t === 'stamp'}
      {#if opts.mode === 'original'}
        <div class="doc-stamp"><Stamp text={b.text} tone="ink" size="s" rotate={-4} /></div>
      {:else}
        <p class="stamp-t">[{messages.labelled(BODY_LABELS.stamp, b.text)}]</p>
      {/if}
    {:else if b.t === 'hr'}
      <hr />
    {/if}
  {/if}
{/each}

{#if root}
  {#each ['new', 'known', 'searched'] as const as st (st)}
    <span id="{uid}-kw-{st}" hidden>{BODY_LABELS.kwState[st]}</span>
  {/each}
{/if}

<style>
  .signature {
    text-align: end;
  }
  .doc-h {
    font-family: var(--font-display);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
    margin: 0;
  }
  h3.doc-h {
    font-size: var(--step-1);
  }
  h4.doc-h {
    font-size: var(--step-0);
  }
  blockquote {
    margin: 0;
    padding-inline-start: var(--space-4);
    border-inline-start: var(--border-strong) solid var(--line);
  }
  blockquote > :global(* + *) {
    margin-block-start: 0.9em;
  }
  ul,
  ol {
    margin: 0;
    padding-inline-start: var(--space-6);
  }
  .table-wrap {
    overflow-x: auto;
    max-inline-size: 100%;
  }
  table {
    border-collapse: collapse;
    inline-size: 100%;
    font-size: inherit;
  }
  th,
  td {
    border: var(--border) solid var(--line);
    padding: var(--space-1) var(--space-2);
    text-align: start;
    vertical-align: top;
  }
  th {
    font-weight: var(--weight-semibold);
    background: var(--surface-2);
  }
  .doc-stamp {
    display: flex;
    justify-content: flex-end;
  }
  /* Un tampon long (nom d'étude, de service) passe à la ligne plutôt que de déborder de la
     feuille à gauche quand la colonne est étroite (volet, zoom du lecteur). */
  .doc-stamp :global(.stamp-wrap) {
    max-inline-size: 100%;
  }
  .doc-stamp :global(.stamp .inner) {
    white-space: normal;
    text-align: center;
  }
  .stamp-t {
    font-family: var(--font-type);
    color: var(--text-muted);
  }
  hr {
    border: 0;
    border-block-start: var(--border) solid var(--line);
    margin-block: var(--space-4);
  }
</style>
