<!--
	Notification (DESIGN.md §9.12). Ton doublé d'une icône. Fermeture auto suspendue au
	survol et au focus ; les tons `danger` et `warning` restent jusqu'à fermeture.
	Rendu en général par <ToastRegion /> ; utilisable seul (bandeau de sauvegarde).
-->
<script lang="ts">
  import Icon from './Icon.svelte';
  import IconButton from './IconButton.svelte';
  import type { IconName } from './icons';
  import type { ToastTone } from './toasts.svelte';

  interface Props {
    tone?: ToastTone;
    title: string;
    message?: string;
    action?: { label: string; onclick: () => void };
    /** ms ; 0 = pas de fermeture automatique. */
    timeout?: number;
    closeLabel?: string;
    /** Rôle live : `auto` = alert pour danger, status sinon ; `none` dans une région déjà live. */
    live?: 'auto' | 'none';
    onclose?: () => void;
  }

  let {
    tone = 'info',
    title,
    message,
    action,
    timeout = 0,
    closeLabel = 'Fermer la notification',
    live = 'auto',
    onclose,
  }: Props = $props();

  const role = $derived(tone === 'danger' ? 'alert' : live === 'auto' ? 'status' : undefined);

  const icons: Record<ToastTone, IconName> = {
    info: 'info',
    success: 'check',
    warning: 'warning',
    danger: 'danger',
    established: 'stamp',
  };

  let paused = $state(false);
  // Temps restant : repart de `timeout` quand il change, décrémenté à chaque pause.
  let remaining = $derived(timeout);

  $effect(() => {
    if (!timeout || paused || !onclose) return;
    const started = performance.now();
    const left = remaining;
    const t = setTimeout(() => onclose?.(), left);
    return () => {
      clearTimeout(t);
      remaining = Math.max(0, left - (performance.now() - started));
    };
  });
</script>

<div
  class="toast {tone}"
  data-surface="paper"
  {role}
  onpointerenter={() => (paused = true)}
  onpointerleave={() => (paused = false)}
  onfocusin={() => (paused = true)}
  onfocusout={() => (paused = false)}
>
  <span class="glyph"><Icon name={icons[tone]} size="1.5rem" /></span>
  <div class="texts">
    <p class="title">{title}</p>
    {#if message}<p class="message">{message}</p>{/if}
  </div>
  {#if action}
    <button type="button" class="action" onclick={action.onclick}>{action.label}</button>
  {/if}
  {#if onclose}
    <IconButton icon="close" label={closeLabel} tooltip={false} onclick={onclose} />
  {/if}
</div>

<style>
  .toast {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    width: min(26rem, calc(100vw - 2 * var(--gutter)));
    padding: var(--space-3) var(--space-2) var(--space-3) var(--space-4);
    /* v2 : bande de télégramme (papier) glissée sur le bureau, de biais */
    background: var(--surface-1);
    color: var(--text);
    border: 0;
    border-inline-start: 5px solid var(--tone);
    border-radius: var(--radius-paper);
    box-shadow: var(--shadow-lifted);
    --tone: var(--info);
    opacity: 1;
    transform: rotate(-0.6deg);
    transition:
      opacity var(--dur-fade) var(--ease-out),
      transform var(--dur-deal) var(--ease-deal);
  }
  @starting-style {
    .toast {
      opacity: 0;
      transform: translateX(var(--deal-distance)) rotate(var(--deal-rotate));
    }
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
  .established {
    --tone: var(--established);
  }
  .glyph {
    display: inline-flex;
    padding-block-start: var(--space-0-5);
    color: var(--tone);
  }
  .texts {
    flex: 1;
    min-width: 0;
    padding-block: var(--space-1);
  }
  .title {
    font-family: var(--font-type);
    font-weight: var(--weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-label);
  }
  .message {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .action {
    min-height: var(--hit);
    padding: 0 var(--space-3);
    border: 0;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--accent);
    font-weight: var(--weight-semibold);
    cursor: pointer;
  }
  .action:hover {
    background: var(--accent-tint);
  }
  .action:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  @media (forced-colors: active) {
    .toast {
      border-inline-start-color: CanvasText;
    }
  }
</style>
