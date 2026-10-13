<!--
  DocumentBody : rendu de l'AST `Block[]` d'un document (ARCHITECTURE §3.2), sans `{@html}`.
  Chaque conteneur de texte porte `data-path` et chaque morceau de texte `data-o` (décalage) :
  le Lecteur en déduit les surlignages à partir d'une sélection (voir doc-layout.ts).
-->
<script lang="ts">
  import type { Block } from '@arbre/contract';
  import { Stamp } from '@arbre/ui';
  import { svgContent } from '@arbre/map/svelte';
  import { layoutInlines, pathKey, type HighlightRange } from '../lib/doc-layout';
  import { BODY_LABELS, type BodyOptions } from './context';
  import Inlines from './Inlines.svelte';
  import Self from './DocumentBody.svelte';

  interface Props {
    blocks: Block[];
    opts: BodyOptions;
    /** Surlignages par conteneur (`pathKey`). */
    highlights?: Map<string, HighlightRange[]>;
    /** SVG d'une figure (`illustrations/<nom>.svg`), ou `null`. */
    figure?: (asset: string) => string | null;
    /** Blocs à rendre (indices), tous par défaut (recto / verso). */
    only?: number[] | null;
    /** Chemin du bloc parent (citations). */
    prefix?: number[];
  }

  let {
    blocks,
    opts,
    highlights = new Map(),
    figure = () => null,
    only = null,
    prefix = [],
  }: Props = $props();

  const inl = (path: number[], c: Parameters<typeof layoutInlines>[0]) =>
    layoutInlines(c, highlights.get(pathKey(path)) ?? []);
  const visible = (i: number) => only === null || only.includes(i);
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
      {@const svg = opts.mode === 'original' ? figure(b.asset) : null}
      <figure class="doc-figure">
        {#if opts.mode === 'original' && svg}
          <div class="art-box" role="img" aria-label={b.alt} use:svgContent={svg}></div>
        {:else}
          <p class="figure-alt">
            <span class="caps">{BODY_LABELS.figure}</span>
            <span>{b.alt}</span>
            {#if opts.mode === 'original'}<span class="figure-error">{BODY_LABELS.imageError}</span
              >{/if}
          </p>
        {/if}
        {#if b.caption}
          <figcaption data-path={pathKey(path)}>
            <Inlines nodes={inl(path, b.caption)} {opts} />
          </figcaption>
        {/if}
      </figure>
    {:else if b.t === 'stamp'}
      {#if opts.mode === 'original'}
        <div class="doc-stamp"><Stamp text={b.text} tone="ink" size="s" rotate={-4} /></div>
      {:else}
        <p class="stamp-t">[{BODY_LABELS.stamp} : {b.text}]</p>
      {/if}
    {:else if b.t === 'hr'}
      <hr />
    {/if}
  {/if}
{/each}

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
  .doc-figure {
    margin: 0;
    display: grid;
    gap: var(--space-2);
  }
  .art-box {
    inline-size: 100%;
    background: var(--surface-1);
    border-radius: var(--radius-paper);
  }
  .art-box :global(svg) {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }
  .figure-alt {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding: var(--space-3);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-paper);
    font-style: italic;
  }
  .figure-alt .caps {
    font-style: normal;
    color: var(--text-muted);
  }
  .figure-error {
    font-style: normal;
    color: var(--danger);
    font-family: var(--font-ui);
    font-size: var(--step-0);
  }
  figcaption {
    font-style: italic;
    color: var(--text-muted);
  }
  .doc-stamp {
    display: flex;
    justify-content: flex-end;
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
