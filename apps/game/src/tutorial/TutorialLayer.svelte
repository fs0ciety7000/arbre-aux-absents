<!--
  Tutoriel en bulles (GAME_DESIGN §15, ECRANS §5) : une note de service à la fois, posée près de
  l'élément réel qu'elle commente, au moment où le geste devient utile. Jamais modale : le focus
  reste où le joueur l'a mis, la note est annoncée par la région live polie de l'application,
  Échap / B (retour) la range, « Passer le tutoriel » est toujours là.
-->
<script lang="ts">
  import { Coachmark } from '@arbre/ui';
  import { onMount } from 'svelte';
  import { input } from '../input/device.svelte';
  import { announcer } from '../lib/game/announcer.svelte';
  import type { AppController } from '../lib/game/app.svelte';
  import type { GameStoreImpl } from '../lib/game/store.svelte';
  import { viewport } from '../lib/game/viewport.svelte';
  import { messages } from '../messages.fr';
  import type { TutorialScreen, TutorialStep } from './steps';
  import { TutorialController } from './tutorial.svelte';

  interface Props {
    app: AppController;
    game: GameStoreImpl;
    /** Écran hôte : le Bureau (déf.) ou le rapport final. */
    screen?: TutorialScreen;
  }
  let { app, game, screen = 'desk' }: Props = $props();
  const m = messages.tutorial;

  /** Délai avant de poser une note : le geste en cours se termine d'abord. */
  const SETTLE_MS = 700;

  // svelte-ignore state_referenced_locally
  const tutorial = new TutorialController(app, game, screen);

  // `evaluate` écrit le profil (notes passées en silence) : effet, pas dérivé.
  // eslint-disable-next-line svelte/prefer-writable-derived
  let candidate = $state<TutorialStep | null>(null);
  $effect(() => {
    candidate = tutorial.evaluate();
  });

  $effect(() => {
    const next = candidate;
    if (next === tutorial.current) return;
    if (next === null) {
      tutorial.show(null);
      return;
    }
    const t = setTimeout(() => tutorial.show(next), SETTLE_MS);
    return () => clearTimeout(t);
  });

  const device = $derived(input.glyphs(app.settings.inputGlyphs));
  const current = $derived(tutorial.current);
  const text = $derived(current ? current.text(tutorial.context(), device) : '');

  // Annonce polie à l'apparition de chaque note (pas à chaque changement de périphérique).
  let announced: string | null = null;
  $effect(() => {
    const id = current?.id ?? null;
    if (id && id !== announced) announcer.say(m.announce(text));
    announced = id;
  });

  function visible(el: Element | null): el is HTMLElement {
    if (!(el instanceof HTMLElement)) return false;
    if (el.checkVisibility && !el.checkVisibility({ visibilityProperty: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  /** Première cible visible de la note (relue à chaque image par la bulle). */
  function anchor(): HTMLElement | null {
    const step = tutorial.current;
    if (!step) return null;
    for (const sel of step.anchors(tutorial.context())) {
      for (const el of document.querySelectorAll(sel)) if (visible(el)) return el;
    }
    return null;
  }

  /** Hauteur de la barre d'onglets du téléphone : une note posée en bas reste au-dessus. */
  let inset = $state(0);
  $effect(() => {
    void current;
    void viewport.single;
    inset = viewport.single
      ? (document.querySelector('[data-tour="tabbar"]')?.getBoundingClientRect().height ?? 0)
      : 0;
  });

  /**
   * Le focus ne doit jamais tomber dans le vide : s'il était sur un bouton de la note, il revient
   * sur la cible (si elle est focalisable) ou sur la zone de contenu.
   */
  function keepFocus(run: () => void) {
    const inside = document.activeElement?.closest('[data-coachmark]') !== null;
    const target = inside ? anchor() : null;
    run();
    if (!inside) return;
    const focusable = target?.matches('button, [href], input, [tabindex]') ? target : null;
    (focusable ?? document.getElementById('contenu'))?.focus();
  }

  function dismiss() {
    keepFocus(() => tutorial.dismiss());
  }
  function skip() {
    keepFocus(() => tutorial.skip());
    announcer.say(m.skipped);
  }

  onMount(() => {
    game.backIntercept = () => {
      if (!tutorial.current) return false;
      dismiss();
      return true;
    };
    return () => {
      game.backIntercept = null;
    };
  });
</script>

{#if current}
  {#key current.id}
    <Coachmark
      id="tutorial-note"
      {anchor}
      kicker={m.kicker}
      {text}
      actionLabel={m.ok}
      onaction={dismiss}
      skipLabel={m.skip}
      onskip={skip}
      bottomInset={inset}
    />
  {/key}
{/if}
