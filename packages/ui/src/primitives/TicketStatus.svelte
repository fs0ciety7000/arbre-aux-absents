<!--
	Suivi d'un signalement (DESIGN.md §9.36) : frise de tampons sur une fiche de suivi.
	Reçu → Confirmé → En cours → issue : « Corrigé vX » (tampon violet de la vérité établie) ou
	« Classé » (encre neutre) avec sa raison (Résolu, Doublon, Non retenu). Les étapes franchies
	sont tamponnées, l'étape actuelle frappe (`animate`), les suivantes sont des cadres en tirets.
	Côte à côte dès 36 rem de conteneur, en colonne en dessous (360 px).
	Liste ordonnée : étape actuelle en `aria-current="step"`, état de chaque étape lu en texte.
-->
<script lang="ts">
  import Stamp from './Stamp.svelte';
  import {
    getUiStrings,
    type UiTicketClosedReason as ClosedReason,
    type UiTicketStatus as Status,
  } from '../i18n';

  interface Props {
    status: Status;
    /** Version du correctif (titre du jalon), avec `status="fixed"`. */
    fixedIn?: string;
    /** Raison du classement, avec `status="closed"`. */
    closedReason?: ClosedReason;
    /** Le tampon de l'étape actuelle frappe à l'apparition. */
    animate?: boolean;
    /** Nom accessible de la frise (déf. « Suivi du signalement »). */
    label?: string;
    class?: string;
  }

  let {
    status,
    fixedIn,
    closedReason,
    animate = false,
    label: labelProp,
    class: className = '',
  }: Props = $props();

  const ui = getUiStrings();
  const label = $derived(labelProp ?? ui.ticket.label);

  const ORDER = ['received', 'confirmed', 'in-progress', 'outcome'] as const;
  type Step = (typeof ORDER)[number];
  const at = $derived(status === 'fixed' || status === 'closed' ? 3 : ORDER.indexOf(status));

  const steps = $derived(
    ORDER.map((step: Step, i) => {
      const state = i < at ? 'done' : i === at ? 'current' : 'upcoming';
      let text: string;
      let reason: string | undefined;
      let tone: 'ink' | 'established' = 'ink';
      if (step !== 'outcome') text = ui.ticket.status[step];
      else if (status === 'fixed') {
        text = fixedIn ? ui.ticket.fixedIn(fixedIn) : ui.ticket.status.fixed;
        tone = 'established';
      } else if (status === 'closed') {
        text = ui.ticket.status.closed;
        reason = closedReason ? ui.ticket.closedReason[closedReason] : undefined;
      } else text = ui.ticket.outcome;
      return { step, state, text, reason, tone } as const;
    }),
  );
</script>

<div class="ticket-wrap {className}">
  <ol class="ticket" aria-label={label}>
    {#each steps as s, i (s.step)}
      <li class="step {s.state}" aria-current={s.state === 'current' ? 'step' : undefined}>
        <span class="dot" aria-hidden="true"></span>
        {#if s.state === 'upcoming'}
          <span class="slot">{s.text}</span>
          <span class="visually-hidden">, {ui.ticket.state.upcoming}</span>
        {:else}
          <span class="mark">
            <Stamp
              text={s.text}
              tone={s.tone}
              size="s"
              rotate={i % 2 ? 3 : -4}
              animate={animate && s.state === 'current'}
              label="{s.text}{s.reason ? ` · ${s.reason}` : ''}, {ui.ticket.state[s.state]}"
            />
          </span>
          {#if s.reason}<span class="reason" aria-hidden="true">{s.reason}</span>{/if}
        {/if}
      </li>
    {/each}
  </ol>
</div>

<style>
  /* Colonne (téléphone) : un fil vertical relie les pastilles, les tampons à droite. */
  .ticket {
    --dot: 0.75rem;
    --rail: 2px;
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ticket-wrap {
    container-type: inline-size;
  }
  .step {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-3);
    min-block-size: var(--hit);
    padding-inline-start: calc(var(--dot) + var(--space-3));
  }
  .dot {
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: calc(50% - var(--dot) / 2);
    inline-size: var(--dot);
    block-size: var(--dot);
    border: var(--rail) solid var(--line-strong);
    border-radius: var(--radius-pill);
    background: transparent;
  }
  .done .dot,
  .current .dot {
    background: var(--text);
    border-color: var(--text);
  }
  /* Fil vers l'étape suivante : plein si franchi, en tirets sinon */
  .step:not(:last-child)::after {
    content: '';
    position: absolute;
    inset-inline-start: calc(var(--dot) / 2 - var(--rail) / 2);
    inset-block-start: calc(50% + var(--dot) / 2 + 2px);
    block-size: calc(100% - var(--dot) + var(--space-3) - 4px);
    border-inline-start: var(--rail) dashed var(--line-strong);
  }
  .done:not(:last-child)::after {
    border-inline-start-style: solid;
    border-color: var(--text-muted);
  }
  .mark {
    display: inline-flex;
    padding-block: var(--space-1);
  }
  /* À venir : cadre de tampon vide en tirets, libellé en clair */
  .slot {
    display: inline-flex;
    padding: var(--space-0-5) var(--space-2);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-xs);
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .reason {
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
  }

  /* Ligne (≥ 36 rem de conteneur) : pastilles sur un fil horizontal, tampons dessous */
  @container (min-width: 36rem) {
    .ticket {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--space-2);
    }
    .step {
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding-inline-start: 0;
      padding-block-start: calc(var(--dot) + var(--space-3));
      text-align: center;
    }
    .dot {
      inset-inline-start: calc(50% - var(--dot) / 2);
      inset-block-start: 0;
    }
    .step:not(:last-child)::after {
      inset-block-start: calc(var(--dot) / 2 - var(--rail) / 2);
      inset-inline-start: calc(50% + var(--dot) / 2 + 2px);
      inline-size: calc(100% - var(--dot) + var(--space-2) - 4px);
      block-size: 0;
      border-inline-start: 0;
      border-block-start: var(--rail) dashed var(--line-strong);
    }
    .done:not(:last-child)::after {
      border-block-start-style: solid;
      border-color: var(--text-muted);
    }
  }

  @media (forced-colors: active) {
    .dot,
    .step::after,
    .slot {
      border-color: CanvasText;
    }
    .done .dot,
    .current .dot {
      background: CanvasText;
    }
  }
</style>
