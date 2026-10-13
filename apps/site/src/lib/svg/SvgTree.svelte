<!-- Rendu récursif d'un arbre SVG (voir parse.ts) : aucun HTML injecté, tout passe par Svelte. -->
<script lang="ts">
  import type { SvgChild } from './parse';
  import SvgTree from './SvgTree.svelte';

  let { nodes }: { nodes: SvgChild[] } = $props();
</script>

{#each nodes as node, i (i)}
  {#if typeof node === 'string'}{node}{:else}<svelte:element this={node.t} {...node.a}
      >{#if node.c.length}<SvgTree nodes={node.c} />{/if}</svelte:element
    >{/if}
{/each}
