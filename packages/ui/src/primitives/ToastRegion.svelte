<!--
	Région des notifications (DESIGN.md §9.12), à monter une fois par application.
	Desktop : bas droite ; téléphone : au-dessus de la barre d'onglets.
-->
<script lang="ts">
  import Toast from './Toast.svelte';
  import { dismissToast, getToasts } from './toasts.svelte';

  interface Props {
    /** Décalage bas (ex. hauteur de la barre d'onglets du téléphone). */
    offset?: string;
    label?: string;
  }
  let { offset = '0px', label = 'Notifications' }: Props = $props();
  const toasts = $derived(getToasts());
</script>

<section class="region" aria-label={label} aria-live="polite" style:--offset={offset}>
  {#each toasts as t (t.id)}
    <Toast
      tone={t.tone}
      title={t.title}
      message={t.message}
      action={t.action}
      timeout={t.timeout}
      live="none"
      onclose={() => dismissToast(t.id)}
    />
  {/each}
</section>

<style>
  .region {
    position: fixed;
    inset-inline-end: var(--gutter);
    inset-block-end: calc(var(--gutter) + var(--offset) + env(safe-area-inset-bottom));
    z-index: var(--z-toast);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-2);
    pointer-events: none;
  }
  .region > :global(*) {
    pointer-events: auto;
  }
  @media (max-width: 37.4375rem) {
    .region {
      inset-inline: var(--gutter);
      align-items: stretch;
    }
  }
</style>
