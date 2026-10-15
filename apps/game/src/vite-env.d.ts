/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Service de signalement (public, pas un secret ; `.env.example`). Défaut : la production. */
  readonly VITE_REPORT_API?: string;
}
