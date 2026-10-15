<!--
	Champ de texte avec barre de mise en forme Markdown (DESIGN.md §9.37) : description des
	signalements. La barre insère la syntaxe à la sélection (gras, italique, code, bloc de code,
	listes, citation, lien) ; Ctrl/⌘+B, I, K au clavier ; « Aperçu » montre le rendu, sans HTML
	(texte échappé par construction, liens jamais cliquables). Barre : motif ARIA `toolbar`
	(un seul arrêt de tabulation, flèches, Début, Fin). La valeur reste du texte brut.
-->
<script lang="ts">
  import { tick } from 'svelte';
  import { getUiStrings } from '../i18n';
  import {
    MARKDOWN_FORMATS,
    MARKDOWN_SHORTCUTS,
    applyMarkdown,
    parseMarkdown,
    type MarkdownFormat,
  } from '../markdown';
  import Icon from './Icon.svelte';
  import IconButton from './IconButton.svelte';
  import MarkdownPreview from './MarkdownPreview.svelte';

  interface Props {
    label: string;
    value?: string;
    hint?: string;
    rows?: number;
    maxlength?: number;
    disabled?: boolean;
    /** Identifiants décrivant aussi le champ (raison d'un envoi désactivé…). */
    describedby?: string;
    id?: string;
  }

  let {
    label,
    value = $bindable(''),
    hint,
    rows = 5,
    maxlength,
    disabled = false,
    describedby,
    id = `md-${Math.random().toString(36).slice(2, 8)}`,
  }: Props = $props();
  const ui = getUiStrings();

  let textarea: HTMLTextAreaElement | undefined = $state();
  let preview = $state(false);
  /** Bouton de la barre qui porte l'arrêt de tabulation (motif ARIA toolbar). */
  let active = $state(0);
  let bar: HTMLElement | undefined = $state();

  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent ?? '');
  const SHORTCUT_OF: Partial<Record<MarkdownFormat, string>> = Object.fromEntries(
    Object.entries(MARKDOWN_SHORTCUTS).map(([k, f]) => [f, k.toUpperCase()]),
  );

  const describedBy = $derived(
    [hint && `${id}-hint`, maxlength && `${id}-count`, describedby].filter(Boolean).join(' ') ||
      undefined,
  );
  const count = $derived(value?.length ?? 0);
  const blocks = $derived(preview ? parseMarkdown(value ?? '') : []);

  function labelOf(format: MarkdownFormat): string {
    const key = SHORTCUT_OF[format];
    const name = ui.markdown.format[format];
    return key ? `${name} (${ui.markdown.shortcut(key, mac)})` : name;
  }

  /**
   * Remplace le texte en passant par `insertText` quand le navigateur le permet : l'annulation
   * (Ctrl+Z) reste possible. Sinon, affectation directe de la valeur.
   */
  function replace(el: HTMLTextAreaElement, next: string) {
    const old = el.value;
    let a = 0;
    while (a < old.length && a < next.length && old[a] === next[a]) a++;
    let b = 0;
    while (
      b < old.length - a &&
      b < next.length - a &&
      old[old.length - 1 - b] === next[next.length - 1 - b]
    )
      b++;
    el.focus();
    el.setSelectionRange(a, old.length - b);
    const middle = next.slice(a, next.length - b);
    let done: boolean;
    try {
      done =
        middle === ''
          ? document.execCommand('delete')
          : document.execCommand('insertText', false, middle);
    } catch {
      done = false;
    }
    if (!done || el.value !== next) {
      el.value = next;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    value = el.value;
  }

  async function format(kind: MarkdownFormat) {
    if (disabled) return;
    if (preview) {
      preview = false;
      await tick();
    }
    const el = textarea;
    if (!el) return;
    const next = applyMarkdown(
      el.value,
      el.selectionStart,
      el.selectionEnd,
      kind,
      ui.markdown.placeholder,
    );
    if (maxlength !== undefined && next.value.length > maxlength) return;
    replace(el, next.value);
    el.setSelectionRange(next.selectionStart, next.selectionEnd);
  }

  function onkeydown(e: KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const kind = MARKDOWN_SHORTCUTS[e.key.toLowerCase()];
    if (!kind) return;
    e.preventDefault();
    e.stopPropagation();
    void format(kind);
  }

  /** Tous les boutons de la barre (index = `active`), désactivés compris. */
  function buttons(): HTMLButtonElement[] {
    return bar ? [...bar.querySelectorAll<HTMLButtonElement>('button')] : [];
  }

  function onbarkey(e: KeyboardEvent) {
    const all = buttons();
    const enabled = all.filter((b) => !b.disabled);
    const i = enabled.indexOf(document.activeElement as HTMLButtonElement);
    if (i === -1 || enabled.length === 0) return;
    const n = enabled.length;
    const step: Record<string, number> = {
      ArrowRight: i + 1,
      ArrowLeft: i - 1 + n,
      Home: 0,
      End: n - 1,
    };
    if (!(e.key in step)) return;
    e.preventDefault();
    const target = enabled[step[e.key]! % n]!;
    active = all.indexOf(target);
    target.focus();
  }

  function onbarfocus(e: FocusEvent) {
    const i = buttons().indexOf(e.target as HTMLButtonElement);
    if (i !== -1) active = i;
  }

  async function togglePreview() {
    preview = !preview;
  }

  // Le bouton actif ne doit jamais être un bouton désactivé (aperçu ouvert).
  const formatCount = MARKDOWN_FORMATS.length;
  $effect(() => {
    if (preview && active < formatCount) active = formatCount;
  });
</script>

<div class="md-field" class:disabled>
  <label for={id} class="label">{label}</label>
  <div class="frame" class:preview>
    <div
      class="bar"
      role="toolbar"
      aria-label={ui.markdown.toolbar}
      aria-controls={id}
      tabindex="-1"
      bind:this={bar}
      onkeydown={onbarkey}
      onfocusin={onbarfocus}
    >
      <div class="group">
        {#each MARKDOWN_FORMATS as kind, i (kind)}
          <IconButton
            label={labelOf(kind)}
            tooltipPlacement="top"
            tabindex={active === i ? 0 : -1}
            disabled={disabled || preview}
            aria-keyshortcuts={SHORTCUT_OF[kind]
              ? `Control+${SHORTCUT_OF[kind]} Meta+${SHORTCUT_OF[kind]}`
              : undefined}
            onmousedown={(e: MouseEvent) => e.preventDefault()}
            onclick={() => void format(kind)}
          >
            <span class="glyph g-{kind}" aria-hidden="true">
              {#if kind === 'bold'}B{:else if kind === 'italic'}I{:else if kind === 'code'}&lt;&gt;{:else if kind === 'codeBlock'}{'{ }'}{:else if kind === 'bulletList'}<Icon
                  name="list"
                  size="1.25rem"
                />{:else if kind === 'numberedList'}1.{:else if kind === 'quote'}«{:else}URL{/if}
            </span>
          </IconButton>
        {/each}
      </div>
      <button
        type="button"
        class="toggle"
        aria-pressed={preview}
        aria-controls="{id}-preview"
        tabindex={active === formatCount ? 0 : -1}
        {disabled}
        onclick={togglePreview}
      >
        <Icon name="look" size="1.1rem" />
        <span>{ui.markdown.preview}</span>
      </button>
    </div>
    <textarea
      {id}
      bind:this={textarea}
      bind:value
      {rows}
      {maxlength}
      {disabled}
      hidden={preview}
      aria-describedby={describedBy}
      aria-keyshortcuts="Control+B Control+I Control+K Meta+B Meta+I Meta+K"
      data-verb="write"
      {onkeydown}></textarea>
    <div
      id="{id}-preview"
      class="rendered"
      role="region"
      aria-label={ui.markdown.previewRegion}
      hidden={!preview}
    >
      {#if preview}
        {#if blocks.length === 0}
          <p class="empty">{ui.markdown.previewEmpty}</p>
        {:else}
          <MarkdownPreview {blocks} />
        {/if}
      {/if}
    </div>
  </div>
  <div class="below">
    {#if hint}<p id="{id}-hint" class="hint">{hint}</p>{/if}
    {#if maxlength}
      <p id="{id}-count" class="count num" aria-live="polite">
        <span class="visually-hidden">{ui.textField.characters}</span>{count} / {maxlength}
      </p>
    {/if}
  </div>
</div>

<style>
  .md-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-inline-size: 0;
  }
  .label {
    font-size: var(--step-0);
    font-weight: var(--weight-semibold);
    color: var(--text);
  }
  .frame {
    display: grid;
    min-inline-size: 0;
    background: var(--surface-2);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-s);
    box-shadow: var(--shadow-inset);
  }
  .frame:has(textarea:focus-visible) {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  /* Barre : réglette d'outils au-dessus de la feuille, filet en tirets. Les info-bulles
     débordent en hauteur seulement (jamais de défilement horizontal à 360 px). */
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-1);
    padding: var(--space-1);
    border-block-end: var(--border) dashed var(--line-strong);
    overflow-x: clip;
    overflow-y: visible;
  }
  .bar:focus {
    outline: none;
  }
  .group {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    min-inline-size: 0;
  }
  .glyph {
    display: inline-grid;
    place-items: center;
    min-inline-size: 1.5rem;
    color: var(--text);
    line-height: 1;
  }
  .g-bold {
    font-family: var(--font-ui);
    font-weight: var(--weight-bold);
    font-size: var(--step-1);
  }
  .g-italic {
    font-family: var(--font-read);
    font-style: italic;
    font-size: var(--step-1);
  }
  .g-code,
  .g-codeBlock,
  .g-numberedList {
    font-family: var(--font-type);
    font-weight: var(--weight-bold);
    font-size: var(--step--1);
  }
  .g-quote {
    font-family: var(--font-read);
    font-size: var(--step-2);
  }
  .g-link {
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    font-size: var(--step--1);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-block-size: var(--hit);
    padding-inline: var(--space-3);
    border: var(--border) solid transparent;
    border-radius: var(--radius-m);
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    cursor: pointer;
  }
  .toggle:hover {
    color: var(--text);
    background: var(--accent-tint);
  }
  .toggle[aria-pressed='true'] {
    color: var(--accent);
    background: var(--accent-tint);
    border-color: var(--accent);
  }
  .toggle:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  textarea {
    min-inline-size: 0;
    min-block-size: var(--hit);
    padding: var(--space-2) var(--space-3);
    border: 0;
    background: transparent;
    color: var(--text);
    font-family: var(--font-read);
    font-size: var(--step-0);
    line-height: var(--leading-read);
    resize: vertical;
    outline: none;
  }
  textarea:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  textarea[hidden],
  .rendered[hidden] {
    display: none;
  }
  .rendered {
    min-block-size: 8rem;
    max-block-size: 24rem;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--space-2) var(--space-3);
    font-family: var(--font-read);
    font-size: var(--step-0);
    line-height: var(--leading-read);
    overflow-wrap: anywhere;
  }
  .empty {
    margin: 0;
    color: var(--text-muted);
  }
  .below {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .hint,
  .count {
    margin: 0;
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .count {
    margin-inline-start: auto;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @media (forced-colors: active) {
    .frame {
      border-color: FieldText;
    }
    .toggle[aria-pressed='true'] {
      border-color: Highlight;
    }
  }
</style>
