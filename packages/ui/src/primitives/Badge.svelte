<!--
	Pastille (DESIGN.md §9.14) : type de document, état d'un lieu, compteur, « nouveau ».
	Non interactive. Le ton est toujours doublé d'un texte ou d'une icône.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import type { IconName } from './icons';

  interface Props {
    tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'established';
    variant?: 'soft' | 'solid' | 'outline';
    iconName?: IconName;
    /** Point de tête (non lu, nouveau). */
    dot?: boolean;
    children?: Snippet;
    class?: string;
  }

  let {
    tone = 'neutral',
    variant = 'soft',
    iconName,
    dot = false,
    children,
    class: className = '',
  }: Props = $props();
</script>

<span class="badge {tone} {variant} {className}">
  {#if dot}<span class="dot" aria-hidden="true"></span>{/if}
  {#if iconName}<Icon name={iconName} size="1em" />{/if}
  {@render children?.()}
</span>

<style>
  .badge {
    --tone: var(--text-muted);
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 1.5rem;
    padding: 0 var(--space-2);
    border-radius: var(--radius-pill);
    font-size: var(--step--1);
    font-weight: var(--weight-semibold);
    line-height: 1;
    white-space: nowrap;
    vertical-align: middle;
  }
  .accent {
    --tone: var(--accent);
  }
  .success {
    --tone: var(--success);
  }
  .warning {
    --tone: var(--warning);
  }
  .danger {
    --tone: var(--danger);
  }
  .info {
    --tone: var(--info);
  }
  .established {
    --tone: var(--established);
  }
  .soft {
    color: var(--tone);
    background: var(--surface-3);
  }
  .neutral.soft {
    color: var(--text-muted);
  }
  .outline {
    color: var(--tone);
    box-shadow: inset 0 0 0 var(--border) currentColor;
  }
  .solid {
    background: var(--tone);
    color: var(--canvas);
  }
  .accent.solid {
    color: var(--accent-contrast);
  }
  .established.solid {
    color: var(--established-contrast);
  }
  .dot {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: var(--radius-pill);
    background: currentColor;
  }
  @media (forced-colors: active) {
    .badge {
      border: 1px solid CanvasText;
    }
  }
</style>
