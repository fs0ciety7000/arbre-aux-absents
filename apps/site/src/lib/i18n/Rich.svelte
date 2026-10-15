<!-- Texte enrichi d'un catalogue (lib/i18n/rich.ts) : segments rendus sans {@html}. -->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { currentLang, localPath } from './app';
  import type { Rich } from './rich';

  let { text }: { text: Rich } = $props();
  const lang = $derived(currentLang());
</script>

{#each text as s, i (i)}{#if typeof s === 'string'}{s}{:else if 'em' in s}<em lang={s.lang}
      >{s.em}</em
    >{:else if 'strong' in s}<strong>{s.strong}</strong>{:else if 'fr' in s}<span lang="fr"
      >{s.fr}</span
    >{:else}<a href={resolve(localPath(lang, s.link, s.hash))}>{s.text}</a>{/if}{/each}
