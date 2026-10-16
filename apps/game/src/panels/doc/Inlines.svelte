<!--
  Inlines : rendu récursif d'un conteneur de texte préparé par `layoutInlines` (doc-layout.ts).
  Uniquement des nœuds texte : aucun HTML du contenu n'est interprété.
-->
<script lang="ts">
  import { MarkFrame } from '@arbre/ui';
  import { svgContent } from '@arbre/map/svelte';
  import type { RNode } from '../lib/doc-layout';
  import { pm } from '../messages';
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

  function markKey(e: KeyboardEvent, portrait: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      opts.onmark?.(portrait, e.currentTarget as HTMLElement);
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
  {:else if n.t === 'mark'}
    {@const alt = opts.markAlt?.(n.portrait) ?? ''}
    {#if opts.mode === 'transcript'}
      <!-- Transcription : la marque devient sa description, entre crochets (AFFAIRE-3 §1.6). -->
      <span class="mark-t" data-mark={n.portrait}>{pm.marks.transcript(alt)}</span>
    {:else if opts.decorative || !opts.onmark}
      <span class="mark-i" aria-hidden={opts.decorative ? 'true' : undefined}
        ><MarkFrame size="inline" alt={opts.decorative ? undefined : alt}
          ><span use:svgContent={opts.markSvg?.(n.portrait) ?? null}></span></MarkFrame
        ></span
      >
    {:else}
      <!-- Original : le dessin, nommé par sa description ; cible ≥ 44 px, ouvre l'agrandissement. -->
      <span
        class="mark-i mark-hit"
        role="button"
        tabindex="0"
        data-mark={n.portrait}
        data-verb="look"
        aria-label={pm.marks.inlineLabel(alt)}
        aria-haspopup="dialog"
        title={alt}
        onclick={(e) => opts.onmark?.(n.portrait, e.currentTarget)}
        onkeydown={(e) => markKey(e, n.portrait)}
        ><MarkFrame size="inline"
          ><span use:svgContent={opts.markSvg?.(n.portrait) ?? null}></span></MarkFrame
        ></span
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
  /* Marque dans le texte (DESIGN §6.12) : 2,5 em de haut, posée sur la ligne, jamais sélectionnée
     (aucun caractère : les surlignages l'ignorent). */
  .mark-i {
    display: inline-grid;
    place-items: center;
    vertical-align: middle;
    -webkit-user-select: none;
    user-select: none;
  }
  .mark-hit {
    min-inline-size: var(--hit);
    min-block-size: var(--hit);
    border-radius: var(--radius-xs);
    cursor: inherit;
  }
  .mark-t {
    font-family: var(--font-type);
    -webkit-user-select: none;
    user-select: none;
  }
</style>
