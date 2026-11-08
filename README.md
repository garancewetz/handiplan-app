# Handiplan

[![CI](https://github.com/garancewetz/handiplan-app/actions/workflows/ci.yml/badge.svg)](https://github.com/garancewetz/handiplan-app/actions/workflows/ci.yml)

Une carte pour sortir quand on a un handicap moteur : **quels cafés et restaurants sont faciles
d'accès autour de soi**, et **où se garer** quand on va quelque part.

Handiplan est un projet personnel, fait pour une proche après un AVC (un côté affaibli, une seule
main, elle marche). La question à laquelle l'appli répond : « est-ce que c'est galère d'y aller ? ».
Pourquoi cette appli plutôt qu'une autre : [docs/pourquoi-handiplan.md](docs/pourquoi-handiplan.md).

**L'essayer : [handiplan.garancewetz.dev](https://handiplan.garancewetz.dev)** (sur un téléphone, de préférence).

## Ce que fait l'appli

- **Autour de soi** : une carte et une liste des cafés, restaurants et toilettes publiques, les plus
  faciles d'abord. Chaque lieu dit, en mots, si c'est facile, s'il faut faire attention, si c'est
  difficile, ou si l'on ne sait pas encore.
- **La fiche d'un lieu** : la réponse d'abord (« Attention : toilettes, on ne sait pas »), puis
  l'entrée, les toilettes, le stationnement, et les détails (marches, main courante, étage…).
- **Aller quelque part** : on cherche une adresse ou n'importe quel lieu (café, gare, hôpital,
  centre de santé, mairie…), au clavier ou à la voix ; l'appli montre les cafés et les places
  handicapées du quartier. « Me garer ici » ouvre Waze ou Google Maps vers la place.
- **Compléter la carte** : avec son compte OpenStreetMap, on répond à deux questions sur ce qu'on voit
  (des marches ? des toilettes adaptées ?), comme dans StreetComplete. Pour l'instant, sur le serveur
  de test d'OSM seulement : [docs/contribuer-en-test.md](docs/contribuer-en-test.md) explique comment
  l'essayer.

## D'où viennent les données

| Données | Source | Licence |
|---|---|---|
| Lieux, places handicapées, accessibilité | [OpenStreetMap](https://www.openstreetmap.org), via Overpass (d'abord le serveur d'OpenStreetMap France) | ODbL |
| Accessibilité détaillée (marches, toilettes, mains courantes…) | [Acceslibre](https://acceslibre.beta.gouv.fr), fichier national sur data.gouv.fr | Licence Ouverte |
| Fond de carte, adresses, trajets | IGN, via la Géoplateforme | Licence Ouverte |
| Lieux par leur nom | [Photon](https://photon.komoot.io) (OpenStreetMap) | ODbL |

L'appli ne lit que les étiquettes d'OSM qui décrivent le handicap, avec leur sens exact du wiki
(`wheelchair`, `toilets:wheelchair`, `parking_space=disabled`…). Comment elle suit les bonnes
pratiques d'OpenStreetMap : [docs/bien-contribuer-a-osm.md](docs/bien-contribuer-a-osm.md).

**Vie privée** : la position reste dans le navigateur. Seuls le centre de la recherche (pour trouver
les lieux autour) et le texte tapé (pour chercher une adresse) partent vers ces services. Les
quartiers déjà vus et les destinations récentes restent sur le téléphone.

## Lancer

Il faut Node.js 20 ou plus récent.

```bash
npm install
npm run dev          # ajouter ?demo à l'adresse pour des données enregistrées du centre de Paris
npm test             # tests de la logique
npm run test:e2e     # tests de bout en bout (Playwright)
```

Conventions, architecture et tests : [CONTRIBUTING.md](CONTRIBUTING.md). Les choix et leurs raisons :
[docs/decisions/](docs/decisions/).

## Technique

React 19 (avec le React Compiler), TypeScript, Vite, Tailwind CSS 4, Leaflet. Aucun serveur à nous :
l'appli est un site statique qui interroge directement les services publics.

## Licence

Le code est sous licence [MIT](LICENSE). Les données restent sous leurs propres licences (voir le
tableau ci-dessus) ; l'appli les cite dans la page « D'où viennent les infos ».
