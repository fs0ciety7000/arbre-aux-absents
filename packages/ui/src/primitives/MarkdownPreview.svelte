<!--
	Rendu de l'aperçu Markdown (DESIGN.md §9.37), à partir de l'arbre de `parseMarkdown` : éléments
	Svelte seulement, jamais de HTML injecté. Un lien est montré (texte souligné et adresse) mais
	jamais cliquable : l'aperçu ne doit faire sortir personne du formulaire.
-->
<script lang="ts">
  import type { MdBlock, MdInline } from '../markdown';
  import Self from './MarkdownPreview.svelte';

  interface Props {
    blocks: MdBlock[];
  }
  let { blocks }: Props = $props();
</script>

{#snippet inline(nodes: MdInline[])}
  {#each nodes as node, i (i)}
    {#if node.kind === 'text'}{node.text}{:else if node.kind === 'break'}<br
      />{:else if node.kind === 'code'}<code class="md-code">{node.text}</code
      >{:else if node.kind === 'strong'}<strong>{@render inline(node.children)}</strong
      >{:else if node.kind === 'em'}<em>{@render inline(node.children)}</em
      >{:else if node.kind === 'link'}<span class="md-link"
        ><span class="md-link-text">{@render inline(node.children)}</span>
        <span class="md-link-url">({node.href})</span></span
      >{/if}
  {/each}
{/snippet}

{#each blocks as block, i (i)}
  {#if block.kind === 'paragraph'}
    <p>{@render inline(block.children)}</p>
  {:else if block.kind === 'code'}
    <pre class="md-pre"><code>{block.text}</code></pre>
  {:else if block.kind === 'list'}
    {#if block.ordered}
      <ol start={block.start}>
        {#each block.items as item, j (j)}<li>{@render inline(item)}</li>{/each}
      </ol>
    {:else}
      <ul>
        {#each block.items as item, j (j)}<li>{@render inline(item)}</li>{/each}
      </ul>
    {/if}
  {:else if block.kind === 'quote'}
    <blockquote><Self blocks={block.children} /></blockquote>
  {/if}
{/each}

<style>
  p,
  ul,
  ol,
  blockquote,
  .md-pre {
    margin: 0 0 var(--space-2);
  }
  ul,
  ol {
    padding-inline-start: var(--space-6);
  }
  blockquote {
    padding-inline-start: var(--space-3);
    border-inline-start: var(--border-strong) solid var(--line-strong);
    color: var(--text-muted);
  }
  .md-code,
  .md-pre {
    font-family: var(--font-type);
    font-size: var(--step--1);
  }
  .md-code {
    padding: 0 var(--space-1);
    border-radius: var(--radius-xs);
    background: var(--surface-1);
  }
  .md-pre {
    padding: var(--space-2) var(--space-3);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-xs);
    background: var(--surface-1);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .md-link-text {
    text-decoration: underline;
    text-underline-offset: 2px;
    color: var(--accent);
  }
  .md-link-url {
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
    overflow-wrap: anywhere;
  }
</style>
