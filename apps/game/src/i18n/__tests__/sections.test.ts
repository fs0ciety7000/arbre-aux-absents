import { describe, expect, it, vi } from 'vitest';
import { frDesk } from '../fr-desk';

/** Module neuf : sections différées pas encore chargées (le `setupFiles` les a chargées). */
async function fresh() {
  vi.resetModules();
  return import('../index.svelte');
}

describe('sections différées du catalogue', () => {
  it('hors du catalogue de base, ajoutées par ensureMessages', async () => {
    const i18n = await fresh();
    expect(i18n.loadedMessages('fr')).not.toHaveProperty('pm');
    await i18n.ensureMessages('desk');
    expect(i18n.loadedMessages('fr')?.pm.reader.redacted).toBe(frDesk.pm.reader.redacted);
    expect(i18n.messages.pm.reader.redacted).toBe(frDesk.pm.reader.redacted);
  });

  it('un alias pris avant le chargement suit la section une fois chargée', async () => {
    const i18n = await fresh();
    const early = i18n.pm.reader;
    const viaRoot = i18n.messages.pm.common;
    await i18n.ensureMessages('desk');
    expect(early.redacted).toBe(frDesk.pm.reader.redacted);
    expect(viaRoot.close).toBe(frDesk.pm.common.close);
  });

  it('une langue chargée ensuite reçoit les sections demandées', async () => {
    const i18n = await fresh();
    await i18n.ensureMessages('desk');
    await i18n.setMessagesLocale('en');
    const { enDesk } = await import('../en-desk');
    expect(i18n.uiLang()).toBe('en');
    expect(i18n.pm.reader.redacted).toBe(enDesk.pm.reader.redacted);
  });

  it('applyMessages sans la section demandée : chargée avant d’être affichée', async () => {
    const i18n = await fresh();
    const en = await i18n.loadMessages('en');
    expect(en).not.toHaveProperty('pm');
    await i18n.ensureMessages('desk');
    i18n.applyMessages('en', en);
    await vi.waitFor(() => expect(i18n.uiLang()).toBe('en'));
    expect(typeof i18n.pm.reader.redacted).toBe('string');
  });
});
