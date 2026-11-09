# Contribuer à Handiplan

Handiplan est un projet personnel, mais le code est ouvert à la lecture et aux remarques. Ce guide
explique comment il est organisé et les règles qu'il suit.

## Lancer

```bash
npm install
npm run dev         # puis ouvrir l'adresse affichée ; ajouter ?demo pour des données enregistrées
npm run lint
npm run typecheck
npm test            # Vitest : la logique pure (traduction des données, fusion, quartiers gardés…)
npm run test:e2e    # Playwright : les parcours de l'appli, réseau simulé (voir plus bas)
npm run build
```

`?demo` utilise des données OpenStreetMap enregistrées du centre de Paris : utile quand les serveurs
publics saturent. Pour essayer la contribution sur le serveur de test d'OSM, voir
[docs/contribuer-en-test.md](docs/contribuer-en-test.md).

## Les règles de l'interface

L'appli est pensée pour une personne après un AVC, qui n'utilise qu'une main. **La simplicité passe
avant tout le reste.**

- Gros textes (18 px minimum), gros boutons (64 px de haut, `components/button.tsx`), un seul geste
  par action, tout ce qui se touche souvent en bas de l'écran.
- Pas de jargon : « place handicapée », jamais « PMR ».
- Couleurs d'un feu, une règle unique (`color.utils.ts`) : vert = facile, orange = attention,
  rouge = difficile, blanc pointillé = pas d'info, bleu avec un P = place handicapée.
- Jamais la couleur seule : chaque état a un symbole et un mot, sur la carte comme dans la liste.
- Accessibilité : contrastes AA, contour visible au clavier, fenêtres avec `useDialog` (Échap,
  focus), messages en `role="status"` ou `"alert"`, « réduire les animations » respecté.
- **Rien d'inventé** : seulement ce que disent OpenStreetMap et Acceslibre, avec le sens exact des
  étiquettes du wiki ; quand ils ne disent rien, l'appli le dit.
- Pas de note OpenStreetMap anonyme : on modifie le lieu soi-même, avec son compte, et jamais sur la
  vraie carte sans l'avoir annoncé ([docs/bien-contribuer-a-osm.md](docs/bien-contribuer-a-osm.md)).

## Architecture

```
src/
├── main.tsx
├── app/                    # L'appli : assemble les fonctionnalités (app.tsx), barre du pouce
│                           # (thumb-bar), colonne des lieux (places-column)
├── components/             # Composants partagés : Button, Icon
├── constants/              # Constantes partagées : couleurs, icônes, boutons, rayons de recherche
├── hooks/                  # use-position, use-dialog (Échap, focus), use-swipe-to-close
├── types/                  # Types partagés (Place, Point…)
├── utils/                  # distance, formats
└── features/
    ├── map/                # Carte Leaflet : un composant par rôle (fit-view, follow-moves,
    │                       # zoom-buttons, pins), vue de la carte (use-map-view)
    ├── places/             # Chargement et fusion OSM + Acceslibre (rapprochement à part, réutilisable :
    │                       # utils/matching.utils.ts), quartiers gardés sur le téléphone
    │                       # (IndexedDB), liste, fiche, filtres, légende
    ├── itinerary/          # Barre et panneau de recherche, dictée, destinations récentes,
    │                       # trajet (IGN), guidage via Waze ou Google Maps
    ├── contribution/       # Compléter la carte : connexion OSM, questions façon StreetComplete,
    │                       # ajouter une place (serveur de test par défaut)
    ├── installation/       # Proposition d'ajout à l'écran d'accueil
    └── sources/            # Page « D'où viennent les infos »

e2e/                        # Tests de bout en bout, un fichier par parcours (*.e2e.ts)
├── support/                # test étendu (réseau toujours simulé), aides
└── data/                   # réponses simulées des services extérieurs

scripts/                    # Préparation des données à l'avance (désactivée)
docs/                       # Pourquoi l'appli, bonnes pratiques OSM, audit, décisions
```

Chaque fonctionnalité range ses fichiers par rôle : `api/` (réseau), `components/`, `hooks/`,
`utils/` (logique pure, testée), `constants/`. Ce qui ne sert qu'à une fonctionnalité reste dans son
dossier ; ce qui sert à plusieurs va dans `src/`.

## Style de code

- **Le code est en anglais** : fichiers, dossiers, fonctions, variables, types, classes CSS, codes
  (`'check'`, `'unknown'`…). **Les commentaires, la documentation, les noms des tests et l'interface
  sont en français**, la langue de l'utilisatrice. Les noms des champs d'API externes restent tels
  quels (`activite`, `numero`, `voie` d'Acceslibre ; les étiquettes OSM).
- Les clés de stockage sur le téléphone (`adresses-recentes`, `osm-jeton:`…) ne changent pas : les
  renommer ferait perdre ce qui y est gardé. Si le format d'une donnée gardée change, la relire sous
  l'ancienne forme aussi (voir `fromStored`).
- Fichiers en kebab-case, suffixés par leur rôle : `.api.ts`, `.utils.ts`, `.constants.ts`,
  `.types.ts` ; imports absolus via `~/` (alias de `src/`).
- Un fichier par composant, qui n'exporte que des composants (sinon le rechargement à chaud casse).
- `type Props = { … }` (pas d'`interface`), composants en `export function`, exports nommés.
- **React Compiler** : pas de `useMemo`, `useCallback` ni `React.memo`.
- `clsx` pour les classes conditionnelles ; hooks préfixés `use`, qui retournent un objet.
- Pas de double cast : on vérifie la forme des données à la frontière (voir `toOsmElements`).
- Commentaires : le *pourquoi*, pas le *quoi*. Fichiers : 300 lignes conseillées, 500 au plus.
- Dépendances : peu, et à version figée (pas de `^` ni `~`).

## Tests

- **Vitest** pour la logique pure, à côté du fichier testé (`*.test.ts`).
- **Playwright** pour les parcours (`e2e/*.e2e.ts`) : en local dans Chrome Canary, en CI dans
  Chromium. On trouve les éléments par leur rôle et leur nom (`getByRole`), comme un lecteur
  d'écran. Jamais de vrai réseau : tous les services sont simulés, et rien n'est jamais envoyé à la
  vraie carte OSM (les tests le vérifient).
- La CI (`.github/workflows/ci.yml`) fait foi : lint, types, tests, build et tests de bout en bout.

## Décisions

Les choix qui ne se devinent pas en lisant le code sont dans `docs/decisions/<sujet>/decisions.md` :
la question, les options, le choix et ce qui a été écarté. Les lire avant de revenir sur un choix ;
en ajouter une quand on fait un choix qu'un relecteur pourrait questionner.
