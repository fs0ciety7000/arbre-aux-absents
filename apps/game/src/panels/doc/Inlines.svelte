<!--
  Inlines : rendu récursif d'un conteneur de texte préparé par `layoutInlines` (doc-layout.ts).
  Uniquement des nœuds texte : aucun HTML du contenu n'est interprété.
-->
<script lang="ts">
  import type { RNode } from '../lib/doc-layout';
  import { BODY_LABELS, type BodyOptions } from './context';
  import Self from './Inlines.svelte';

  interface Props {
    nodes: RNode[];
    opts: BodyOptions;
  }
  let { nodes, opts }: Props = $props();

  function keydown(e: KeyboardEvent, kw: string, label: string) {
    if (
      e.key === 'Enter' ||
      e.key === ' ' ||
      e.key === 'ContextMenu' ||
      (e.key === 'F10' && e.shiftKey)
    ) {
      e.preventDefault();
      opts.onkeyword?.(kw, label, e.currentTarget as HTMLElement);
    }
  }
</script>

{#each nodes as n, i (i)}
  {#if n.t === 'text'}
    {#each n.segments as s (s.start)}
      {#if s.color !== null}<mark class="hl-{s.color}" data-o={s.start} data-hl={s.index}
          >{s.v}</mark
        >{:else}<span data-o={s.start}>{s.v}</span>{/if}
    {/each}
  {:else if n.t === 'em'}
    <em><Self nodes={n.c} {opts} /></em>
  {:else if n.t === 'strong'}
    <strong><Self nodes={n.c} {opts} /></strong>
  {:else if n.t === 'strike'}
    <s><Self nodes={n.c} {opts} /></s>
  {:else if n.t === 'hand'}
    <span class={opts.mode === 'original' ? 'ink-hand' : 'hand-t'}><Self nodes={n.c} {opts} /></span
    >
  {:else if n.t === 'redacted'}
    {#if opts.mode === 'transcript'}
      <span class="redacted-t">[{BODY_LABELS.redacted}]</span>
    {:else}
      <span class="redacted" role="img" aria-label={BODY_LABELS.redacted}
        ><span aria-hidden="true">{'█'.repeat(n.length)}</span></span
      >
    {/if}
  {:else if n.t === 'ref'}
    {#if opts.decorative}
      <span class="kw" data-state={opts.kwState(n.keyword)}><Self nodes={n.c} {opts} /></span>
    {:else}
      <span
        class="kw"
        data-state={opts.kwState(n.keyword)}
        data-keyword={n.keyword}
        data-verb="look"
        role="button"
        tabindex="0"
        aria-haspopup="menu"
        aria-describedby={opts.kwDescription?.(opts.kwState(n.keyword))}
        draggable={opts.onkeyworddrag ? 'true' : undefined}
        ondragstart={(e) => opts.onkeyworddrag?.(n.keyword, n.label, e)}
        onclick={(e) => opts.onkeyword?.(n.keyword, n.label, e.currentTarget)}
        oncontextmenu={(e) => {
          e.preventDefault();
          opts.onkeyword?.(n.keyword, n.label, e.currentTarget);
        }}
        onkeydown={(e) => keydown(e, n.keyword, n.label)}><Self nodes={n.c} {opts} /></span
      >
    {/if}
  {/if}
{/each}

<style>
  .redacted {
    display: inline-block;
    background: var(--text);
    color: var(--text);
    border-radius: var(--radius-xs);
    line-height: 1.1;
    letter-spacing: -0.05em;
    user-select: none;
  }
  .redacted-t,
  .hand-t {
    font-style: italic;
  }
  .redacted-t {
    color: var(--text-muted);
  }
  s {
    text-decoration-thickness: 2px;
  }
</style>
