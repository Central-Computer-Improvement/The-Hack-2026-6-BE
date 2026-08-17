/**
 * WebSocket Chat Proxy
 * ====================
 * Proxies client WebSocket connections to the DeepTutor AI microservice
 * at ws://127.0.0.1:8001/api/v1/ws
 *
 * Supported client message types (forwarded transparently):
 *   message / start_turn — start a new AI turn
 *   ping                  — heartbeat (pong returned by DeepTutor)
 *   subscribe_turn        — subscribe to a running turn stream
 *   subscribe_session     — subscribe to the active session stream
 *   resume_from           — resume after reconnection
 *   unsubscribe           — stop a subscription
 *   cancel_turn           — cancel a running turn
 *   submit_user_reply     — deliver answer to a paused turn
 *   regenerate            — re-run the last user message
 *   check_active_turn     — check if a session has a live turn
 *   user_input            — deliver input to the stream bus
 *
 * DeepTutor auth:
 *   If DEEPTUTOR_AUTH_TOKEN is set in the environment, the proxy injects it
 *   as a Bearer token header when connecting upstream.
 */

const WebSocket = require("ws");

const UPSTREAM_WS_URL =
  process.env.DEEPTUTOR_WS_URL || "ws://127.0.0.1:8001/api/v1/ws";

/**
 * Attach the WebSocket proxy to an existing http.Server (returned by
 * app.listen()). Call this after Express starts listening.
 *
 * @param {import("http").Server} httpServer
 */
function attachChatProxy(httpServer) {
  const wss = new WebSocket.Server({ noServer: true });

  // Upgrade requests to /api/chat/ws are handed off to our proxy
  httpServer.on("upgrade", (req, socket, head) => {
    if (req.url !== "/api/chat/ws") {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (clientWs) => {
      wss.emit("connection", clientWs, req);
    });
  });

  wss.on("connection", (clientWs, req) => {
    // Build upstream headers (auth injection)
    const upstreamHeaders = {};
    const token = process.env.DEEPTUTOR_AUTH_TOKEN;
    if (token) {
      upstreamHeaders["Authorization"] = `Bearer ${token}`;
    }

    // Open upstream connection to DeepTutor
    const upstream = new WebSocket(UPSTREAM_WS_URL, { headers: upstreamHeaders });

    // Buffer messages that arrive before upstream is open
    const clientBuffer = [];
    let upstreamReady = false;

    upstream.on("open", () => {
      upstreamReady = true;
      // Flush buffered client messages
      for (const buffered of clientBuffer) {
        upstream.send(buffered);
      }
      clientBuffer.length = 0;
    });

    // ── Forward upstream → client ───────────────────────────────────────────
    upstream.on("message", (data) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data.toString());
      }
    });

    upstream.on("error", (err) => {
      console.error("[ChatProxy] Upstream DeepTutor WS error:", err.message);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            content: `AI microservice connection error: ${err.message}`,
          })
        );
      }
    });

    upstream.on("close", (code, reason) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(code, reason);
      }
    });

    // ── Forward client → upstream ───────────────────────────────────────────
    clientWs.on("message", (data) => {
      const raw = data.toString();

      // Optional: inject user context from the Express side
      // (for future JWT-based enrichment)
      if (!upstreamReady) {
        clientBuffer.push(raw);
        return;
      }

      if (upstream.readyState === WebSocket.OPEN) {
        upstream.send(raw);
      }
    });

    clientWs.on("error", (err) => {
      console.error("[ChatProxy] Client WS error:", err.message);
    });

    clientWs.on("close", () => {
      if (
        upstream.readyState === WebSocket.OPEN ||
        upstream.readyState === WebSocket.CONNECTING
      ) {
        upstream.close();
      }
    });
  });

  console.log("🔌 WebSocket chat proxy mounted on /api/chat/ws");
  return wss;
}

module.exports = { attachChatProxy };
