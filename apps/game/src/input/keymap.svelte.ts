/**
 * Raccourcis clavier remappables (ECRANS §4.3). Une liaison est une combinaison
 * normalisée : modificateurs `Ctrl+`, `Alt+`, `Shift+` (seulement pour les touches nommées)
 * puis `e.key` (minuscule pour un caractère) ou `e.code` (ex. `Ctrl+BracketLeft`, utile sur
 * AZERTY). Les remappages vivent dans le stockage local de l'appareil : `Settings` n'a pas
 * encore de champ `keymap` (proposition au contrat).
 */
export const COMMANDS = [
  'back',
  'tab.tree',
  'tab.archives',
  'tab.catalogue',
  'tab.notebook',
  'tab.map',
  'tab.pinboard',
  'tab.journal',
  'tab.faces',
  'help',
  'search',
  'history.back',
  'history.forward',
  'side.narrower',
  'side.wider',
  'fullscreen',
  'save',
  'reader.transcript',
  'reader.flip',
  'page.prev',
  'page.next',
  'zoom.in',
  'zoom.out',
  'zoom.fit',
  'pin',
  'highlight',
  'note',
  'use',
  'clear',
  'context',
] as const;
export type CommandId = (typeof COMMANDS)[number];

/** Commandes traitées par le shell ; les autres sont relayées aux panneaux. */
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- non réactif par conception
export const SHELL_COMMANDS: ReadonlySet<CommandId> = new Set([
  'back',
  'tab.tree',
  'tab.archives',
  'tab.catalogue',
  'tab.notebook',
  'tab.map',
  'tab.pinboard',
  'tab.journal',
  'tab.faces',
  'help',
  'history.back',
  'history.forward',
  'side.narrower',
  'side.wider',
  'fullscreen',
  'save',
]);

export const DEFAULT_KEYMAP: Readonly<Record<CommandId, readonly string[]>> = {
  back: ['Escape'],
  'tab.tree': ['1'],
  'tab.archives': ['2'],
  'tab.catalogue': ['3'],
  'tab.notebook': ['4'],
  'tab.map': ['5'],
  'tab.pinboard': ['6'],
  'tab.journal': ['7'],
  'tab.faces': ['8'],
  help: ['F1', '?'],
  search: ['/', 'Ctrl+f'],
  'history.back': ['Alt+ArrowLeft', 'BrowserBack'],
  'history.forward': ['Alt+ArrowRight', 'BrowserForward'],
  'side.narrower': ['Ctrl+BracketLeft', 'Ctrl+['],
  'side.wider': ['Ctrl+BracketRight', 'Ctrl+]'],
  fullscreen: ['F11'],
  save: ['Ctrl+s'],
  'reader.transcript': ['t'],
  'reader.flip': ['r'],
  'page.prev': ['PageUp'],
  'page.next': ['PageDown'],
  'zoom.in': ['+', '='],
  'zoom.out': ['-'],
  'zoom.fit': ['0'],
  pin: ['p'],
  highlight: ['h'],
  note: ['n'],
  use: ['u'],
  clear: ['Delete'],
  context: ['ContextMenu', 'Shift+F10'],
};

const STORAGE_KEY = 'arbre.keymap.v1';
const MODIFIERS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'AltGraph', 'CapsLock']);

/** Combinaisons d'un événement : par caractère (`key`) et par position (`code`). */
export function combosOf(e: KeyboardEvent): string[] {
  if (MODIFIERS.has(e.key)) return [];
  const named = e.key.length > 1;
  const mods = `${e.ctrlKey || e.metaKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}`;
  const shift = e.shiftKey ? 'Shift+' : '';
  const key = named ? e.key : e.key.toLowerCase();
  const out = [`${mods}${named ? shift : ''}${key}`];
  if (e.code && e.code !== e.key) out.push(`${mods}${shift}${e.code}`);
  return out;
}

/** Libellé lisible d'une combinaison (« Ctrl + [ », « Échap »). */
export function comboLabel(combo: string): string {
  const NAMES: Record<string, string> = {
    Escape: 'Échap',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    PageUp: 'PgPréc',
    PageDown: 'PgSuiv',
    Delete: 'Suppr',
    Shift: 'Maj',
    BracketLeft: '[',
    BracketRight: ']',
    ContextMenu: 'Menu',
    ' ': 'Espace',
  };
  return combo
    .split('+')
    .map((p, i, all) => (p === '' && i === all.length - 1 ? '+' : p))
    .filter((p) => p !== '')
    .map((p) => NAMES[p] ?? (p.length === 1 ? p.toUpperCase() : p))
    .join(' + ');
}

class Keymap {
  bindings = $state<Record<CommandId, string[]>>(clone(DEFAULT_KEYMAP));

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;
      const next = clone(DEFAULT_KEYMAP);
      for (const id of COMMANDS) {
        const v = parsed[id];
        if (Array.isArray(v) && v.every((x) => typeof x === 'string')) next[id] = v as string[];
      }
      this.bindings = next;
    } catch {
      /* stockage indisponible : défauts */
    }
  }

  /** Commande liée à un événement clavier, ou null. */
  match(e: KeyboardEvent): CommandId | null {
    const combos = combosOf(e);
    if (combos.length === 0) return null;
    for (const id of COMMANDS) {
      if (this.bindings[id].some((b) => combos.includes(b))) return id;
    }
    return null;
  }

  /** Remplace la première liaison ; renvoie la commande qui la perd (échange), s'il y en a. */
  rebind(id: CommandId, combo: string): CommandId | null {
    let other: CommandId | null = null;
    const next = clone(this.bindings);
    for (const c of COMMANDS) {
      if (c !== id && next[c].includes(combo)) {
        other = c;
        next[c] = next[c].filter((b) => b !== combo);
        const previous = next[id][0];
        if (previous && !next[c].includes(previous)) next[c].unshift(previous);
      }
    }
    next[id] = [combo];
    this.bindings = next;
    this.#persist();
    return other;
  }

  reset(): void {
    this.bindings = clone(DEFAULT_KEYMAP);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignoré */
    }
  }

  #persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bindings));
    } catch {
      /* ignoré */
    }
  }
}

function clone(map: Readonly<Record<CommandId, readonly string[]>>): Record<CommandId, string[]> {
  return Object.fromEntries(COMMANDS.map((id) => [id, [...map[id]]])) as Record<
    CommandId,
    string[]
  >;
}

export const keymap = new Keymap();
