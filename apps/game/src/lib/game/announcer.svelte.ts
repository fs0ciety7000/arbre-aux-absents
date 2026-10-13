/**
 * Annonces pour lecteurs d'écran (région live polie, et assertive pour les erreurs).
 * Le texte est vidé puis reposé pour que deux annonces identiques soient relues.
 */
class Announcer {
  polite = $state('');
  assertive = $state('');
  #timer: ReturnType<typeof setTimeout> | undefined;

  say(text: string, mode: 'polite' | 'assertive' = 'polite'): void {
    clearTimeout(this.#timer);
    this[mode] = '';
    this.#timer = setTimeout(() => {
      this[mode] = text;
    }, 60);
  }
}

export const announcer = new Announcer();
