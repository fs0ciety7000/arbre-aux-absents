import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppController } from '../../lib/game/app.svelte';
import { COMMAND_EVENT, type CommandDetail } from '../commands';
import { runCommand } from '../controller';

/** Application minimale : le Bureau est affiché, aucun modal, aucun écran par-dessus. */
function fakeApp() {
  const showPanel = vi.fn();
  const app = {
    screen: 'desk',
    overlay: null,
    game: { modal: null, showPanel },
  } as unknown as AppController;
  return { app, showPanel };
}

describe('runCommand — commande « search » (/, Ctrl+F, bouton Y)', () => {
  let target: EventTarget;
  beforeEach(() => {
    target = new EventTarget();
    vi.stubGlobal('window', target);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ouvre le Catalogue quand aucun panneau ne la traite, puis la lui relaie', async () => {
    const { app, showPanel } = fakeApp();
    const seen: CommandDetail[] = [];
    expect(runCommand(app, 'search', 'keyboard')).toBe(true);
    expect(showPanel).toHaveBeenCalledWith('catalogue');
    // Le Catalogue, une fois monté, reçoit la commande (focus du champ de requête).
    target.addEventListener(COMMAND_EVENT, (e) => {
      seen.push((e as CustomEvent<CommandDetail>).detail);
      e.preventDefault();
    });
    await vi.waitFor(() => expect(seen).toEqual([{ command: 'search', source: 'keyboard' }]));
  });

  it('laisse le Catalogue déjà monté la traiter, sans changer de panneau', () => {
    const { app, showPanel } = fakeApp();
    target.addEventListener(COMMAND_EVENT, (e) => e.preventDefault());
    expect(runCommand(app, 'search', 'gamepad')).toBe(true);
    expect(showPanel).not.toHaveBeenCalled();
  });

  it('les autres commandes de panneau non traitées restent non consommées', () => {
    const { app, showPanel } = fakeApp();
    expect(runCommand(app, 'reader.flip', 'keyboard')).toBe(false);
    expect(showPanel).not.toHaveBeenCalled();
  });

  it('ne fait rien hors du Bureau ou sous un modal', () => {
    const { app, showPanel } = fakeApp();
    (app as unknown as { screen: string }).screen = 'title';
    expect(runCommand(app, 'search', 'keyboard')).toBe(false);
    const other = fakeApp();
    (other.app.game as unknown as { modal: unknown }).modal = { kind: 'pause', uid: 1 };
    expect(runCommand(other.app, 'search', 'keyboard')).toBe(false);
    expect(showPanel).not.toHaveBeenCalled();
    expect(other.showPanel).not.toHaveBeenCalled();
  });
});
