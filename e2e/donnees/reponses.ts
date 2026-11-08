// Réponses simulées des services extérieurs, juste ce qu'il faut pour les parcours testés.

/** Deux lieux Acceslibre près de l'Hôtel de Ville : l'un facile, l'autre avec des marches. */
export const ACCESLIBRE = [
  {
    id: 'e2e-1', web_url: 'https://acceslibre.beta.gouv.fr/app/e2e-1', name: 'Le Café des essais', activite: 'Café',
    latitude: 48.8558, longitude: 2.3508, entree_plain_pied: true, sanitaires_adaptes: true,
  },
  {
    id: 'e2e-2', web_url: 'https://acceslibre.beta.gouv.fr/app/e2e-2', name: 'Le Bistrot à marches', activite: 'Restaurant',
    latitude: 48.8551, longitude: 2.3541, entree_plain_pied: false, entree_marches: 3, entree_marches_main_courante: true, sanitaires_adaptes: false,
  },
]

/** Une adresse dans le Marais, pour le parcours « on va quelque part ». */
export const ADRESSE_MARAIS = {
  label: '20 Rue des Rosiers 75004 Paris',
  lat: 48.8574,
  lon: 2.3592,
}

/** Un trajet de 3 minutes à pied (187 m). */
export const TRAJET = {
  duration: 180,
  distance: 187,
  geometry: { type: 'LineString', coordinates: [[2.3522, 48.8566], [2.3526, 48.8571], [2.3527, 48.8574]] },
}

/** Une image transparente d'un pixel, pour les tuiles du fond de carte. */
export const TUILE_VIDE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
