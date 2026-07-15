"use strict";

window.AVT_BACKEND = (function () {
  const C = window.AVT_CONFIG;
  let frame = null;
  let currentUrl = "";
  let readyPromise = null;
  let readyResolve = null;
  let readyReject = null;
  let requestCounter = 0;
  const pending = new Map();

  window.addEventListener("message", event => {
    if (!frame || event.source !== frame.contentWindow) return;
    const data = event.data || {};
    if (data.type === "AVT_BACKEND_READY") {
      readyResolve?.({ backendVersion: data.backendVersion || "" });
      clearReadyHandlers();
      return;
    }
    if (data.type !== "AVT_BACKEND_RESPONSE" || !data.requestId) return;
    const item = pending.get(data.requestId);
    if (!item) return;
    pending.delete(data.requestId);
    clearTimeout(item.timer);
    item.resolve(data.response || { ok: false, code: "EMPTY_RESPONSE", message: "Leere Serverantwort." });
  });

  function normalizeUrl(value) {
    const raw = String(value || "").trim();
    let url;
    try { url = new URL(raw); } catch { throw new Error("Bitte die vollständige Web-App-URL des Test-Backends eintragen."); }
    if (url.protocol !== "https:" || url.hostname !== "script.google.com") {
      throw new Error("Die Backend-URL muss mit https://script.google.com/ beginnen.");
    }
    if (!/^\/macros\/s\/[A-Za-z0-9_-]+\/(exec|dev)$/.test(url.pathname)) {
      throw new Error("Die URL muss eine Apps-Script-Web-App-Adresse sein und mit /exec enden.");
    }
    if (!url.pathname.endsWith("/exec")) {
      throw new Error("Bitte die bereitgestellte /exec-URL verwenden, nicht die /dev-Testadresse.");
    }
    url.search = "";
    url.hash = "";
    return url.toString();
  }

  async function connect(value) {
    const normalized = normalizeUrl(value);
    if (frame && currentUrl === normalized && readyPromise) return readyPromise;
    disconnect();
    currentUrl = normalized;

    readyPromise = new Promise((resolve, reject) => {
      readyResolve = resolve;
      readyReject = reject;
      const timeout = setTimeout(() => {
        const reject = readyReject;
        clearReadyHandlers();
        frame?.remove();
        frame = null;
        currentUrl = "";
        readyPromise = null;
        reject?.(new Error("Das Test-Backend antwortet nicht. Bereitstellung und URL prüfen."));
      }, C.requestTimeoutMs);
      const originalResolve = readyResolve;
      readyResolve = value => {
        clearTimeout(timeout);
        originalResolve(value);
      };
    });

    frame = document.createElement("iframe");
    frame.id = "avtBackendBridge";
    frame.title = "AVT Test-Backend";
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;border:0;left:-10000px;top:-10000px";
    const bridgeUrl = new URL(normalized);
    bridgeUrl.searchParams.set("bridge", "1");
    bridgeUrl.searchParams.set("parentOrigin", location.origin);
    bridgeUrl.searchParams.set("frontendVersion", C.version);
    frame.src = bridgeUrl.toString();
    frame.addEventListener("error", () => {
      const reject = readyReject;
      clearReadyHandlers();
      frame?.remove();
      frame = null;
      currentUrl = "";
      readyPromise = null;
      reject?.(new Error("Die Backend-Brücke konnte nicht geladen werden."));
    }, { once: true });
    document.body.appendChild(frame);
    return readyPromise;
  }

  async function request(action, payload = {}, sessionToken = null) {
    if (!frame || !readyPromise) throw new Error("Das Test-Backend ist noch nicht verbunden.");
    await readyPromise;
    const requestId = `req-${Date.now()}-${++requestCounter}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error("Zeitüberschreitung beim Backend-Aufruf. Internetverbindung prüfen."));
      }, C.requestTimeoutMs);
      pending.set(requestId, { resolve, reject, timer });
      frame.contentWindow.postMessage({
        type: "AVT_BACKEND_REQUEST",
        requestId,
        request: { action, payload, sessionToken }
      }, "*");
    });
  }

  async function health(url) {
    await connect(url);
    return request("health");
  }

  function disconnect() {
    pending.forEach(item => {
      clearTimeout(item.timer);
      item.reject(new Error("Backend-Verbindung wurde getrennt."));
    });
    pending.clear();
    frame?.remove();
    frame = null;
    currentUrl = "";
    readyPromise = null;
    clearReadyHandlers();
  }

  function clearReadyHandlers() {
    readyResolve = null;
    readyReject = null;
  }

  return { normalizeUrl, connect, request, health, disconnect };
})();
