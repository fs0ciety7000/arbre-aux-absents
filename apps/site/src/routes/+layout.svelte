<script lang="ts">
  import '@arbre/ui/styles/index.css';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

{@render children()}

<style>
  :global(body) {
    margin: 0;
    background: var(--canvas);
    color: var(--text);
    font-family: var(--font-body);
  }
</style>
