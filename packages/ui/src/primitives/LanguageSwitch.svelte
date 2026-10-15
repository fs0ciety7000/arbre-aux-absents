<!--
	Sélecteur de langue (DESIGN.md §9.35) : une réglette où la langue choisie est une étiquette
	d'étiqueteuse collée (bande bleue en relief), les autres de simples capitales Oswald.
	Chaque nom est écrit **dans sa langue** (« Français », « English ») et porte son `lang`.
	- Sans `hrefs` : groupe radio natif (`fieldset`) : Tab y entre une fois, flèches pour changer
	  (écran titre, Options du jeu).
	- Avec `hrefs` : liens `hreflang` dans un `nav`, la langue courante en `aria-current` (en-tête
	  du site : changer de langue, c'est changer de page).
	`short` : codes FR / EN à l'écran (en-tête à 360 px), nom complet toujours lu.
-->
<script lang="ts">
  import { LANGUAGE_NAMES, getUiStrings, type UiLocale } from '../i18n';

  interface Props {
    value?: UiLocale;
    onchange?: (locale: UiLocale) => void;
    locales?: readonly UiLocale[];
    /** Mode lien : URL de la page courante dans chaque langue. */
    hrefs?: Partial<Record<UiLocale, string>>;
    /** Codes courts à l'écran (le nom complet reste lu). */
    short?: boolean;
    /** Légende (déf. « Langue » / “Language”), masquée sauf `labelVisible`. */
    label?: string;
    labelVisible?: boolean;
    /** Nom du groupe radio. */
    name?: string;
    class?: string;
  }

  let {
    value = $bindable('fr'),
    onchange,
    locales = ['fr', 'en'],
    hrefs,
    short = false,
    label: labelProp,
    labelVisible = false,
    name = `lang-${Math.random().toString(36).slice(2, 8)}`,
    class: className = '',
  }: Props = $props();

  const ui = getUiStrings();
  const label = $derived(labelProp ?? ui.language.label);

  function choose(loc: UiLocale) {
    if (loc === value) return;
    value = loc;
    onchange?.(loc);
  }
</script>

{#snippet tag(loc: UiLocale, on: boolean)}
  <span class="tape" class:mat-label={on}>
    {#if short}
      <span aria-hidden="true">{LANGUAGE_NAMES[loc].short}</span><span class="visually-hidden"
        >{LANGUAGE_NAMES[loc].name}</span
      >
    {:else}
      {LANGUAGE_NAMES[loc].name}
    {/if}
  </span>
{/snippet}

{#if hrefs}
  <nav class="lang {className}" class:short aria-label={label}>
    {#if labelVisible}<span class="legend" aria-hidden="true">{label}</span>{/if}
    <ul class="rail">
      {#each locales as loc (loc)}
        {@const on = loc === value}
        <li>
          <a
            class="opt"
            href={hrefs[loc]}
            hreflang={loc}
            lang={loc}
            aria-current={on ? 'true' : undefined}
            onclick={() => choose(loc)}>{@render tag(loc, on)}</a
          >
        </li>
      {/each}
    </ul>
  </nav>
{:else}
  <fieldset class="lang {className}" class:short>
    <legend class="legend" class:visually-hidden={!labelVisible}>{label}</legend>
    <div class="rail">
      {#each locales as loc (loc)}
        {@const on = loc === value}
        <label class="opt" lang={loc}>
          <input type="radio" {name} value={loc} checked={on} onchange={() => choose(loc)} />
          {@render tag(loc, on)}
        </label>
      {/each}
    </div>
  </fieldset>
{/if}

<style>
  .lang {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    border: 0;
    min-inline-size: 0;
  }
  .legend {
    float: inline-start; /* légende d'un fieldset en ligne avec la réglette */
    padding: 0;
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  /* La réglette : un liseré de sous-main, les étiquettes posées dessus */
  .rail {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    margin: 0;
    padding: 0 var(--space-1);
    list-style: none;
    border: var(--border) solid var(--line);
    border-radius: var(--radius-s);
  }
  .opt {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-block-size: var(--hit);
    padding-inline: var(--space-1);
    color: var(--text-muted);
    text-decoration: none;
    cursor: pointer;
    border-radius: var(--radius-xs);
  }
  .opt input {
    position: absolute;
    inset: 0;
    z-index: 1; /* cible du pointeur : toute l'étiquette */
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .tape {
    display: inline-flex;
    padding: 0.18em 0.7em 0.14em;
    font-family: var(--font-label);
    font-size: var(--step--1);
    font-weight: var(--weight-medium);
    line-height: 1.2;
    letter-spacing: calc(0.14em + var(--tracking-extra));
    text-transform: uppercase;
    white-space: nowrap;
    transition: transform var(--dur-fast) var(--ease-snap);
  }
  /* Choisie : la bande d'étiqueteuse (forme + relief, pas seulement la couleur), collée de travers */
  .tape.mat-label {
    transform: rotate(-1.5deg);
  }
  @media (hover: hover) {
    .opt:hover .tape:not(.mat-label) {
      color: var(--text);
      transform: translateY(var(--lift));
    }
  }
  .opt:has(:focus-visible),
  a.opt:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  @media (forced-colors: active) {
    .rail {
      border-color: CanvasText;
    }
    .opt {
      color: CanvasText;
    }
  }
</style>
