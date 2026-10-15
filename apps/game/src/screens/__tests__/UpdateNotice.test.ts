import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import type { AppController } from '../../lib/game/app.svelte';
import { UpdateState } from '../../lib/game/update.svelte';
import type { UpdateOffer } from '../../platform/update';
import Harness from './UpdateNoticeHarness.svelte';

const NOTES = '<!-- fr -->\nNotes FR\n- point <b>gras</b>\n<!-- en -->\nEN notes';

function html(
  offer: UpdateOffer | null,
  opts: { variant?: 'title' | 'options'; game?: boolean; state?: Partial<UpdateState> } = {},
): string {
  const updates = new UpdateState();
  updates.offer = offer;
  Object.assign(updates, opts.state ?? {});
  const app = {
    updates,
    lang: 'fr',
    game: opts.game ? {} : null,
    saveProfile: async () => {},
  } as unknown as AppController;
  return render(Harness, { props: { app, variant: opts.variant ?? 'title' } })
    .body.replace(/<!--[^]*?-->/g, '')
    .replace(/ svelte-[a-z0-9]+/g, '');
}

const install: UpdateOffer = { version: '1.4.0', notes: NOTES, action: 'install', url: null };
const apk: UpdateOffer = {
  version: '1.4.0',
  notes: null,
  action: 'download',
  url: 'https://github.com/fs0ciety7000/arbre-aux-absents/releases/download/v1.4.0/arbre-aux-absents-1.4.0.apk',
};

describe('UpdateNotice', () => {
  it('rien sans offre', () => {
    expect(html(null)).not.toContain('update-notice');
  });

  it('desktop : titre, notes FR en texte brut, Mettre à jour et Plus tard', () => {
    const out = html(install);
    expect(out).toContain('Version 1.4.0 disponible');
    expect(out).toContain('Ce qui change');
    expect(out).toContain('point &lt;b>gras&lt;/b>');
    expect(out).not.toContain('EN notes');
    expect(out).toContain('Mettre à jour');
    expect(out).toContain('Plus tard');
    expect(out).toMatch(/aria-labelledby="update-title"/);
  });

  it('Android : nouvelle version, Télécharger, aide de l’installeur', () => {
    const out = html(apk);
    expect(out).toContain('Nouvelle version disponible');
    expect(out).toContain('Version 1.4.0');
    expect(out).toContain('Télécharger');
    expect(out).toContain('Android vous demandera');
    expect(out).not.toContain('Ce qui change');
  });

  it('Options : pas de « Plus tard » ; partie ouverte : aucune installation', () => {
    expect(html(install, { variant: 'options' })).not.toContain('Plus tard');
    const inGame = html(install, { variant: 'options', game: true });
    expect(inGame).toContain('Revenez à l’écran titre');
    expect(inGame).not.toContain('Mettre à jour</');
  });

  it('téléchargement en cours : progression, pas de boutons ; échec visible', () => {
    const busy = html(install, { state: { status: 'downloading', progress: 0.42 } });
    expect(busy).toContain('Téléchargement… 42 %');
    expect(busy).toMatch(/<progress[^>]*value="42"/);
    expect(busy).not.toContain('Plus tard');
    const failed = html(install, { state: { status: 'available', error: 'install' } });
    expect(failed).toContain('role="alert"');
  });
});
