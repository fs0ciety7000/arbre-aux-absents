<script lang="ts">
  import type { Inline } from '@arbre/contract';
  import { MarkFrame } from '@arbre/ui';
  import { svgContent } from '@arbre/map/svelte';
  import { getApp } from '../../lib/game/context';
  import { messages } from '../../messages.fr';
  import { portraitSvg } from '../../panels/lib/assets.svelte';
  import Self from './Inlines.svelte';

  /** Rendu texte des inlines du Markdown restreint (aucun HTML brut). */
  interface Props {
    items: Inline[];
  }
  let { items }: Props = $props();

  const app = getApp();
  /** Marque (`::mark`, affaire 3) : dessin nommé par sa description verbale. */
  const markOf = (id: string) => {
    const c = app.game?.content;
    const p = c && Object.hasOwn(c.portraits, id) ? c.portraits[id] : undefined;
    return c && p ? { alt: p.alt, svg: portraitSvg(c, id) } : null;
  };
</script>

{#each items as it, i (i)}{#if it.t === 'text'}{it.v}{:else if it.t === 'em'}<em
      ><Self items={it.c} /></em
    >{:else if it.t === 'strong'}<strong><Self items={it.c} /></strong
    >{:else if it.t === 'hand'}<span class="ink-hand"><Self items={it.c} /></span
    >{:else if it.t === 'strike'}<s><Self items={it.c} /></s>{:else if it.t === 'ref'}<span
      class="ref"><Self items={it.c} /></span
    >{:else if it.t === 'redacted'}<span class="redacted" aria-label={messages.pm.reader.redacted}
      >{'█'.repeat(Math.min(40, it.length))}</span
    >{:else if it.t === 'mark'}{@const m = markOf(it.portrait)}{#if m}<span class="mark"
        ><MarkFrame size="inline" alt={m.alt}
          ><span use:svgContent={m.svg ?? null}></span></MarkFrame
        ></span
      >{/if}{/if}{/each}

<style>
  .redacted {
    letter-spacing: -0.05em;
  }
  .mark {
    display: inline-block;
    vertical-align: middle;
  }
</style>
