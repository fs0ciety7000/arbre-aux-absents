<!--
  Emblème du jeu : un arbre de quatre générations dessiné au trait de plume (currentColor),
  dont une case reste vide, en pointillé : l'absent. Décoratif (aria-hidden) sauf `label`.
-->
<script lang="ts">
  let { size = '1.75em', label }: { size?: string; label?: string } = $props();

  const gen3 = [6, 18, 30, 42];
</script>

<svg
  class="tree-mark"
  viewBox="0 0 48 48"
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
  focusable="false"
>
  <path d="M24 39v-6M12 33h24M12 33v-5M36 33v-5M12 23v-3M6 20h12M36 23v-3M30 20h12" />
  <path d="M6 20v-3M18 20v-3M30 20v-3M42 20v-3" />
  {#each gen3 as x (x)}
    <path d="M{x} 13v-2M{x - 3} 11h6M{x - 3} 11v-2M{x + 3} 11v-2" stroke-width="1.25" />
  {/each}
  <circle cx="24" cy="42.5" r="3.25" fill="currentColor" />
  <circle cx="12" cy="25.5" r="2.5" />
  <circle cx="36" cy="25.5" r="2.5" />
  {#each gen3 as x (x)}
    <circle cx={x} cy="15" r="2" />
  {/each}
  <circle cx="3" cy="7" r="1.25" fill="currentColor" stroke="none" />
  <circle cx="9" cy="7" r="1.25" fill="currentColor" stroke="none" />
  <circle cx="15" cy="7" r="1.25" fill="currentColor" stroke="none" />
  <circle cx="21" cy="7" r="1.25" fill="currentColor" stroke="none" />
  <circle cx="27" cy="7" r="1.25" fill="currentColor" stroke="none" />
  <circle cx="33" cy="7" r="1.6" stroke-width="1" stroke-dasharray="1.2 1.2" />
  <circle cx="39" cy="7" r="1.25" fill="currentColor" stroke="none" />
  <circle cx="45" cy="7" r="1.25" fill="currentColor" stroke="none" />
</svg>

<style>
  .tree-mark {
    flex: none;
    display: inline-block;
    vertical-align: middle;
  }
</style>
