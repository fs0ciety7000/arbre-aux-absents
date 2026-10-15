/**
 * Version du jeu jointe aux signalements du site (`diagnostics.appVersion`). Lue au prérendu
 * seulement (importée par des `+page.server.ts`) : le JSON ne part jamais au client.
 */
import game from '../../../../game/package.json' with { type: 'json' };

export const GAME_VERSION: string = game.version;
