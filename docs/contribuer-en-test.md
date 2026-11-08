# Essayer la contribution sur le serveur de test d'OSM

Rien de ce qui suit ne touche la vraie carte : le serveur de test est une copie séparée, avec ses
propres comptes.

1. **Créer un compte de test** sur https://master.apis.dev.openstreetmap.org (bouton « S'inscrire »).
2. **Enregistrer l'appli**, connecté à ce compte : menu du compte → *Mes réglages* →
   *Applications OAuth 2* → *Enregistrer une nouvelle application*.
   - Nom : `Handiplan (essai)`
   - URI de redirection : `http://localhost:5173/` (et `http://localhost:5180/` si l'appli tourne sur
     ce port)
   - Application confidentielle : **décochée** (l'appli n'a pas de serveur, elle utilise PKCE)
   - Permissions : *Lire les préférences de l'utilisateur* et *Modifier la carte*
3. Copier l'**identifiant client** dans un fichier `.env.local` à la racine du projet (il n'est pas
   envoyé sur GitHub) :

   ```
   VITE_OSM_CLIENT_ID=l-identifiant-copié
   ```
4. Relancer `npm run dev`, ouvrir un lieu d'OpenStreetMap, « Modifier ou compléter », « Se connecter
   à OpenStreetMap », puis répondre aux questions.
5. Vérifier le résultat sur https://master.apis.dev.openstreetmap.org (historique du compte de test).

Pour passer un jour à la vraie carte : refaire l'étape 2 sur www.openstreetmap.org, puis ajouter
`VITE_OSM_URL=https://www.openstreetmap.org`. Seulement après en avoir parlé sur le forum.
