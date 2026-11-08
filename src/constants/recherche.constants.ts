// Rayon autour de soi (ou de l'arrivée) où l'on cherche lieux et places : environ 8 minutes à pied.
export const RAYON_RECHERCHE = 600

// Quand on fait glisser la carte : on garde les lieux déjà chargés jusqu'à cette distance du
// nouveau centre, pour que la carte ne se vide pas, sans accumuler toute la ville.
export const RAYON_GARDE = 1500

// En deçà, la zone déjà chargée couvre encore l'écran : inutile de recharger.
export const DISTANCE_RECHARGE = 150

// Pause après un déplacement de la carte avant de charger, pour ne pas charger à chaque glissement.
export const ATTENTE_DEPLACEMENT = 400

// En deçà, la carte montre plusieurs kilomètres : le rayon chargé n'en couvrirait qu'un coin, et
// des centaines de pastilles seraient illisibles. On demande alors de zoomer.
export const ZOOM_MINIMUM = 15
