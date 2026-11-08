// Où l'on écrit. Par défaut, le SERVEUR DE TEST d'OpenStreetMap : une copie séparée, avec ses propres
// comptes, où rien n'apparaît sur la vraie carte. Écrire sur la vraie carte demande de le dire
// explicitement (VITE_OSM_URL=https://www.openstreetmap.org), après en avoir parlé sur le forum.
export const OSM_ECRITURE: string = import.meta.env.VITE_OSM_URL ?? 'https://master.apis.dev.openstreetmap.org'
export const SERVEUR_DE_TEST = OSM_ECRITURE !== 'https://www.openstreetmap.org'

// L'API d'écriture n'est pas toujours à la même adresse que le site (connexion).
export const API_ECRITURE = SERVEUR_DE_TEST ? `${OSM_ECRITURE}/api/0.6` : 'https://api.openstreetmap.org/api/0.6'

// Les étiquettes actuelles d'un lieu se lisent toujours sur la vraie carte (lecture seule).
export const API_LECTURE = 'https://api.openstreetmap.org/api/0.6'

/** L'identifiant de l'appli enregistrée sur le serveur choisi (Réglages → Applications OAuth 2). */
export const OSM_CLIENT_ID: string | undefined = import.meta.env.VITE_OSM_CLIENT_ID
