import "server-only";
import { handleProxy } from "../../../server/transcription-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = (request: Request) => handleProxy(request);
export const POST = (request: Request) => handleProxy(request);
