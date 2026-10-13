<!--
	Info-bulle (DESIGN.md §9.13) : complément au survol ET au focus clavier, après
	--tooltip-delay ; Échap la masque. Jamais d'information indispensable (absente au toucher).
	Le snippet reçoit les attributs à poser sur le déclencheur :
	<Tooltip text="…">{#snippet children(attrs)}<button {...attrs}>…</button>{/snippet}</Tooltip>
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    text: string;
    placement?: 'top' | 'bottom';
    children: Snippet<[{ 'aria-describedby': string }]>;
    id?: string;
  }

  let {
    text,
    placement = 'top',
    children,
    id = `tip-${Math.random().toString(36).slice(2, 8)}`,
  }: Props = $props();

  let visible = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function delayMs(): number {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--tooltip-delay');
    return Number.parseFloat(raw) || 400;
  }
  function show(immediate = false) {
    clearTimeout(timer);
    if (immediate) visible = true;
    else timer = setTimeout(() => (visible = true), delayMs());
  }
  function hide() {
    clearTimeout(timer);
    visible = false;
  }
  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && visible) {
      e.stopPropagation();
      hide();
    }
  }
  function onfocusin(e: FocusEvent) {
    if ((e.target as HTMLElement).matches?.(':focus-visible')) show(true);
  }
</script>

<span
  class="wrap"
  role="presentation"
  onpointerenter={(e) => e.pointerType === 'mouse' && show()}
  onpointerleave={hide}
  {onfocusin}
  onfocusout={hide}
  {onkeydown}
>
  {@render children({ 'aria-describedby': id })}
  <span {id} role="tooltip" class="tip {placement}" class:visible>{text}</span>
</span>

<style>
  .wrap {
    position: relative;
    display: inline-flex;
  }
  .tip {
    position: absolute;
    inset-inline-start: 50%;
    z-index: var(--z-tooltip);
    max-width: min(18rem, 80vw);
    width: max-content;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-xs);
    background: var(--text);
    color: var(--canvas);
    font-size: var(--step--1);
    line-height: var(--leading-snug);
    pointer-events: none;
    opacity: 0;
    transform: translate(-50%, var(--ty));
    transition:
      opacity var(--dur-fade-fast) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }
  .top {
    inset-block-end: calc(100% + var(--space-2));
    --ty: calc(var(--rise) / 2);
  }
  .bottom {
    inset-block-start: calc(100% + var(--space-2));
    --ty: calc(var(--rise) / -2);
  }
  .visible {
    opacity: 1;
    --ty: 0px;
  }
  @media (forced-colors: active) {
    .tip {
      border: 1px solid CanvasText;
    }
  }
</style>
