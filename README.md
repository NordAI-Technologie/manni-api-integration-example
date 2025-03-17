# Démo d'intégration de l'API de Manni

Cette application Next.js démontre comment intégrer l'API de transcription de Manni dans une application web.

## Configuration

1. Créez un fichier `.env.local` à la racine du projet et configurez les variables d'environnement :
   ```
   NEXT_PUBLIC_API_ENDPOINT=https://votre-api-endpoint.com
   NEXT_PUBLIC_API_KEY=votre-api-key
   ```

2. Installez les dépendances :
   ```
   npm install
   ```

3. Lancez le serveur de développement :
   ```
   npm run dev
   ```

4. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Technologies utilisées

- Next.js avec App Router
- TypeScript
- Tailwind CSS
- React Hooks

## Structure du projet

- `/app` - Pages et layouts de l'application (architecture App Directory)
- `/components` - Composants React réutilisables
- `/services` - Services d'API et utilitaires
- `/types` - Types et interfaces TypeScript globaux