# Démo d’intégration de l’API Manni

Application Next.js illustrant le contrat SID existant : **upload → lancement confirmé → suivi → résultat**. La clé Manni et la destination de l’API sont configurées exclusivement sur le serveur Next.js. Le navigateur n’envoie ni clé Manni ni adresse de serveur à contacter.

## Démarrer localement

Node.js 22.18 ou supérieur est requis.

```sh
cp .env.example .env.local
npm ci
npm run dev
```

Renseigner dans `.env.local` les valeurs fournies pour votre intégration :

```dotenv
API_ENDPOINT=https://votre-service-sid.example
API_KEY=votre-cle-api-existante
DEMO_ACCESS_USERNAME=manni
DEMO_ACCESS_PASSWORD=un-mot-de-passe-distinct-pour-cette-demo
```

Ouvrir [http://127.0.0.1:3000](http://127.0.0.1:3000). Le navigateur demande les identifiants de démonstration si `DEMO_ACCESS_PASSWORD` est défini. Ces identifiants sont indépendants de la clé Manni. La configuration est chargée au runtime : redémarrer le serveur après modification.

Le serveur de développement et `npm run start` écoutent sur `127.0.0.1` par défaut. Sans mot de passe, seul le mode développement/test autorise les requêtes. **En production, l’absence de `DEMO_ACCESS_PASSWORD` ferme l’accès (503)**, même si le Host prétend être localhost. Utiliser HTTPS avec un reverse proxy pour un hébergement partagé. Le proxy doit transmettre à Next.js le protocole externe réel; les mutations exigent le même protocole et le même Host que le navigateur, sans faire confiance à `x-forwarded-host`. La vérification d’accès est appliquée au middleware et à la route API elle-même. Ne pas publier une démo ouverte utilisant une clé partagée : les utilisateurs autorisés peuvent consommer les ressources de cette intégration.

Cette authentification simple protège un exemple mono-intégration. Pour intégrer le code dans votre application, remplacer la protection de démonstration par votre session serveur et votre contrôle d’accès par utilisateur/organisation. Le stockage des credentials et l’appel SID restent côté serveur.

## Migration depuis une ancienne version de l’exemple

1. Remplacer `NEXT_PUBLIC_API_ENDPOINT` et `NEXT_PUBLIC_API_KEY` par `API_ENDPOINT` et `API_KEY` dans la configuration serveur. Les anciens noms ne sont plus lus.
2. Retirer les variables publiques du service d’hébergement, reconstruire et redéployer le bundle. L’interface ne demande plus de clé ni d’adresse à l’utilisateur.
3. L’ancienne entrée `apiConfig` est supprimée du localStorage au chargement. La démo ne lit pas sa valeur et ne la transfère pas au serveur.
4. Si une ancienne clé a été publiée dans un bundle ou partagée, coordonner sa rotation avec le propriétaire de l’intégration. Cette PR ne révoque aucune clé existante et ne modifie ni la facturation ni le service SID.

## Contrat conservé avec SID

| Opération | Appel serveur vers SID |
|---|---|
| Envoyer l’audio | `POST /api/upload`, multipart `file`, réponse `file_id` |
| Démarrer | `POST /api/transcribe/{file_id}`, JSON `language`, `language_hint`, `num_speakers`, `min_speakers`, `max_speakers` |
| Suivre | `GET /api/transcribe/{file_id}/status` |

Tous les appels ajoutent le header `x-api-key` depuis `API_KEY` côté serveur. Les UUID actuels et les anciens IDs `timestamp_nom-de-fichier` restent pris en charge. La démo encode l’ID comme un segment unique et bloque les chemins arbitraires. Les headers navigateur `x-api-endpoint` et `x-api-key` sont refusés : ils ne peuvent pas remplacer la configuration. Les redirections upstream sont refusées pour ne pas transmettre la clé à un autre serveur.

Le navigateur appelle `/api/transcription-proxy?path=…` sur la même origine. Le proxy attend la réponse réelle du lancement, conserve les codes HTTP et les réponses JSON de SID, et ne fabrique ni progression ni succès. Les erreurs de transport deviennent 502/504; une erreur d’accès ou un fichier inconnu ne deviennent jamais un statut `pending`. Les mutations cross-origin sont refusées.

## Suivi et erreurs

- Les petits et gros fichiers utilisent le même parcours asynchrone; aucune durée n’est déduite de la taille du fichier.
- États reconnus : `queued`, `pending`, `processing`, `completed`, `failed`. La progression reste indéterminée quand SID n’en fournit pas.
- Le suivi est limité à 30 minutes, avec intervalle progressif de 2 à 10 secondes. Les erreurs transitoires 429/502/503/504, réseau ou timeout sont réessayées au plus cinq fois de suite. Les autres erreurs arrêtent le suivi.
- « Arrêter le suivi » annule les requêtes/timers côté navigateur, **pas** le traitement déjà accepté. « Reprendre le suivi » utilise le même `file_id` sans renvoyer l’audio ni relancer une transcription.
- Si le lancement a subi un timeout, ne pas réenvoyer automatiquement la requête : reprendre la consultation du même ID pour déterminer son état.
- Le proxy limite l’attente upstream à 120 s pour l’upload et 30 s pour les autres appels. Configurer l’hébergement/reverse proxy en conséquence. Les limites de taille de fichier et de durée du service SID restent celles de votre intégration; cette démo ne les change pas.

## Structure et validation

- `src/server/` : configuration et protection du proxy, jamais importées par les composants navigateur.
- `src/app/api/transcription-proxy/route.ts` : route Next.js Node, marquée `server-only`.
- `src/app/services/transcriptionApi.ts` : client navigateur sans secret, suivi annulable et borné.
- `src/app/components/` : démo, configuration serveur et résultats.
- `tests/` : contrat multipart/JSON, erreurs/auth/redirects, absence de secret navigateur, polling et annulation avec SID simulé.

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

La CI exécute ces vérifications sans clé réelle, sans appel à SID et sans paiement. Un test réel avec une instance SID existante reste à effectuer lors du déploiement, avec un fichier de test approuvé.
