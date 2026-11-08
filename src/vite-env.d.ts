/// <reference types="vite/client" />

// `interface` imposé ici : c'est ainsi que Vite laisse compléter le type des variables d'environnement.
interface ImportMetaEnv {
  /** Où écrire sur OpenStreetMap ; par défaut, le serveur de test (rien n'apparaît sur la vraie carte). */
  readonly VITE_OSM_URL?: string
  /** L'identifiant de l'appli Handiplan enregistrée sur ce serveur OSM (OAuth 2). */
  readonly VITE_OSM_CLIENT_ID?: string
}
