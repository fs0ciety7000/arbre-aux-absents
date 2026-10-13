<script lang="ts">
  import type { Block } from '@arbre/contract';
  import { Stamp } from '@arbre/ui';
  import Inlines from './Inlines.svelte';
  import Self from './Blocks.svelte';

  /** Rendu des blocs d'un texte compilé (dénouement). */
  interface Props {
    blocks: Block[];
  }
  let { blocks }: Props = $props();
</script>

{#each blocks as b, i (i)}
  {#if b.t === 'p'}
    <p><Inlines items={b.c} /></p>
  {:else if b.t === 'signature'}
    <p class="signature ink-hand"><Inlines items={b.c} /></p>
  {:else if b.t === 'h'}
    {#if b.level === 2}<h2><Inlines items={b.c} /></h2>{:else}<h3><Inlines items={b.c} /></h3>{/if}
  {:else if b.t === 'quote'}
    <blockquote><Self blocks={b.c} /></blockquote>
  {:else if b.t === 'list'}
    <svelte:element this={b.ordered ? 'ol' : 'ul'}>
      {#each b.items as li, j (j)}<li><Inlines items={li} /></li>{/each}
    </svelte:element>
  {:else if b.t === 'table'}
    <table>
      <thead
        ><tr
          >{#each b.head as h, j (j)}<th><Inlines items={h} /></th>{/each}</tr
        ></thead
      >
      <tbody>
        {#each b.rows as row, j (j)}
          <tr
            >{#each row as cell, k (k)}<td><Inlines items={cell} /></td>{/each}</tr
          >
        {/each}
      </tbody>
    </table>
  {:else if b.t === 'figure'}
    <p class="figure">[{b.alt}]</p>
  {:else if b.t === 'stamp'}
    <Stamp text={b.text} tone="ink" />
  {:else if b.t === 'hr'}
    <hr />
  {/if}
{/each}

<style>
  p,
  blockquote,
  ul,
  ol,
  table {
    margin-block-end: var(--space-4);
  }
  h2,
  h3 {
    font-family: var(--font-display);
    margin-block: var(--space-5) var(--space-3);
  }
  blockquote {
    padding-inline-start: var(--space-4);
    border-inline-start: var(--border-strong) solid var(--line);
  }
  .signature {
    text-align: end;
  }
  .figure {
    color: var(--text-muted);
    font-style: italic;
  }
  hr {
    border: 0;
    border-block-start: var(--border) solid var(--line);
    margin-block: var(--space-5);
  }
  th,
  td {
    padding: var(--space-1) var(--space-2);
    border-block-end: var(--border) solid var(--line);
    text-align: start;
  }
</style>
