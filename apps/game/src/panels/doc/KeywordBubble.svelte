<!--
  Bulle d'action d'un mot-clé (DESIGN §2) : Rechercher, Voir au carnet, Épingler, Utiliser
  dans l'arbre — toujours dans cet ordre, mêmes icônes que les curseurs. Menu ARIA : flèches,
  Début/Fin, Échap rend le focus au mot-clé.
-->
<script lang="ts" module>
  import type { IconName } from '@arbre/ui';

  export interface BubbleItem {
    id: string;
    label: string;
    icon: IconName;
    verb: 'look' | 'pin' | 'use';
    disabled?: boolean;
    run: () => void;
  }
</script>

<script lang="ts">
  import { Icon } from '@arbre/ui';
  import { onMount, tick } from 'svelte';

  interface Props {
    label: string;
    items: BubbleItem[];
    /** Position dans le parent positionné (px). */
    x: number;
    y: number;
    onclose: (refocus: boolean) => void;
  }
  let { label, items, x, y, onclose }: Props = $props();

  let menu: HTMLDivElement | undefined = $state();

  const buttons = () => [...(menu?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];

  onMount(() => {
    void tick().then(() => buttons()[0]?.focus());
    const away = (e: PointerEvent) => {
      if (menu && !menu.contains(e.target as Node)) onclose(false);
    };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  });

  function onkeydown(e: KeyboardEvent) {
    const list = buttons();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | null = null;
    if (e.key === 'ArrowDown') next = (i + 1) % list.length;
    else if (e.key === 'ArrowUp') next = (i - 1 + list.length) % list.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = list.length - 1;
    else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onclose(true);
      return;
    } else if (e.key === 'Tab') {
      onclose(false);
      return;
    }
    if (next === null) return;
    e.preventDefault();
    list[next]?.focus();
  }
</script>

<div
  bind:this={menu}
  class="bubble"
  role="menu"
  tabindex="-1"
  aria-label={label}
  style:left="{x}px"
  style:top="{y}px"
  {onkeydown}
>
  {#each items as item (item.id)}
    <button
      type="button"
      role="menuitem"
      data-verb={item.verb}
      aria-disabled={item.disabled || undefined}
      onclick={() => {
        if (item.disabled) return;
        item.run();
        onclose(false);
      }}
    >
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </button>
  {/each}
</div>

<style>
  .bubble {
    position: absolute;
    z-index: var(--z-popover);
    display: grid;
    min-inline-size: 14rem;
    max-inline-size: min(20rem, calc(100% - var(--space-4)));
    padding: var(--space-1);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--surface-1);
    color: var(--text);
    box-shadow: var(--shadow-2);
    font-family: var(--font-ui);
  }
  button {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    min-block-size: var(--hit);
    padding: var(--space-2) var(--space-3);
    border: 0;
    border-radius: var(--radius-s);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
  }
  button:hover,
  button:focus-visible {
    background: var(--accent-tint);
  }
  button[aria-disabled='true'] {
    color: var(--text-faint);
  }
</style>
