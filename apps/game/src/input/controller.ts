import type { DeskLayout } from '@arbre/contract';
import { pushToast } from '@arbre/ui';
import { tick } from 'svelte';
import type { AppController } from '../lib/game/app.svelte';
import { announcer } from '../lib/game/announcer.svelte';
import type { PanelId } from '../lib/game/types';
import { viewport } from '../lib/game/viewport.svelte';
import { messages } from '../messages.fr';
import { relayCommand } from './commands';
import { input } from './device.svelte';
import { keymap, SHELL_COMMANDS, type CommandId } from './keymap.svelte';
import { moveFocus, type Direction } from './spatial-nav';

const TAB_COMMANDS: Partial<Record<CommandId, PanelId>> = {
  'tab.tree': 'tree',
  'tab.archives': 'archives',
  'tab.catalogue': 'catalogue',
  'tab.notebook': 'notebook',
  'tab.map': 'map',
  'tab.pinboard': 'pinboard',
  'tab.journal': 'journal',
  'tab.faces': 'faces',
};

/** Ordre des onglets pour LB/RB. */
const TAB_CYCLE: PanelId[] = [
  'tree',
  'archives',
  'catalogue',
  'notebook',
  'map',
  'pinboard',
  'journal',
  'faces',
];

const SIDE_STEP = 40;
const SIDE_MIN = 360;
const SIDE_MAX = 640;

function isEditable(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) {
    return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset'].includes(el.type);
  }
  return false;
}

/** Une modale native (`<dialog>`) est ouverte : elle gère ses touches elle-même. */
function dialogOpen(): boolean {
  return document.querySelector('dialog[open]') !== null;
}

/**
 * Exécute une commande. Les commandes du shell agissent sur l'app ; les autres sont relayées
 * aux panneaux (`arbre:command`). Renvoie true si la commande a été consommée.
 */
export function runCommand(
  app: AppController,
  cmd: CommandId,
  source: 'keyboard' | 'gamepad',
): boolean {
  const g = app.game;
  const inDesk = app.screen === 'desk' && app.overlay === null && g !== null;

  if (cmd === 'back') return app.back();
  if (cmd === 'fullscreen') {
    const on = typeof document !== 'undefined' && !document.fullscreenElement;
    void app.platform?.setFullscreen?.(on);
    return true;
  }
  if (!inDesk || !g) return false;
  if (g.modal !== null) return false;

  if (!SHELL_COMMANDS.has(cmd)) {
    if (relayCommand(cmd, source)) return true;
    // `/`, Ctrl+F, Y : aucun panneau monté ne l'a traitée → ouvrir le Catalogue, puis lui
    // relayer la commande une fois monté (le champ de requête prend le focus).
    if (cmd === 'search') {
      g.showPanel('catalogue');
      announcer.say(messages.panels.catalogue);
      void tick().then(() => relayCommand(cmd, source));
      return true;
    }
    return false;
  }

  const panel = TAB_COMMANDS[cmd];
  if (panel) {
    if (g.readerFull) g.setReaderFull(false);
    g.showPanel(panel);
    announcer.say(messages.panels[panel]);
    return true;
  }
  switch (cmd) {
    case 'help':
      g.showPanel('help');
      return true;
    case 'history.back':
      return g.historyGo(-1);
    case 'history.forward':
      return g.historyGo(1);
    case 'layout.investigate':
    case 'layout.read':
    case 'layout.tree': {
      if (viewport.single) return false;
      const layout = cmd.slice('layout.'.length) as DeskLayout;
      g.setLayout(layout);
      announcer.say(messages.desk.layoutChanged(messages.desk.layouts[layout]));
      return true;
    }
    case 'side.narrower':
      g.sideWidth = Math.max(SIDE_MIN, g.sideWidth - SIDE_STEP);
      return true;
    case 'side.wider':
      g.sideWidth = Math.min(SIDE_MAX, g.sideWidth + SIDE_STEP);
      return true;
    case 'save':
      void app.manualSave();
      return true;
    default:
      return false;
  }
}

/** Onglet précédent / suivant (LB / RB). */
function cycleTab(app: AppController, delta: -1 | 1): void {
  const g = app.game;
  if (!g || app.screen !== 'desk' || g.modal) return;
  const current = TAB_CYCLE.includes(lastTab) ? lastTab : g.ui.main;
  const i = Math.max(0, TAB_CYCLE.indexOf(current));
  const next = TAB_CYCLE[(i + delta + TAB_CYCLE.length) % TAB_CYCLE.length]!;
  lastTab = next;
  g.showPanel(next);
  announcer.say(messages.panels[next]);
}

let lastTab: PanelId = 'tree';

/** Clavier global : raccourcis remappables (hors champs de saisie, sauf Échap). */
export function installKeyboard(app: AppController): () => void {
  keymap.load();
  const onKeydown = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.isComposing) return;
    const cmd = keymap.match(e);
    if (!cmd) return;
    if (dialogOpen()) return; // Échap ferme la modale (Dialog) ; rien d'autre
    if (cmd !== 'back' && isEditable(document.activeElement)) return;
    if (cmd === 'back' && isEditable(document.activeElement)) {
      (document.activeElement as HTMLElement).blur();
      e.preventDefault();
      return;
    }
    if (runCommand(app, cmd, 'keyboard')) e.preventDefault();
  };
  const onMouseBack = (e: MouseEvent) => {
    if (e.button === 3) {
      if (runCommand(app, 'history.back', 'keyboard')) e.preventDefault();
    } else if (e.button === 4) {
      if (runCommand(app, 'history.forward', 'keyboard')) e.preventDefault();
    }
  };
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('mouseup', onMouseBack);
  return () => {
    window.removeEventListener('keydown', onKeydown);
    window.removeEventListener('mouseup', onMouseBack);
  };
}

// ── Manette (Gamepad API, disposition standard) ───────────────────────

const REPEAT_FIRST = 400;
const REPEAT_NEXT = 130;
const AXIS = 0.55;

/** Boutons standard → action. */
type PadAction =
  | { kind: 'activate' }
  | { kind: 'cmd'; cmd: CommandId }
  | { kind: 'tab'; delta: -1 | 1 }
  | { kind: 'move'; dir: Direction }
  | { kind: 'pause' };

const BUTTONS: Record<number, PadAction> = {
  0: { kind: 'activate' },
  1: { kind: 'cmd', cmd: 'back' },
  2: { kind: 'cmd', cmd: 'context' },
  3: { kind: 'cmd', cmd: 'search' },
  4: { kind: 'tab', delta: -1 },
  5: { kind: 'tab', delta: 1 },
  6: { kind: 'cmd', cmd: 'zoom.out' },
  7: { kind: 'cmd', cmd: 'zoom.in' },
  8: { kind: 'cmd', cmd: 'tab.notebook' },
  9: { kind: 'pause' },
  11: { kind: 'cmd', cmd: 'reader.transcript' },
  12: { kind: 'move', dir: 'up' },
  13: { kind: 'move', dir: 'down' },
  14: { kind: 'move', dir: 'left' },
  15: { kind: 'move', dir: 'right' },
};

/**
 * Manette : navigation spatiale par focus (croix, stick gauche), A active, B retour,
 * Start pause, LB/RB onglets. Le polling (`requestAnimationFrame`) ne tourne que si une
 * manette est branchée. Déconnexion en jeu → pause automatique + message.
 */
export function installGamepad(app: AppController): () => void {
  if (typeof navigator === 'undefined' || !('getGamepads' in navigator)) return () => {};
  let raf = 0;
  const held = new Map<string, number>(); // clé → prochain déclenchement (ms)

  const perform = (a: PadAction) => {
    input.set('gamepad');
    switch (a.kind) {
      case 'activate': {
        const el = document.activeElement as HTMLElement | null;
        if (el && el !== document.body) el.click();
        else moveFocus('down');
        break;
      }
      case 'cmd':
        runCommand(app, a.cmd, 'gamepad');
        break;
      case 'tab':
        cycleTab(app, a.delta);
        break;
      case 'move':
        moveFocus(a.dir);
        break;
      case 'pause':
        if (app.screen === 'desk' && app.game && !app.overlay) {
          if (app.game.paused) app.game.closeModal();
          else app.game.openPause();
        }
        break;
    }
  };

  const press = (key: string, pressed: boolean, a: PadAction, t: number, repeat: boolean) => {
    if (!pressed) {
      held.delete(key);
      return;
    }
    const next = held.get(key);
    if (next === undefined) {
      perform(a);
      held.set(key, repeat ? t + REPEAT_FIRST : Infinity);
    } else if (t >= next) {
      perform(a);
      held.set(key, t + REPEAT_NEXT);
    }
  };

  const poll = (t: number) => {
    const pads = navigator.getGamepads().filter((p): p is Gamepad => p !== null);
    if (pads.length === 0) {
      raf = 0;
      return;
    }
    for (const pad of pads) {
      pad.buttons.forEach((b, i) => {
        const a = BUTTONS[i];
        if (a) press(`${pad.index}:b${i}`, b.pressed, a, t, a.kind === 'move');
      });
      const [x = 0, y = 0] = pad.axes;
      press(`${pad.index}:up`, y < -AXIS, { kind: 'move', dir: 'up' }, t, true);
      press(`${pad.index}:down`, y > AXIS, { kind: 'move', dir: 'down' }, t, true);
      press(`${pad.index}:left`, x < -AXIS, { kind: 'move', dir: 'left' }, t, true);
      press(`${pad.index}:right`, x > AXIS, { kind: 'move', dir: 'right' }, t, true);
    }
    raf = requestAnimationFrame(poll);
  };

  const start = () => {
    if (!raf) raf = requestAnimationFrame(poll);
  };
  const onConnect = (e: GamepadEvent) => {
    input.setPad(e.gamepad.id);
    start();
  };
  const onDisconnect = () => {
    const left = navigator.getGamepads().some((p) => p !== null);
    if (!left) input.setPad(null);
    if (app.screen === 'desk' && app.game) {
      app.game.openPause();
      pushToast({ tone: 'warning', title: messages.desk.gamepadLost });
      announcer.say(messages.desk.gamepadLost, 'assertive');
    }
  };
  window.addEventListener('gamepadconnected', onConnect);
  window.addEventListener('gamepaddisconnected', onDisconnect);
  if (navigator.getGamepads().some((p) => p !== null)) start();
  return () => {
    window.removeEventListener('gamepadconnected', onConnect);
    window.removeEventListener('gamepaddisconnected', onDisconnect);
    if (raf) cancelAnimationFrame(raf);
  };
}
