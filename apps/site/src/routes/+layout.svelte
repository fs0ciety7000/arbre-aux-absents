<script lang="ts">
  import '@arbre/ui/tokens.css';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

{@render children()}

<style>
  :global(body) {
    margin: 0;
    background: var(--color-canvas);
    color: var(--color-text);
    font-family: var(--font-body);
  }
</style>
