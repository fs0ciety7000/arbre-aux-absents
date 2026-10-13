<!-- Logo-titre du jeu : emblème + nom en Literata 600 (DESIGN §5.4). -->
<script lang="ts">
  import TreeMark from './TreeMark.svelte';

  let { size = 'm' }: { size?: 's' | 'm' | 'l' } = $props();
</script>

<span class="wordmark {size}">
  <span class="mark"><TreeMark size="1.6em" /></span>
  <span class="name">L’Arbre <span class="aux">aux</span> absents</span>
</span>

<style>
  .wordmark {
    display: inline-flex;
    align-items: center;
    gap: 0.45em;
    font-family: var(--font-display);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-tight);
    letter-spacing: -0.01em;
    color: var(--text);
    white-space: nowrap;
  }
  .s {
    font-size: var(--step-1);
  }
  .m {
    font-size: var(--step-2);
  }
  .l {
    font-size: var(--step-4);
  }
  .mark {
    display: inline-flex;
    color: var(--accent);
  }
  .aux {
    font-weight: var(--weight-regular);
  }
</style>
