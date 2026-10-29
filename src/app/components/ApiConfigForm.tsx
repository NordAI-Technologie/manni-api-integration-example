"use client";
import { useApiConfig } from "./ApiConfigProvider";

export default function ApiConfigForm() {
  const { isConfigured } = useApiConfig();
  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-700">
      <h3 className="font-semibold">Connexion à Manni</h3>
      <p>
        {isConfigured
          ? "Le serveur de démonstration est configuré."
          : "La connexion doit être configurée sur le serveur avant de commencer."}
      </p>
      <p className="mt-2 text-sm">
        La clé API reste sur le serveur. Consultez le README pour configurer
        cette démonstration.
      </p>
    </div>
  );
}
