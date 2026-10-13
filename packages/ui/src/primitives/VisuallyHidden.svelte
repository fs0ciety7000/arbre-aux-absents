<!--
	Texte réservé aux lecteurs d'écran (DESIGN.md §9.18) : titres cachés, « nouvel onglet »,
	verbalisation des pastilles. `focusable` : redevient visible au focus (lien d'évitement).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLElement> {
    as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4';
    children?: Snippet;
  }

  let { as = 'span', children, class: className = '', ...rest }: Props = $props();
</script>

<svelte:element this={as} {...rest} class="visually-hidden {className}">
  {@render children?.()}
</svelte:element>

<style>
  .visually-hidden:not(:focus):not(:active):not(:focus-within) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
</style>
