"use client";
import { useState, type ChangeEvent } from "react";
import { useTranscription } from "../services/api-client";
import { useApiConfig } from "./ApiConfigProvider";
import ApiConfigForm from "./ApiConfigForm";

const button =
  "rounded-md bg-[#209e67] px-4 py-2 text-white hover:bg-[#1c8a59] disabled:opacity-50";
const input =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900";

export default function TranscriptionDemo() {
  const { isConfigured } = useApiConfig();
  const {
    fileId,
    status,
    progress,
    result,
    error,
    reset,
    stop,
    resume,
    processAudioFile,
  } = useTranscription();
  const [tab, setTab] = useState<"demo" | "code" | "doc">("demo");
  const [fileName, setFileName] = useState("");
  const [language, setLanguage] = useState("");
  const [numSpeakers, setNumSpeakers] = useState("");
  const [minSpeakers, setMinSpeakers] = useState("");
  const [maxSpeakers, setMaxSpeakers] = useState("");
  const busy = ["uploading", "transcribing", "polling"].includes(status);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    await processAudioFile(file, {
      language: language || null,
      num_speakers: numSpeakers ? Number(numSpeakers) : null,
      min_speakers: minSpeakers ? Number(minSpeakers) : null,
      max_speakers: maxSpeakers ? Number(maxSpeakers) : null,
    });
    event.target.value = "";
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(
      new Blob([result.text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName || "transcription"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="mx-auto max-w-5xl text-gray-800">
      <nav aria-label="Démonstration" className="mb-6 flex flex-wrap gap-3">
        {(["demo", "code", "doc"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={
              tab === value ? button : "rounded-md bg-gray-100 px-4 py-2"
            }
          >
            {value === "demo"
              ? "Démo interactive"
              : value === "code"
                ? "Code d’intégration"
                : "Documentation"}
          </button>
        ))}
      </nav>
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {tab === "demo" && (
          <>
            <h2 className="mb-4 text-2xl font-semibold">
              Transcrire un fichier audio
            </h2>
            <ApiConfigForm />
            {isConfigured && status === "idle" && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label>
                    Langue
                    <select
                      className={input}
                      value={language}
                      onChange={(event) => setLanguage(event.target.value)}
                    >
                      <option value="">Détection automatique</option>
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="de">Deutsch</option>
                      <option value="it">Italiano</option>
                      <option value="pt">Português</option>
                    </select>
                  </label>
                  <label>
                    Locuteurs exacts
                    <input
                      className={input}
                      type="number"
                      min="1"
                      max="20"
                      placeholder="Auto"
                      value={numSpeakers}
                      onChange={(event) => setNumSpeakers(event.target.value)}
                    />
                  </label>
                  <label>
                    Locuteurs minimum
                    <input
                      className={input}
                      type="number"
                      min="1"
                      max="20"
                      placeholder="Auto"
                      value={minSpeakers}
                      onChange={(event) => setMinSpeakers(event.target.value)}
                    />
                  </label>
                  <label>
                    Locuteurs maximum
                    <input
                      className={input}
                      type="number"
                      min="1"
                      max="20"
                      placeholder="Auto"
                      value={maxSpeakers}
                      onChange={(event) => setMaxSpeakers(event.target.value)}
                    />
                  </label>
                </div>
                <label className="block rounded-lg border-2 border-dashed border-[#209e67] p-8">
                  Choisir un fichier audio
                  <input
                    className="mt-3 block max-w-full"
                    type="file"
                    accept="audio/*,video/*"
                    onChange={upload}
                  />
                </label>
              </div>
            )}
            {fileId && (
              <p className="my-4 break-all text-sm">
                Identifiant du fichier : <code>{fileId}</code>
              </p>
            )}
            {busy && (
              <div role="status" aria-live="polite" className="space-y-4 py-6">
                <h3 className="text-xl font-medium">
                  {status === "uploading"
                    ? "Envoi du fichier…"
                    : status === "transcribing"
                      ? "Demande de transcription…"
                      : "Traitement en cours…"}
                </h3>
                {progress === null ? (
                  <p>
                    Le serveur ne fournit pas de pourcentage pour cette étape.
                  </p>
                ) : (
                  <>
                    <progress value={progress} max={100} className="w-full" />
                    <p>{progress} % — progression retournée par le serveur</p>
                  </>
                )}
                <button type="button" className={button} onClick={stop}>
                  Arrêter le suivi
                </button>
                <p className="text-sm text-gray-600">
                  Arrêter le suivi ne supprime pas un traitement déjà accepté.
                </p>
              </div>
            )}
            {status === "failed" && (
              <div role="alert" className="space-y-4 rounded-lg bg-red-50 p-5">
                <h3 className="font-semibold">Le suivi n’a pas abouti</h3>
                <p>{error}</p>
                <div className="flex flex-wrap gap-3">
                  {fileId && (
                    <button type="button" className={button} onClick={resume}>
                      Reprendre le suivi de ce fichier
                    </button>
                  )}
                  <button type="button" className={button} onClick={reset}>
                    Choisir un nouveau fichier
                  </button>
                </div>
              </div>
            )}
            {status === "completed" && result && (
              <div className="space-y-5">
                <h3 className="text-xl font-medium">Transcription terminée</h3>
                <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-4">
                  {result.text || "Aucune parole transcrite."}
                </p>
                {result.segments.length > 0 && (
                  <details>
                    <summary className="cursor-pointer">
                      Segments et locuteurs
                    </summary>
                    <ul className="mt-3 space-y-3">
                      {result.segments.map((segment, index) => (
                        <li key={index}>
                          <span className="text-sm text-gray-500">
                            {segment.start.toFixed(1)}–{segment.end.toFixed(1)}{" "}
                            s · {segment.speaker || "Locuteur non identifié"}
                          </span>
                          <p>{segment.text}</p>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <div className="flex flex-wrap gap-3">
                  <button type="button" className={button} onClick={download}>
                    Télécharger le texte
                  </button>
                  <button type="button" className={button} onClick={reset}>
                    Nouveau fichier
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {tab === "code" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              Intégration avec un serveur intermédiaire
            </h2>
            <p>
              Le navigateur appelle uniquement le serveur de cette application.
              Le serveur ajoute la clé API au service Manni configuré.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              <code>{`// Dans votre composant navigateur :\nimport { processAudioFile } from './services/transcriptionApi';\n\nconst controller = new AbortController();\nconst result = await processAudioFile(file, {\n  language: 'fr',\n  min_speakers: 2,\n  max_speakers: 5,\n  signal: controller.signal,\n  onProgress: (value) => console.info(value),\n});\n// Aucun secret API dans ce composant.`}</code>
            </pre>
            <p>
              Les fichiers courts et longs utilisent le même parcours : envoyer,
              attendre la confirmation du lancement, puis consulter le statut.
            </p>
          </div>
        )}
        {tab === "doc" && (
          <div className="space-y-5">
            <h2 className="text-2xl font-semibold">Contrat SID existant</h2>
            <p>
              Les appels suivants sont effectués côté serveur avec le header{" "}
              <code>x-api-key</code>. Le secret et la destination sont définis
              dans la configuration du serveur.
            </p>
            <ul className="list-inside list-disc space-y-3">
              <li>
                <code>POST /api/upload</code> : multipart avec le champ{" "}
                <code>file</code>; retourne <code>file_id</code>.
              </li>
              <li>
                <code>POST /api/transcribe/&#123;file_id&#125;</code> : options
                de langue et locuteurs; attendre la réponse réelle avant de
                poursuivre.
              </li>
              <li>
                <code>GET /api/transcribe/&#123;file_id&#125;/status</code> :
                états <code>queued</code>, <code>pending</code>,{" "}
                <code>processing</code>, <code>completed</code> ou{" "}
                <code>failed</code>.
              </li>
            </ul>
            <p>
              Le pourcentage est optionnel. Aucun pourcentage ni résultat n’est
              calculé artificiellement dans cette démo.
            </p>
            <p>
              Le suivi dure au maximum 30 minutes et peut être repris avec le
              même identifiant. Les erreurs permanentes arrêtent le suivi; les
              erreurs réseau transitoires sont réessayées au plus cinq fois de
              suite. Un arrêt du navigateur n’annule pas le travail déjà accepté
              par SID.
            </p>
            <p>
              Cette démonstration ne change ni les tarifs, ni les contrats, ni
              les modalités de facturation des clients.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
