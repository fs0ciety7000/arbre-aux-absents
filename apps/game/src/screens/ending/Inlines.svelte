<script lang="ts">
  import type { Inline } from '@arbre/contract';
  import { messages } from '../../messages.fr';
  import Self from './Inlines.svelte';

  /** Rendu texte des inlines du Markdown restreint (aucun HTML brut). */
  interface Props {
    items: Inline[];
  }
  let { items }: Props = $props();
</script>

{#each items as it, i (i)}{#if it.t === 'text'}{it.v}{:else if it.t === 'em'}<em
      ><Self items={it.c} /></em
    >{:else if it.t === 'strong'}<strong><Self items={it.c} /></strong
    >{:else if it.t === 'hand'}<span class="ink-hand"><Self items={it.c} /></span
    >{:else if it.t === 'strike'}<s><Self items={it.c} /></s>{:else if it.t === 'ref'}<span
      class="ref"><Self items={it.c} /></span
    >{:else if it.t === 'redacted'}<span class="redacted" aria-label={messages.pm.reader.redacted}
      >{'█'.repeat(Math.min(40, it.length))}</span
    >{/if}{/each}

<style>
  .redacted {
    letter-spacing: -0.05em;
  }
</style>
