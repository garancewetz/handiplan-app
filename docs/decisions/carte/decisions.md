tags: carte, deplacement, chargement, distance, cadrage

# Carte : la déplacer à la main

## D1 — Que se passe-t-il quand on fait glisser la carte ?

**Options** : rien (les lieux restent autour de soi), un bouton « Chercher ici », ou un chargement
automatique autour du centre de la carte.

**Choisi** (2026-11-05) : chargement automatique, 400 ms après la fin du glissement ou du zoom,
dans le même rayon qu'autour de soi (600 m), et seulement si le centre a bougé de plus de 150 m.
Les lieux déjà chargés à moins de 1,5 km restent affichés, pour que la carte ne se vide pas.
Une fois la carte déplacée à la main, elle n'est plus recadrée quand des lieux arrivent : seul un
nouveau chemin, une nouvelle adresse ou « Annuler » la recadrent.

**Écarté**
- Ne rien faire : la carte paraissait vide ailleurs, comme si l'appli ne connaissait rien.
- Un bouton « Chercher ici » : un geste de plus, et une décision de plus à prendre.

Le zoom fait à la main recharge de la même façon. En deçà du zoom 15 (plusieurs kilomètres à
l'écran), on ne charge rien de plus et la liste laisse place à « Zoomez pour voir les lieux » :
600 m n'en couvriraient qu'un coin, et des centaines de pastilles seraient illisibles. Les pastilles
des lieux disparaissent aussi de la carte (elles faisaient un tas illisible) ; le point de position
et le repère de l'adresse cherchée restent.

## D2 — Depuis où la liste mesure-t-elle les distances ?

**Options** : depuis le centre de la carte, ou depuis la vraie position (l'arrivée s'il y en a une).

**Choisi** : depuis la vraie position, ou l'arrivée quand on en a choisi une. La liste ne montre
que les lieux à moins de 600 m du centre de la carte (la zone regardée), triés comme avant : les
plus utiles, puis les plus proches de soi. Les voisins gardés (D1) restent seulement sur la carte.
La carte choisit ses pastilles parmi les lieux les plus proches de son centre. Sans position
connue, on mesure depuis le centre de la carte.

**Écarté** : le centre de la carte. C'est un point invisible : « 200 m » ne dirait pas à quelle
distance le lieu est de soi, alors que c'est la question qu'on se pose avant d'y aller.

## D3 — Le point de position suit-il la personne en continu ?

**Options** : un seul relevé à l'ouverture ; un suivi continu seulement pendant un trajet ; un suivi
continu tout le temps.

**Choisi** : suivi continu tout le temps (`watchPosition`). Quand on marche dans la ville, le point
doit avancer avec soi, trajet ou pas. Le point bouge à chaque relevé, mais les lieux, le cadrage et
les distances ne suivent qu'après 150 m de déplacement : sinon la liste se réordonnerait et la
carte sauterait à chaque pas. Un relevé manqué (tunnel, immeubles) garde le dernier point connu.

**Écarté** : le suivi pendant un trajet seulement, choisi d'abord pour la batterie. Le navigateur
coupe déjà le GPS quand l'appli n'est plus à l'écran, et un point figé alors qu'on avance trompe.

## D4 — Quelles pastilles dessiner quand il y a trop de lieux ?

**Contexte** : dans un restaurant noté « pas accessible » (L'Amourette, Montreuil), on ne voyait
pas sa pastille, alors que le lieu était bien dans les données. La carte prenait les lieux triés
par couleur puis par distance : les 40 places « discrètes » partaient toutes aux lieux sans info,
et les lieux gris passaient après. Même chose pour un lieu jaune dans le Marais, évincé par les
lieux verts et les places.

**Options** :
- Trier par couleur puis par distance.
- Augmenter les quotas.
- Prendre les plus proches dans chaque quota.

**Choisi** : dans chaque quota (15 utiles, 15 discrets ; 20 et 40 avant l'audit de novembre 2026,
où les pastilles se chevauchaient trop pour être lues et touchées d'un doigt), les lieux les plus proches du centre de la
carte, quelle que soit leur couleur. Le lieu devant lequel on se trouve est toujours dessiné. La
liste, elle, garde « les plus faciles d'abord ».

**Écarté** : augmenter les quotas. La carte deviendrait illisible, et le problème reviendrait dans
les quartiers plus denses.

**Remplacé (8 novembre 2026)** : les quotas autour de sa position n'étaient pas logiques. Sur
ordinateur, la carte montrait des lieux faciles et difficiles, mais aucun « pas d'info » : ils
partageaient le même quota que les difficiles. Et zoomer refaisait le choix autour d'un autre point,
des pastilles apparaissaient ou disparaissaient sans raison visible.

**Choisi** : **tout ce qui est dans le cadre de la carte**. Au-delà de 40 pastilles, les plus proches
du centre de la carte, sans quota par couleur. Zoomer sur une rue montre ses lieux ; éloigner montre
ceux d'à côté. La place où l'on se gare reste toujours visible.

## D5 — À quelle distance la carte s'ouvre-t-elle ?

**Contexte** : en ouvrant l'appli dans un quartier, il fallait toujours zoomer un peu. La carte
cadrait les 4 lieux « les plus utiles » (les plus faciles d'abord), parfois à 300 m : elle s'ouvrait
au zoom 16, voire moins. Et après avoir zoomé puis glissé la carte, « Ma position » remettait ce
cadrage : il fallait rezoomer.

**Choisi** :
- **Centrée sur soi, juste assez large pour voir le lieu le plus proche**, au zoom 18 au plus (la
  rue). Dans un quartier dense : zoom 18 ; si le café le plus proche est à 100 m : zoom 17.
- **Un zoom fait à la main est retenu** tant que l'appli est ouverte : « Ma position » revient sur
  soi à ce zoom-là. Glisser la carte sans zoomer ne change rien.

**Écarté** :
- Cadrer les 2 lieux les plus proches : souvent de part et d'autre, la carte reculait d'un cran.
- Toujours le zoom 18 : là où rien n'est à moins de 60 m, la carte s'ouvrait vide.
- Des demi-crans de zoom : le plan IGN s'affiche mal entre deux niveaux.

## D6 — Garder les quartiers déjà vus sur le téléphone

**Contexte** : les données préparées chaque lundi (site Netlify) ont été supprimées ; l'appli
interroge OSM et Acceslibre en direct. La mémoire du téléphone gardait chaque chargement au point
près (≈ 100 m) dans localStorage : 100 m plus loin, elle ne servait plus, et un seul quartier dense
d'Acceslibre (plus de 100 colonnes par lieu) remplissait les 5 Mo disponibles.

**Choisi** :
- **Des quartiers d'environ 280 m sur 180 m** (grille de 0,0025°), gardés 7 jours dans la base du
  navigateur (IndexedDB). Les quartiers déjà vus s'affichent tout de suite ; seuls les manquants sont
  demandés, en une fois.
- **Gardé depuis plus d'un jour** : affiché quand même, puis remis à jour en arrière-plan.
- **Seulement ce que l'appli lit** : les étiquettes OSM de `ETIQUETTES_OSM`, les colonnes de
  `COLONNES_ACCESLIBRE`.
- **Acceslibre page par page** (200 lignes par page, 5 pages au plus) : avant, une seule page de 200
  lignes tronquait les quartiers denses.
- Les données préparées restent lues en premier si elles reviennent un jour.

Mesuré à l'Hôtel de Ville de Paris : premier chargement 3,6 s, rechargement 1,2 s (page comprise).

**Écarté** :
- Refaire tout de suite les données du lundi : un site et des crédits Netlify chaque semaine.
- Des quartiers de 1 km : la première fois, on chargeait trois fois plus large que le voisinage
  (9,6 s).
