import type { Device, PadStyle } from '@arbre/ui';

/**
 * Périphérique actif (dernier utilisé) et style de manette, pour les glyphes d'aide
 * (`KeyHint`). Posé aussi sur `<html data-input="…">`.
 */
class InputDevice {
  device = $state<Device>('mouse');
  padStyle = $state<PadStyle>('xbox');
  padName = $state<string | null>(null);
  #installed = false;

  install(): void {
    if (this.#installed || typeof window === 'undefined') return;
    this.#installed = true;
    window.addEventListener(
      'pointerdown',
      (e) => this.set(e.pointerType === 'touch' || e.pointerType === 'pen' ? 'touch' : 'mouse'),
      { capture: true, passive: true },
    );
    window.addEventListener(
      'keydown',
      (e) => {
        if (!['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) this.set('keyboard');
      },
      { capture: true },
    );
    if (matchMedia('(pointer: coarse)').matches) this.set('touch');
  }

  set(d: Device): void {
    if (this.device === d) return;
    this.device = d;
    document.documentElement.dataset.input = d;
  }

  setPad(id: string | null): void {
    this.padName = id;
    if (!id) return;
    const s = id.toLowerCase();
    this.padStyle = /054c|playstation|dualsense|dualshock/.test(s)
      ? 'playstation'
      : /057e|nintendo|pro controller|joy-con/.test(s)
        ? 'nintendo'
        : 'xbox';
  }

  /** Périphérique des glyphes selon le réglage `inputGlyphs`. */
  glyphs(setting: 'auto' | 'keyboard' | 'gamepad'): Device {
    if (setting === 'keyboard') return 'keyboard';
    if (setting === 'gamepad') return 'gamepad';
    return this.device;
  }
}

export const input = new InputDevice();
