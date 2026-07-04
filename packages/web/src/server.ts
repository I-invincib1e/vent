import app from "./api";
import { tryUpgradeVoiceSocket, voiceWebsocketHandlers } from "./api/voice/ws-route";

const port = Number(process.env.PORT ?? 3000);
const distDir = `${import.meta.dir}/../dist`;
const indexPath = `${distDir}/index.html`;

const server = Bun.serve({
  port,
  // Handles the raw Bun WS lifecycle for the Twilio Media Stream connection.
  // Kept separate from the Hono app — see voice/ws-route.ts for why.
  websocket: voiceWebsocketHandlers,
  async fetch(request, srv) {
    const url = new URL(request.url);

    if (tryUpgradeVoiceSocket(request, srv)) {
      // `upgrade()` takes over the connection; no HTTP response needed here.
      return undefined as unknown as Response;
    }

    if (url.pathname.startsWith("/api")) {
      return app.fetch(request);
    }

    const filePath = getStaticFilePath(url.pathname);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    const index = Bun.file(indexPath);
    if (await index.exists()) {
      return new Response(index, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Build output not found. Run `bun run build` first.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
});

console.log(`Web server listening on http://localhost:${server.port}`);

function getStaticFilePath(pathname: string) {
  const cleanPath = decodeURIComponent(pathname)
    .replace(/^\/+/, "")
    .replaceAll("..", "");

  return cleanPath ? `${distDir}/${cleanPath}` : indexPath;
}
