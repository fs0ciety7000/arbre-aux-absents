<!--
  SVG d'art inline (carte, portrait, logo) rendu depuis un arbre analysé au prérendu.
  Accessibilité : `label` → role="img" + aria-label ; sinon décoratif (aria-hidden).
-->
<script lang="ts">
  import type { SvgNode } from './parse';
  import SvgTree from './SvgTree.svelte';

  interface Props {
    node: SvgNode;
    label?: string;
    /** Remplace le viewBox source (recadrage). */
    viewBox?: string;
    class?: string;
    /** Ajoute la classe d'art racine (`.art`). */
    art?: boolean;
  }

  let { node, label, viewBox, class: className = '', art = true }: Props = $props();

  const attrs = $derived.by(() => {
    const { id: _id, class: cls = '', role: _role, ...rest } = node.a;
    const all = [...cls.split(/\s+/), ...className.split(/\s+/), art ? 'art' : ''].filter(Boolean);
    const classes = all.filter((c, i) => all.indexOf(c) === i).join(' ');
    return { ...rest, ...(viewBox ? { viewBox } : {}), class: classes };
  });
</script>

{#if label}
  <svg {...attrs} role="img" aria-label={label} focusable="false"><SvgTree nodes={node.c} /></svg>
{:else}
  <svg {...attrs} aria-hidden="true" focusable="false"><SvgTree nodes={node.c} /></svg>
{/if}
