<!-- Erreur générique (rare sur un site prérendu) : même voix que la 404, sans image. -->
<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '@arbre/ui';
  import type { ChromeStrings } from '#lib/i18n/index';
  import { localHref } from '#lib/i18n/app';
  import Rich from '#lib/i18n/Rich.svelte';
  import { SITE_NAME } from '#lib/site';

  // Textes de l'habillage (load du layout racine, toujours présent : il ne peut pas échouer).
  const t = $derived(page.data.chrome as ChromeStrings);
  const lang = $derived(t.lang);
</script>

<svelte:head><title>{t.error.title} · {SITE_NAME}</title></svelte:head>

<div class="container-narrow page-head err">
  <p class="kicker">{t.error.kicker} {page.status}</p>
  <h1><Rich text={t.error.heading} /></h1>
  <p class="lede">{t.error.lede}</p>
  <Button variant="primary" href={localHref(lang, '')} iconName="back">{t.backHome}</Button>
</div>

<style>
  .err {
    padding-block: var(--space-24) var(--space-16);
  }
</style>
