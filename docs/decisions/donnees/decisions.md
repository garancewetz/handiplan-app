tags: sources, open-data, api, fusion, cache, donnees-preparees, itineraire, geofabrik, recherche

# Données : d'où viennent les lieux et les places

## D1 — Quelle source pour les places handicapées ?

**Options**
- Un fichier national des places handicapées.
- L'open data de chaque ville (Paris, métropole de Lyon, Nevers, Roubaix…).
- OpenStreetMap (`parking_space=disabled`, `capacity:disabled`).

**Choisi** : OpenStreetMap, environ 102 000 places en France (novembre 2026), interrogeable
partout avec une seule requête.

**Écarté**
- Fichier national : il n'existe pas. La page du ministère sur l'accessibilité du stationnement
  ne liste aucune place, et l'ancienne Base nationale des lieux de stationnement n'est plus tenue.
- Open data des villes : format différent dans chaque ville. À ajouter ville par ville plus tard,
  en complément d'OSM.

## D2 — Comment interroger Acceslibre ?

**Options**
- L'API Acceslibre officielle.
- Télécharger le fichier national (environ 500 Mo) et le découper.
- L'API tabulaire de data.gouv.fr sur ce même fichier.

**Choisi** : l'API tabulaire, filtrée par zone (`latitude__greater`…) et par
`sanitaires_adaptes__exact=true`. Elle répond en environ 3 s, sans clé. (Mis à jour en D11 : toutes les
activités retenues, filtrées par `activite__in`.)

**Écarté**
- API officielle : demande un compte et une clé obtenue via un formulaire.
- Fichier complet : trop lourd pour un téléphone, et il faudrait un serveur pour le découper.

## D3 — Quels lieux Acceslibre garder ?

**Options** : tous les établissements, ou seulement ceux où l'on peut entrer librement.

**Choisi** : liste blanche d'activités (restaurants, cafés, boulangeries, supermarchés, musées,
bibliothèques, cinémas, hôtels, mairies…), dans `description-acceslibre.utils.ts`. (Mis à jour en D11 :
seulement cafés, restaurants et toilettes publiques, par leur nom exact.)

**Écarté** : tous les établissements. Avocats, dentistes ou coiffeurs ont des toilettes adaptées,
mais on y vient sur rendez-vous : y envoyer quelqu'un qui cherche des toilettes serait un piège.

## D4 — Que faire quand un lieu est dans les deux bases ?

**Options** : l'afficher deux fois, garder OSM, garder Acceslibre, ou fusionner.

**Choisi** : fusionner (même lieu à moins de 40 m, nom ressemblant). On garde la description
Acceslibre, plus détaillée sur l'entrée et les toilettes, et le nom OSM, plus soigné. (Mis à jour en D11 pour
reconnaître le même lieu, et en D12 quand les deux bases se contredisent.)

**Écarté** : afficher deux fois (déroutant), ou garder une seule source (on perdrait soit le
détail, soit la qualité du nom). Les places ne sont jamais fusionnées : deux places voisines
sont bien deux places.

## D5 — Que faire quand Overpass est saturé ?

**Options** : un seul serveur, plusieurs serveurs en relais, ou un serveur à nous.

**Choisi** : d'abord des données préparées à l'avance (D6). En secours : trois serveurs publics en
relais (15 s maximum chacun), chaque source affichée dès qu'elle répond, chaque zone gardée 7 jours
sur le téléphone, et un mode `?demo` avec des données OSM enregistrées du centre de Paris.

**Écarté** : un serveur à nous. C'est trop lourd pour un projet personnel.

**Mis à jour (8 novembre 2026)** : les données préparées n'existent plus (site supprimé) et, ce
jour-là, les trois serveurs internationaux étaient tous en panne (« surchargé », 504, pas de
réponse) : l'appli ne montrait que les lieux d'Acceslibre, une petite partie des bars et restos.
Le serveur d'OpenStreetMap France (`overpass.openstreetmap.fr`, toute la France) répondait : il passe
en premier, 20 s maximum par serveur. Les quartiers déjà vus restent gardés sur le téléphone
(carte, D6), et le message dit ce qui manque : « OpenStreetMap ne répond pas : il manque des cafés,
des restos et les places handicapées », avec « Réessayer ».

## D6 — Interroger les serveurs en direct, ou préparer les données à l'avance ?

**Options**
- En direct à chaque ouverture (Overpass + data.gouv).
- Un proxy à nous (fonction Netlify) avec un cache.
- Préparer chaque semaine toute la France, découpée en zones, et servir des fichiers statiques.

**Choisi** : la préparation hebdomadaire (`scripts/prepare-data.mjs`, lancé par
`.github/workflows/data.yml`, OpenStreetMap lu dans les extraits Geofabrik, voir D8), découpée en zones de 0,02° (environ 2 km) et publiée sur un site Netlify à
part (`handiplan-data`). L'appli lit l'index, puis les 1 à 4 zones autour d'elle. Le direct
ne sert plus que de secours.

**Écarté**
- Le direct seul : en novembre 2026, Overpass ne répondait parfois pas du tout et data.gouv
  mettait 20 s, d'où une appli bloquée.
- Le proxy : il dépend toujours des mêmes serveurs à la première demande, et il ajoute du code
  serveur à maintenir.
- Publier les données avec l'appli, sur le même site : chaque déploiement de l'appli écraserait
  les données, ou les données obligeraient à redéployer l'appli chaque semaine.

Conséquence acceptée : les données ont jusqu'à une semaine de retard.

**Mis à jour (novembre 2026)** : le site des données préparées a été supprimé, et l'appli ne les
lit plus. Elle interroge Overpass et data.gouv en direct, et garde les quartiers déjà vus sur le
téléphone (carte, D6). Le script (`scripts/prepare-data.mjs`) et sa tâche GitHub restent, désactivés
(lancement à la main seulement), au cas où les serveurs publics deviendraient trop peu fiables.

## D7 — Calculer le chemin dans l'appli, ou tout confier à une appli GPS ?

**Options** : ouvrir directement Google Maps, faire tout le guidage dans l'appli, ou afficher le
chemin dans l'appli puis confier le guidage vocal à l'appli GPS de son choix.

**Choisi** : le chemin et la durée sont affichés dans l'appli (itinéraire IGN, gratuit et sans
clé), la position est suivie pendant le trajet, et « Démarrer le guidage » ouvre Plans, Waze ou
Google Maps. Le choix est retenu sur le téléphone.

**Écarté**
- Ouvrir directement Google Maps : on quittait l'appli sans voir où l'on allait.
- Tout faire dans l'appli : le guidage vocal en voiture (recalcul, circulation) représente des mois
  de travail, et c'est une question de sécurité au volant.

## D8 — Pour la préparation, Overpass ou les extraits Geofabrik ?

**Options** : interroger Overpass carré par carré, ou télécharger les extraits quotidiens de
Geofabrik (France et outre-mer) et les filtrer avec osmium.

**Choisi** : Geofabrik et osmium. `osmium tags-filter` fait un tri large, puis
`scripts/lib/prepare.mjs` applique les critères exacts de l'appli (`keepOsm`) et calcule un
point par lieu (`centerOf`).

**Écarté** : Overpass. Le test sur une seule zone de Paris a mis 13 minutes, presque entièrement
à attendre un serveur saturé. Pour la France entière, cela aurait demandé environ 180 requêtes au
même serveur.

## D9 — Comment proposer des suggestions dans la recherche ?

**Options** : le géocodeur seul, ou le géocodeur plus les lieux déjà chargés.

**Choisi** : les lieux déjà chargés dont le nom correspond (« Feria Café ») en premier, puis les
adresses et lieux connus (gares, mairies) du géocodeur de la Géoplateforme, en mode
autocomplétion et classés par proximité. Le géocodeur n'est interrogé qu'après une pause de
250 ms dans la frappe, et à partir de 3 lettres.

**Écarté** : le géocodeur seul. Il ne connaît pas les bars et cafés par leur nom, alors que c'est
souvent ainsi qu'on les cherche.

## D10 — Utiliser Google Places pour compléter l'accessibilité ?

Étude du 2026-11-04, sans code. Google Places (API « New ») renseigne souvent l'entrée, les
toilettes et le parking accessibles en fauteuil (`accessibilityOptions`).

**Ce que disent les règles de Google** ([politiques Places API](https://developers.google.com/maps/documentation/places/web-service/policies))
- Des résultats Places affichés **sur une carte** doivent l'être sur une carte Google : c'est
  incompatible avec nos pictos sur le plan IGN.
- Ils peuvent être affichés **sans carte** (par exemple dans la fiche d'un lieu), avec le logo
  Google.
- Interdiction de stocker ou précharger le contenu, sauf l'identifiant du lieu : c'est
  incompatible avec les données préparées et la mémoire de 7 jours.
- Payant au-delà d'un quota gratuit mensuel. Le tarif exact des champs d'accessibilité n'a pas pu
  être confirmé : à vérifier sur la page de tarifs de Google Maps Platform avant de s'engager.

**Options**
- Ne pas utiliser Google.
- Une requête Google seulement quand on ouvre la fiche d'un lieu « à vérifier » ou « inconnu »,
  affichée en texte dans la fiche avec le logo Google, jamais sur la carte ni en mémoire.
- Passer toute la carte sur Google Maps.

**Choisi pour l'instant** : ne pas utiliser Google. Si la couverture reste insuffisante une fois
les données préparées en ligne, la deuxième option est la seule compatible : compte Google Cloud
avec facturation, clé restreinte aux adresses de l'appli, et budget plafonné.

**Écarté** : passer sur Google Maps (coût à chaque affichage, perte du plan IGN, fin des données
préparées).

## D11 — Tout Acceslibre, et reconnaître un même lieu sans se tromper (novembre 2026)

**Contexte** : mesuré autour de l'Hôtel de Ville de Paris, le 9 novembre 2026.
- On ne récupérait que les lieux Acceslibre avec toilettes adaptées ou marches à l'entrée : 210 sur
  452 cafés, restos et toilettes. 196 autres disaient « entrée sans marche » et n'arrivaient jamais,
  alors que c'est l'information la plus utile quand on marche avec difficulté.
- Les activités étaient reconnues par des motifs : « bar » attrapait « Barbier », « restaura »
  attrapait « Restaurant scolaire » et « Personnes âgées : foyer restaurant ».
- Deux lieux étaient « le même » si leur nom commençait par le même mot : « Le Bistrot » et « Le Marais
  Café » à 30 m étaient fusionnés, et l'un prenait l'accessibilité de l'autre (« La Table des
  Gourmets » s'affichait « Difficile » à cause d'un voisin).
- Acceslibre a souvent deux fiches pour un même lieu, au même endroit (« Eataly » en Restaurant,
  « EATALY PARIS MARAIS » en Restauration rapide).

**Options pour reconnaître un même lieu**
- Le SIRET (`ref:FR:SIRET` dans OSM) : le fichier public d'Acceslibre n'en a aucun (0 sur 200).
- L'identifiant des bâtiments (`rnb_id`, rempli à 77 %) : il faudrait savoir dans quel bâtiment est
  chaque lieu d'OSM, trop lourd pour un téléphone.
- Le nom, la distance et l'adresse (numéro et rue remplis à 98 % dans Acceslibre, `addr:*` dans OSM).

**Choisi**
- Tous les cafés, restaurants et toilettes publiques d'Acceslibre, filtrés par le serveur
  (`activite__in`, les noms entre guillemets car ils contiennent des virgules), par leur nom exact :
  Restaurant, Restauration rapide, Hôtel restaurant ; Café, bar, brasserie, Bar tabac, Salon de thé ;
  Toilettes publiques. Les pages arrivent ensemble, après la première qui dit combien il y en a.
- Même lieu : des noms qui se ressemblent (mots communs, sans les petits mots ni les mots du métier,
  sans accents ni lettres doublées) à moins de 40 m ; ou la même adresse et un mot commun à moins de
  80 m ; ou exactement le même nom à moins de 100 m. Chaque lieu n'est apparié qu'une fois, au plus
  ressemblant. Les fiches Acceslibre en double n'en font qu'une, la plus complète.
- En fusionnant, pour l'entrée et pour les toilettes, la source qui sait l'emporte sur celle qui ne
  sait pas.

**Résultat** au même endroit : 691 lieux au lieu de 669, 23 « Pas d'info » de moins, aucun barbier,
aucune fiche Acceslibre en double.

**Reste ouvert**
- Quand OSM et Acceslibre se contredisent : voir D12.
- OSM a parfois deux points pour le même lieu (« Le Bûcheron », « La Dame de Paris ») : on ne les
  fusionne pas, pour ne pas cacher un vrai second établissement. À corriger dans OSM.

## D12 — Quand OSM et Acceslibre se contredisent (novembre 2026)

**Contexte** : en reconnaissant mieux les mêmes lieux (D11), des contradictions sont apparues. Restaurant
Bayan : OSM « marche haute » (`wheelchair=no`), Acceslibre « entrée sans marche ». Le Dernier Bar avant
la Fin du Monde : OSM « toilettes non adaptées », Acceslibre « toilettes adaptées ». Acceslibre
l'emportait toujours, et le lieu pouvait s'afficher « Facile ».

**Options**
- Acceslibre l'emporte : il est détaillé, mais souvent rempli par l'établissement lui-même.
- OSM l'emporte : rempli par des bénévoles, parfois sans être venus, parfois ancien ; `wheelchair=no`
  veut seulement dire « marche de plus de 7 cm ».
- La plus récente : le fichier public d'Acceslibre n'a pas de date.
- Ne donner raison à personne, et le dire.

**Choisi** : ne donner raison à personne. Si les deux bases disent quelque chose de différent sur
l'entrée ou sur les toilettes :
- le lieu est « Attention » (orange), jamais « Facile » ;
- la fiche le dit : « Entrée : les infos ne sont pas d'accord », puis « OpenStreetMap : marche haute
  ou escalier à l'entrée · Acceslibre : entrée sans marche » ; les autres détails restent (une porte,
  une rampe) ;
- le conseil : « Les infos ne sont pas d'accord : à vérifier sur place. »

Fidèle à « ne rien inventer », et le plus sûr : mieux vaut vérifier que trouver une marche devant un
lieu annoncé « Facile ». Quand une seule base sait, elle l'emporte toujours (D11).

**Mis à jour le 9 novembre 2026, après une revue critique** (mesurée sur les vraies données autour de
l'Hôtel de Ville) : 35 lieux réunis sur 80 affichaient « pas d'accord », dont 5 vrais désaccords
seulement ; et deux réponses « une marche » faisaient passer un lieu de « Difficile » à « Attention ».
- **Seuls les vrais contraires sont des désaccords** : « sans marche » (ou rampe, ascenseur) contre
  « marches » ; « toilettes adaptées » contre « non adaptées ». « Petite marche » contre « sans
  marche » ou contre « marche haute » : pas de bandeau, on garde la réponse la plus prudente.
  Résultat : 4 désaccords sur 80 au lieu de 35.
- **Des toilettes publiques ne sont jamais réunies avec un café ou un resto**, même à la même adresse
  (une Sanisette disparaissait, avalée par le café voisin).
- **Deux fiches Acceslibre du même lieu sont réunies comme OSM et Acceslibre** : celle qui sait
  l'emporte, un vrai désaccord est dit (« Une fiche Acceslibre : … · une autre : … »). Avant, on gardait
  celle qui avait le plus de lignes, même si elle ne savait rien de l'entrée.
- **Le lieu réuni garde la position et le type d'OSM** (plus précis), et les détails d'entrée des deux
  sources (largeur de porte, sonnette…).

## D13 — Un module de rapprochement à part, rodé sur quatre endroits (novembre 2026)

**Contexte** : le rapprochement OSM / Acceslibre travaillait sur les lieux de Handiplan déjà mis en
phrases, et n'avait été mesuré que sur un quartier de Paris. Une autre appli (cartes.app) s'y
intéresse : il faut qu'il puisse servir ailleurs, et qu'il soit éprouvé.

**Choisi**
- `src/features/lieux/utils/rapprochement.utils.ts` ne prend que des données brutes (un élément OSM,
  une fiche Acceslibre, via `depuisOsm` et `depuisAcceslibre`) et rend des paires (`apparier`) ou des
  groupes (`regrouper`). Rien n'y dépend de l'affichage. `fusion-lieux.utils.ts` s'en sert, et ne
  fait plus que réunir ce que disent les deux descriptions.
- Un désaccord est un champ (`desaccord`) et plus une phrase cherchée dans les lignes.
- Rodé sur de vraies données de quatre endroits (`mocks/rapprochement`) : l'Hôtel de Ville de Paris,
  le centre de Tours, le centre de Montreuil, Sarlat. Toutes les paires aux noms différents (92) et
  tous les regroupements ont été relus à la main ; les cas difficiles et le nombre de paires de
  chaque endroit sont des tests (`rapprochement.reel.test.ts`).

**Ce que le rodage a changé**
- Les **mots courants de l'endroit** (présents dans au moins 3 noms : « marais », « beaubourg »,
  « halles », « tours ») sont ignorés : « Café du Marais » n'est plus « Kyo Marais ».
- **Une faute de frappe par mot** est tolérée (« Coupe Gorge » / « Coup Gorge », « Kebab » /
  « Kebap »), seulement sur les mots d'au moins 4 lettres : « Dong » n'est pas « Dog ».
- **Le même nom** : les mêmes mots qui comptent (« Filippo » / « Restaurant Filippo »), ou les mêmes
  lettres collées sans les petits mots (« Eat Day » / « EatDay »).
- Les mots vides étaient comparés sans être simplifiés comme les noms : « brasserie », « toilettes »
  n'étaient jamais ignorés. Corrigé ; « bistrot » et « pub » s'y ajoutent.
- Adresses : « 11 bis » / « 11B », « 31-35 » / « 35 », plusieurs numéros (« 35;39bis »).
- Un nom fait seulement de mots de métier (« Restaurant ») ne ressemble à rien.
- Chaque nom n'est découpé qu'une fois : 41 ms pour 594 lieux OSM × 372 fiches (122 ms avant).

**Écarté, à dessein** : retrouver « Buon Gusto » / « Bon Gusto » ou « Le Bistrot » / « Le bistrot
Sarlat ». Il faudrait tolérer davantage, au risque de réunir deux lieux différents : on préfère rater
une paire que d'afficher l'accessibilité d'un autre lieu. La comparaison du site web n'est pas faite.

